-- CompStat Rio — SQLite schema
-- All geometry stored as WKT TEXT (Prisma-compatible).
-- Spatial joins (occurrence → polygon, tip → polygon) precomputed at ingest.
-- All names are camelCase to match Prisma conventions.

PRAGMA foreign_keys = ON;

-- ──────────────────────────────────────────────────────────────────
-- POLYGON: 8 Força Municipal priority areas
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Polygon (
  fid           INTEGER PRIMARY KEY,
  nome          TEXT NOT NULL UNIQUE,
  centroidLon   REAL NOT NULL,
  centroidLat   REAL NOT NULL,
  areaM2        REAL NOT NULL,
  geometryWkt   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_polygon_nome ON Polygon(nome);

-- ──────────────────────────────────────────────────────────────────
-- CAMERA: 985 camera install points
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Camera (
  id            TEXT PRIMARY KEY NOT NULL,           -- id_ponto (uuid)
  nomeArea      TEXT NOT NULL,              -- nome_area_fm (text, may not match Polygon — 9 areas in data, 8 in shapefile)
  trecho        INTEGER,                    -- id_trecho
  lon           REAL NOT NULL,
  lat           REAL NOT NULL,
  polygonFid    INTEGER,                    -- spatial join, may be NULL if outside any polygon
  FOREIGN KEY (polygonFid) REFERENCES Polygon(fid)
);
CREATE INDEX IF NOT EXISTS idx_camera_polygon ON Camera(polygonFid);
CREATE INDEX IF NOT EXISTS idx_camera_nomeArea ON Camera(nomeArea);

-- ──────────────────────────────────────────────────────────────────
-- OCCURRENCE: 115k police occurrences (furto + roubo)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Occurrence (
  id            TEXT PRIMARY KEY NOT NULL,           -- id_criptografado (some dups; we'll dedupe to first)
  ano           INTEGER NOT NULL,
  mes           INTEGER NOT NULL,
  diaSemana     TEXT,
  hora          TEXT,
  dataRaw       TEXT,                       -- original 'data' field (has bad rows)
  delito        INTEGER NOT NULL,
  descDelito    TEXT NOT NULL,
  lon           REAL NOT NULL,
  lat           REAL NOT NULL,
  aisp          INTEGER NOT NULL,
  risp          INTEGER NOT NULL,
  locf          TEXT,
  polygonFid    INTEGER,                    -- spatial join
  factionDomain TEXT,                       -- nearest faction (safety mask): CV/Milicia/TCP/ADA or NULL
  FOREIGN KEY (polygonFid) REFERENCES Polygon(fid)
);
CREATE INDEX IF NOT EXISTS idx_occ_polygon ON Occurrence(polygonFid);
CREATE INDEX IF NOT EXISTS idx_occ_ano_mes ON Occurrence(ano, mes);
CREATE INDEX IF NOT EXISTS idx_occ_descDelito ON Occurrence(descDelito);
CREATE INDEX IF NOT EXISTS idx_occ_aisp ON Occurrence(aisp);

-- ──────────────────────────────────────────────────────────────────
-- TIP: 18k unique Disque Denúncia tips (one row per numero_denuncia)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Tip (
  numeroDenuncia    TEXT PRIMARY KEY NOT NULL,
  idDenuncia        INTEGER,
  dataDenuncia      TEXT,                   -- ISO timestamp
  dataDifusao       TEXT,
  bairro            TEXT,
  logradouro        TEXT,
  numero            TEXT,
  complemento       TEXT,
  cep               TEXT,
  lat               REAL,
  lon               REAL,
  classe            TEXT,
  tipo              TEXT,
  assuntoPrincipal  INTEGER,                -- 1/0
  statusDenuncia    TEXT,
  relato            TEXT,                   -- relato_redacted free text — THE LLM GOLDMINE
  polygonFid        INTEGER,                -- spatial join
  factionDomain     TEXT,                   -- safety mask
  FOREIGN KEY (polygonFid) REFERENCES Polygon(fid)
);
CREATE INDEX IF NOT EXISTS idx_tip_polygon ON Tip(polygonFid);
CREATE INDEX IF NOT EXISTS idx_tip_classe ON Tip(classe);
CREATE INDEX IF NOT EXISTS idx_tip_tipo ON Tip(tipo);
CREATE INDEX IF NOT EXISTS idx_tip_bairro ON Tip(bairro);
CREATE INDEX IF NOT EXISTS idx_tip_data ON Tip(dataDenuncia);

-- Text search on Tip.relato uses Prisma's `contains` filter (LIKE under the hood).
-- For 18k rows this is ~50ms — fine for the dashboard. If perf becomes a
-- bottleneck, add an FTS5 virtual table via raw migration (Prisma can't model it).

-- ──────────────────────────────────────────────────────────────────
-- URBAN FACTOR: 2,085 field-recorded factors enabling crime
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS UrbanFactor (
  id                    INTEGER PRIMARY KEY, -- id_resposta_ocorrencia
  logradouro            TEXT,
  numeroPorta           TEXT,
  referencia            TEXT,
  lat                   REAL,                -- note: source has coordenada_x=lat, coordenada_y=lon (swapped)
  lon                   REAL,
  observacao            TEXT,
  enderecoInformado     INTEGER,             -- bool
  valido                INTEGER,             -- bool / NULL (most are NULL — unvalidated!)
  bairroId              INTEGER,
  bairroNome            TEXT,
  subareaId             INTEGER,
  subareaNome           TEXT,
  tipoOcorrenciaId      INTEGER,
  tipoOcorrenciaDesc    TEXT,
  orgaoResponsavel      TEXT,                -- COMLURB / SEOP / RioLuz / SMAS / etc.
  ocorrenciaOrgaoNome   TEXT,
  codigoOcorrenciaOrgao INTEGER,
  polygonFid            INTEGER,
  FOREIGN KEY (polygonFid) REFERENCES Polygon(fid)
);
CREATE INDEX IF NOT EXISTS idx_factor_polygon ON UrbanFactor(polygonFid);
CREATE INDEX IF NOT EXISTS idx_factor_orgao ON UrbanFactor(orgaoResponsavel);
CREATE INDEX IF NOT EXISTS idx_factor_subarea ON UrbanFactor(subareaId);
CREATE INDEX IF NOT EXISTS idx_factor_tipo ON UrbanFactor(tipoOcorrenciaDesc);
CREATE INDEX IF NOT EXISTS idx_factor_valido ON UrbanFactor(valido);

-- ──────────────────────────────────────────────────────────────────
-- FACTION TERRITORY: 1,628 faction-controlled polygons (filtered to Rio bbox)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS FactionTerritory (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nome          TEXT NOT NULL,
  dominio       TEXT NOT NULL,             -- CV / Milícia / TCP / ADA
  geometryWkt   TEXT NOT NULL,
  centroidLat   REAL,
  centroidLon   REAL
);
CREATE INDEX IF NOT EXISTS idx_faction_dominio ON FactionTerritory(dominio);

-- ──────────────────────────────────────────────────────────────────
-- HOMELESS CENSUS: 23k Censo de Pessoas em Situação de Rua (2020/2022/2024)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS HomelessCensus (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ano           INTEGER NOT NULL,
  bairro        TEXT,
  endereco      TEXT,
  lat           REAL,
  lon           REAL
);
CREATE INDEX IF NOT EXISTS idx_homeless_ano ON HomelessCensus(ano);
CREATE INDEX IF NOT EXISTS idx_homeless_bairro ON HomelessCensus(bairro);

-- ──────────────────────────────────────────────────────────────────
-- RELINT: 8 existing intelligence reports (the format we mimic)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Relint (
  id            TEXT PRIMARY KEY NOT NULL,          -- e.g. RI_017_2026
  ano           INTEGER NOT NULL,
  polygonFid    INTEGER,
  titulo        TEXT NOT NULL,
  markdown      TEXT NOT NULL,             -- full RELINT as gfm markdown
  FOREIGN KEY (polygonFid) REFERENCES Polygon(fid)
);
CREATE INDEX IF NOT EXISTS idx_relint_polygon ON Relint(polygonFid);

-- ──────────────────────────────────────────────────────────────────
-- ÓRGÃO REFERENCE (lookup table — small, useful for dashboards)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Orgao (
  sigla         TEXT PRIMARY KEY NOT NULL,           -- COMLURB, SEOP, etc
  nome          TEXT NOT NULL,
  responsavelPor TEXT                       -- short description
);
