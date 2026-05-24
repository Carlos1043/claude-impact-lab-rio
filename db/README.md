# `db/` — CompStat Rio SQLite

A single-file SQLite database (`compstat.db`) with every dataset from the hackathon repo, plus precomputed spatial joins. **No spatial extension required at runtime** — point-in-polygon assignments are done at ingest time and stored as foreign keys.

## Quick start

```bash
# From repo root
echo 'DATABASE_URL="file:./db/compstat.db"' > .env
pnpm add -D prisma                            # Prisma 6 OR 7 both supported
pnpm add @prisma/client
pnpm prisma generate
pnpm prisma studio                            # browse the data
```

### Prisma version notes

- **Prisma 7 (default):** `prisma.config.ts` in the repo root supplies the connection URL.
- **Prisma 6 (legacy):** delete `prisma.config.ts` and uncomment the `url = env("DATABASE_URL")` line in `prisma/schema.prisma`.

The `.env` file works for both versions and for Python tooling.

## What's inside

| Table | Rows | Key columns |
|---|---|---|
| `Polygon` | 8 | `fid`, `nome`, `geometryWkt` — the 8 FM priority areas |
| `Camera` | 985 | `id`, `nomeArea`, `lat`/`lon`, `polygonFid` |
| `Occurrence` | ~115k | `id`, `ano`/`mes`, `descDelito`, `lat`/`lon`, `polygonFid`, `factionDomain` |
| `Tip` | ~18k | `numeroDenuncia`, `dataDenuncia`, `classe`/`tipo`, `relato` (free text), `polygonFid` |
| `UrbanFactor` | ~2k | `id`, `tipoOcorrenciaDesc`, `orgaoResponsavel`, `valido`, `polygonFid` |
| `FactionTerritory` | ~250-300 | `nome`, `dominio` (CV/Milícia/TCP/ADA), `geometryWkt` (Rio bbox only) |
| `HomelessCensus` | ~23k | `ano`, `bairro`, `lat`/`lon`, `raw` (JSON of all source cols) |
| `Relint` | 8 | `id`, `polygonFid`, `markdown` (full RELINT text) |
| `Orgao` | 9 | `sigla`, `nome`, `responsavelPor` |

Search `Tip.relato` with Prisma's `contains` filter — ~50ms across 18k rows.

## Precomputed joins

- Every `Occurrence`, `Tip`, `Camera`, and `UrbanFactor` row has its `polygonFid` already resolved (NULL if outside any FM polygon).
- Every `Occurrence` and `Tip` row has `factionDomain` set if the point falls inside a faction territory — **use only as a safety mask**, never as a targeting feature.

## Critical schema notes

1. **Geometries are WKT strings.** Use a JS WKT parser (e.g. `wellknown`) for client-side rendering. We do not require SpatiaLite.
2. **Source `coordenada_x`/`coordenada_y` in fatores_urbanos are swapped** (x=lat, y=lon). The ingest fixes this — DB has correct `lat`/`lon`.
3. **`disk_denuncia` source was ISO-8859 + semicolons** — re-encoded to UTF-8 and reloaded via parquet.
4. **`ocorrencias` data ends in 2024.** Disque Denúncia tips go through May 8, 2026 — that's the freshest signal in the DB.
5. **`UrbanFactor.valido` is NULL for many rows** — these factors are field-recorded but unvalidated. That's an opportunity, not a bug.
6. **9 camera areas vs 8 polygons** — Bangu and Lauro Müller cameras exist but those polygons are not in the FM shapefile.

## Searching tip narratives (the Claude angle)

```ts
// Prisma-native — works with full type-safety
const tips = await prisma.tip.findMany({
  where: {
    OR: [
      { relato: { contains: "moto" } },
      { relato: { contains: "celular" } },
    ],
    dataDenuncia: { gte: "2026-02-01" },
  },
  orderBy: { dataDenuncia: "desc" },
  take: 50,
});
```

## Regenerating the DB

```bash
# Source data must be extracted at ~/Developer/impact-lab-rio/extracted/
python scripts/ingest.py
```

The ingest is idempotent (drops + recreates the .db file).

## Prisma example usage (Next.js server component)

```ts
import { prisma } from "@/lib/prisma";

export default async function PolygonPage({ params }: { params: { fid: string } }) {
  const polygon = await prisma.polygon.findUnique({
    where: { fid: Number(params.fid) },
    include: {
      _count: { select: { occurrences: true, tips: true, factors: true } },
      relints: { select: { id: true, titulo: true } },
    },
  });
  // ...
}
```
