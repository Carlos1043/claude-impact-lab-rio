# claude-impact-lab-rio

CompStat Rio intelligence platform — Claude Impact Lab Rio 2026.

**Track:** Segurança Pública

## Stack

- **Database:** SQLite (`db/compstat.db`, 55 MB, ~158k rows total)
- **ORM:** Prisma (schema in `prisma/schema.prisma`)
- **Frontend/API:** Next.js (Carlos)
- **LLM:** Claude (via Anthropic SDK)

## Repo layout

```
.
├── db/
│   ├── compstat.db          ← prebuilt SQLite, ready to query
│   ├── schema.sql           ← DDL (re-creates the DB)
│   └── README.md            ← full table reference + query examples
├── prisma/
│   └── schema.prisma        ← Prisma client schema
├── scripts/
│   └── ingest.py            ← rebuilds compstat.db from source
└── (Next.js dashboard — Carlos)
```

## Quick start

```bash
# Install deps
pnpm install

# Set DATABASE_URL
echo 'DATABASE_URL="file:./db/compstat.db"' > .env

# Generate Prisma client
pnpm prisma generate

# Browse the data
pnpm prisma studio
```

## What's in the DB

| Table | Rows | Notes |
|---|---|---|
| `Polygon` | 8 | FM priority areas with WKT geometry |
| `Camera` | 985 | Spatial-joined to polygon |
| `Occurrence` | 114,252 | Furto/roubo, 2020-2024 |
| `Tip` | 18,004 | Disque Denúncia w/ free-text `relato` (through May 8 2026 — current!) |
| `UrbanFactor` | 2,085 | Crime-enabling factors per órgão (821 unvalidated) |
| `FactionTerritory` | 1,159 | CV/Milícia/TCP/ADA — safety mask only |
| `HomelessCensus` | 23,332 | CPSR 2020/2022/2024 |
| `Relint` | 8 | Existing reports as markdown (output template) |
| `Orgao` | 9 | Lookup table |

Plus `TipFts` virtual table for FTS5 search over tip narratives — the Claude angle.

See [`db/README.md`](db/README.md) for full schema reference, query examples, and gotchas.
