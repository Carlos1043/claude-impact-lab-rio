"""
Ingest all extracted data into compstat.db (SQLite).
Run from project root: python db/ingest.py
"""
import json
import re
import sqlite3
import sys
from pathlib import Path

import pandas as pd
from shapely.geometry import Point
from shapely.geometry import shape as shp_shape
from shapely import wkt as shp_wkt

REPO = Path(__file__).resolve().parent.parent
DB_PATH = REPO / "db" / "compstat.db"
SCHEMA = REPO / "db" / "schema.sql"
# Source data is in the analysis workspace next to this repo
SOURCE = Path(__file__).resolve().parent.parent.parent / "impact-lab-rio"
DATA = SOURCE / "extracted" / "data"
RELINTS_DIR = SOURCE / "extracted" / "relints"

if not DATA.exists():
    raise SystemExit(
        f"Source data not found at {DATA}.\n"
        f"Run extraction first: ~/Developer/impact-lab-rio/work/*.py"
    )

# Rio de Janeiro city bbox (rough, generous): lat -23.10..-22.70, lon -43.80..-43.10
RIO_BBOX = dict(lat_min=-23.10, lat_max=-22.70, lon_min=-43.80, lon_max=-43.10)

# Órgão reference (from briefing matrix)
ORGAO_REF = [
    ("COMLURB", "Companhia Municipal de Limpeza Urbana", "Vegetação, lixo, limpeza"),
    ("SEOP", "Secretaria de Ordem Pública", "Comércio irregular, ordenamento, fiscalização"),
    ("RioLuz", "RioLuz", "Iluminação pública"),
    ("CET-RIO", "Companhia de Engenharia de Tráfego", "Trânsito, retenção, estacionamento"),
    ("SECONSERVA", "Secretaria de Conservação", "Mobiliário urbano, calçadas, refúgio"),
    ("SMAS", "Secretaria Municipal de Assistência Social", "PSR, uso de drogas, assistência"),
    ("SMTR", "Secretaria Municipal de Transportes", "Pontos de ônibus"),
    ("GM-RIO", "Guarda Municipal do Rio", "Praças, parques, motos no passeio"),
    ("SMS", "Secretaria Municipal de Saúde", "Saúde, vacinação"),
]


# ──────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────

def conn_create() -> sqlite3.Connection:
    if DB_PATH.exists():
        DB_PATH.unlink()
    con = sqlite3.connect(DB_PATH)
    con.executescript(SCHEMA.read_text())
    return con


def insert_many(con: sqlite3.Connection, table: str, cols: list[str], rows: list[tuple]) -> int:
    placeholders = ",".join(["?"] * len(cols))
    sql = f"INSERT INTO {table} ({','.join(cols)}) VALUES ({placeholders})"
    con.executemany(sql, rows)
    return len(rows)


def in_rio(lat: float, lon: float) -> bool:
    return (
        pd.notna(lat) and pd.notna(lon)
        and RIO_BBOX["lat_min"] <= lat <= RIO_BBOX["lat_max"]
        and RIO_BBOX["lon_min"] <= lon <= RIO_BBOX["lon_max"]
    )


def parse_iso(s: str) -> str | None:
    """Best-effort ISO 8601 parse from messy DD/MM/YYYY HH:MM:SS or M/D/YYYY HH:MM:SS."""
    if not s or pd.isna(s):
        return None
    try:
        return pd.to_datetime(s, errors="coerce").isoformat()
    except Exception:
        return None


def clean_str(v) -> str | None:
    """Coerce a pandas value to a clean Python string, or None.

    Handles: NaN/None → None, float-stringified ints ('20220301.0' → '20220301'),
    literal 'nan' from str(NaN) → None, empty strings → None.
    """
    if v is None:
        return None
    if isinstance(v, float):
        if pd.isna(v):
            return None
        if v.is_integer():
            return str(int(v))
        return str(v)
    if pd.isna(v):
        return None
    s = str(v).strip()
    if s.lower() in ("nan", "none", ""):
        return None
    return s


# ──────────────────────────────────────────────────────────────────
# Loaders
# ──────────────────────────────────────────────────────────────────

def load_polygons(con: sqlite3.Connection):
    print("Loading Polygons...")
    df = pd.read_csv(DATA / "areas_forca_municipal.csv")
    # Need WKT for geometry — load from geojson
    import geopandas as gpd
    gdf = gpd.read_file(DATA / "areas_forca_municipal.geojson")
    gdf["geometry_wkt"] = gdf.geometry.apply(lambda g: g.wkt)
    merged = df.merge(gdf[["fid", "geometry_wkt"]], on="fid")
    rows = [
        (
            int(r.fid),
            r.nome_subar,
            float(r.centroid_lon),
            float(r.centroid_lat),
            float(r.area_m2),
            r.geometry_wkt,
        )
        for r in merged.itertuples()
    ]
    n = insert_many(
        con, "Polygon",
        ["fid", "nome", "centroidLon", "centroidLat", "areaM2", "geometryWkt"],
        rows,
    )
    print(f"  → {n} polygons")
    return gdf[["fid", "geometry"]]


def load_orgaos(con: sqlite3.Connection):
    insert_many(con, "Orgao", ["sigla", "nome", "responsavelPor"], ORGAO_REF)
    print(f"  → {len(ORGAO_REF)} órgãos")


def build_spatial_index(polygons_gdf):
    """Return a list of (fid, shapely.Polygon) for point-in-polygon checks."""
    return [(int(r.fid), r.geometry) for r in polygons_gdf.itertuples()]


def assign_polygon(lat: float, lon: float, idx: list[tuple[int, object]]) -> int | None:
    if pd.isna(lat) or pd.isna(lon):
        return None
    pt = Point(lon, lat)
    for fid, geom in idx:
        if geom.contains(pt):
            return fid
    return None


def load_cameras(con: sqlite3.Connection, poly_idx):
    print("Loading Cameras...")
    df = pd.read_parquet(DATA / "cameras.parquet")
    rows = []
    point_re = re.compile(r"POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)")
    for r in df.itertuples():
        m = point_re.match(str(r.geometry))
        if not m:
            continue
        lon, lat = float(m.group(1)), float(m.group(2))
        fid = assign_polygon(lat, lon, poly_idx)
        rows.append((
            r.id_ponto,
            r.nome_area_fm,
            int(r.id_trecho) if pd.notna(r.id_trecho) else None,
            lon, lat,
            fid,
        ))
    n = insert_many(con, "Camera", ["id", "nomeArea", "trecho", "lon", "lat", "polygonFid"], rows)
    print(f"  → {n} cameras")


def load_occurrences(con: sqlite3.Connection, poly_idx, faction_idx):
    print("Loading Occurrences...")
    df = pd.read_parquet(DATA / "ocorrencias.parquet")
    # Dedupe to first occurrence per id_criptografado
    df = df.drop_duplicates(subset="id_criptografado", keep="first")
    rows = []
    for r in df.itertuples():
        lon = float(r.longitude) if pd.notna(r.longitude) else None
        lat = float(r.latitude) if pd.notna(r.latitude) else None
        fid = assign_polygon(lat, lon, poly_idx) if lat else None
        faction = assign_faction(lat, lon, faction_idx) if lat else None
        rows.append((
            r.id_criptografado,
            int(r.ano),
            int(r.mes),
            getattr(r, "dia_semana", None),
            getattr(r, "hora", None),
            getattr(r, "data", None),
            int(r.delito),
            r.desc_delito,
            lon, lat,
            int(r.aisp),
            int(r.risp),
            getattr(r, "locf", None),
            fid,
            faction,
        ))
    n = insert_many(
        con, "Occurrence",
        ["id", "ano", "mes", "diaSemana", "hora", "dataRaw", "delito", "descDelito",
         "lon", "lat", "aisp", "risp", "locf", "polygonFid", "factionDomain"],
        rows,
    )
    print(f"  → {n} occurrences")


def load_tips(con: sqlite3.Connection, poly_idx, faction_idx):
    print("Loading Tips (Disque Denúncia)...")
    df = pd.read_parquet(DATA / "disk_denuncia_unique.parquet")
    rows = []
    for r in df.itertuples():
        lat_raw = getattr(r, "latitude", None)
        lon_raw = getattr(r, "longitude", None)

        # Source uses comma as decimal separator: "-22,899555" — handle both
        def _to_float(v):
            if pd.isna(v):
                return None
            if isinstance(v, (int, float)):
                return float(v)
            s = str(v).replace(",", ".")
            try:
                return float(s)
            except ValueError:
                return None

        lat = _to_float(lat_raw)
        lon = _to_float(lon_raw)
        # Sanity: Rio bbox or null
        if not in_rio(lat, lon):
            lat = lon = None

        fid = assign_polygon(lat, lon, poly_idx) if lat else None
        faction = assign_faction(lat, lon, faction_idx) if lat else None

        numero_denuncia = clean_str(r.numero_denuncia)
        if not numero_denuncia:
            continue  # skip rows with no PK
        rows.append((
            numero_denuncia,
            int(r.id_denuncia) if pd.notna(r.id_denuncia) else None,
            parse_iso(getattr(r, "data_denuncia", None)),
            parse_iso(getattr(r, "data_difusao", None)),
            clean_str(getattr(r, "bairro_logradouro", None)),
            clean_str(getattr(r, "logradouro", None)),
            clean_str(getattr(r, "numero_logradouro", None)),
            clean_str(getattr(r, "complemento_logradouro", None)),
            clean_str(getattr(r, "cep_logradouro", None)),
            lat, lon,
            clean_str(getattr(r, "classe", None)),
            clean_str(getattr(r, "tipo", None)),
            int(r.assunto_principal) if pd.notna(getattr(r, "assunto_principal", None)) else None,
            clean_str(getattr(r, "status_denuncia", None)),
            clean_str(getattr(r, "relato_redacted", None)),
            fid,
            faction,
        ))
    cols = [
        "numeroDenuncia", "idDenuncia", "dataDenuncia", "dataDifusao",
        "bairro", "logradouro", "numero", "complemento", "cep",
        "lat", "lon", "classe", "tipo", "assuntoPrincipal", "statusDenuncia",
        "relato", "polygonFid", "factionDomain",
    ]
    n = insert_many(con, "Tip", cols, rows)
    print(f"  → {n} tips")


def load_urban_factors(con: sqlite3.Connection, poly_idx):
    print("Loading Urban Factors...")
    df = pd.read_parquet(DATA / "fatores_urbanos.parquet")
    rows = []
    for r in df.itertuples():
        # NOTE: source has coordenada_x = LATITUDE, coordenada_y = LONGITUDE (swapped)
        lat = float(r.coordenada_x) if pd.notna(r.coordenada_x) else None
        lon = float(r.coordenada_y) if pd.notna(r.coordenada_y) else None
        fid = assign_polygon(lat, lon, poly_idx) if lat else None
        rows.append((
            int(r.id_resposta_ocorrencia),
            clean_str(getattr(r, "logradouro", None)),
            clean_str(getattr(r, "numero_porta", None)),
            clean_str(getattr(r, "referencia", None)),
            lat, lon,
            clean_str(getattr(r, "observacao", None)),
            int(bool(r.endereco_informado)) if pd.notna(r.endereco_informado) else None,
            int(bool(r.valido)) if pd.notna(r.valido) else None,
            int(r.id_bairro) if pd.notna(r.id_bairro) else None,
            clean_str(getattr(r, "bairro_nome", None)),
            int(r.id_subarea) if pd.notna(r.id_subarea) else None,
            clean_str(getattr(r, "subarea_nome", None)),
            int(r.id_tipo_ocorrencia) if pd.notna(r.id_tipo_ocorrencia) else None,
            clean_str(getattr(r, "tipo_ocorrencia_descricao", None)),
            clean_str(getattr(r, "orgao_responsavel", None)),
            clean_str(getattr(r, "ocorrencia_orgao_nome", None)),
            int(r.codigo_ocorrencia_orgao) if pd.notna(r.codigo_ocorrencia_orgao) else None,
            fid,
        ))
    cols = [
        "id", "logradouro", "numeroPorta", "referencia", "lat", "lon",
        "observacao", "enderecoInformado", "valido", "bairroId", "bairroNome",
        "subareaId", "subareaNome", "tipoOcorrenciaId", "tipoOcorrenciaDesc",
        "orgaoResponsavel", "ocorrenciaOrgaoNome", "codigoOcorrenciaOrgao",
        "polygonFid",
    ]
    n = insert_many(con, "UrbanFactor", cols, rows)
    print(f"  → {n} urban factors")


def load_factions(con: sqlite3.Connection):
    print("Loading Faction Territories (filtered to Rio bbox)...")
    df = pd.read_parquet(DATA / "dominio_territorial.parquet")
    rows = []
    kept = []  # for spatial index returned to caller
    for r in df.itertuples():
        try:
            geom = shp_wkt.loads(r.geometria)
        except Exception:
            continue
        c = geom.centroid
        if not in_rio(c.y, c.x):
            continue
        rows.append((
            r.nome_territorio,
            r.dominio_orcrim,
            r.geometria,
            float(c.y),
            float(c.x),
        ))
        kept.append((r.dominio_orcrim, geom))
    insert_many(
        con, "FactionTerritory",
        ["nome", "dominio", "geometryWkt", "centroidLat", "centroidLon"],
        rows,
    )
    print(f"  → {len(rows)} faction polygons in Rio")
    return kept


def assign_faction(lat: float, lon: float, idx: list[tuple[str, object]]) -> str | None:
    if pd.isna(lat) or pd.isna(lon):
        return None
    pt = Point(lon, lat)
    for dom, geom in idx:
        if geom.contains(pt):
            return dom
    return None


def load_homeless(con: sqlite3.Connection):
    print("Loading Homeless Census...")
    df = pd.read_csv(DATA / "cpsr_censo_historico.csv")
    rows = []
    for r in df.itertuples():
        d = r._asdict()
        # try common name patterns
        lat = lon = None
        bairro = endereco = None
        ano = None
        for k, v in d.items():
            kl = k.lower()
            if pd.isna(v):
                continue
            if "ano" == kl or "ano_pesquisa" in kl:
                try:
                    ano = int(float(v))
                except Exception:
                    pass
            elif "lat" in kl and lat is None:
                try:
                    lat = float(v)
                except Exception:
                    pass
            elif ("lon" in kl or "long" in kl) and lon is None:
                try:
                    lon = float(v)
                except Exception:
                    pass
            elif "bairro" in kl and bairro is None:
                bairro = str(v)
            elif "endereco" in kl and endereco is None:
                endereco = str(v)
        if ano is None:
            continue
        rows.append((ano, bairro, endereco, lat, lon))
    insert_many(con, "HomelessCensus", ["ano", "bairro", "endereco", "lat", "lon"], rows)
    print(f"  → {len(rows)} census rows")


def load_relints(con: sqlite3.Connection):
    print("Loading RELINTs...")
    # Map filename → polygon fid (manual based on names)
    NAME_TO_FID = {
        "Rodoviaria": 2,
        "Botafogo_Sao_Clemente": 9,
        "Jardim_de_Alah": 10,
        "Campo_Grande": 11,
        "Rio_Sul": 12,
        "Praia_Botafogo": 14,
        "Afonso_Pena": 19,
        "Presidente_Vargas": 20,
    }
    rows = []
    for f in sorted(RELINTS_DIR.glob("*.md")):
        stem = f.stem  # e.g. RI_017_2026_Presidente_Vargas_Campo_Santana
        parts = stem.split("_")
        # RI_XXX_YYYY_Name parts...
        ri_id = f"{parts[0]}_{parts[1]}_{parts[2]}"
        ano = int(parts[2])
        titulo = " ".join(parts[3:]).replace("_", " ")
        fid = None
        for key, val in NAME_TO_FID.items():
            if key in stem:
                fid = val
                break
        md = f.read_text(encoding="utf-8")
        rows.append((ri_id, ano, fid, titulo, md))
    insert_many(con, "Relint", ["id", "ano", "polygonFid", "titulo", "markdown"], rows)
    print(f"  → {len(rows)} relints")


# ──────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────

def main():
    print(f"Building {DB_PATH}...")
    con = conn_create()
    con.execute("PRAGMA journal_mode = WAL")

    polygons_gdf = load_polygons(con)
    poly_idx = build_spatial_index(polygons_gdf)
    load_orgaos(con)
    faction_idx = load_factions(con)
    load_cameras(con, poly_idx)
    load_occurrences(con, poly_idx, faction_idx)
    load_tips(con, poly_idx, faction_idx)
    load_urban_factors(con, poly_idx)
    load_homeless(con)
    load_relints(con)

    con.commit()
    con.close()

    print(f"\n✅ {DB_PATH} ({DB_PATH.stat().st_size / 1024 / 1024:.1f} MB)")


if __name__ == "__main__":
    main()
