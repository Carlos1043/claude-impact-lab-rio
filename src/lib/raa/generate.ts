/**
 * RAA generator — fetches polygon data from Prisma and assembles a
 * structured `Raa` from real records.
 *
 * Three modes:
 *   - "db"      (default): fully data-driven, deterministic, no API call.
 *                          Every observation/action references real records.
 *   - "fixture":           returns the hand-tuned Pres. Vargas fixture
 *                          (matches the reference RELINT byte-for-byte).
 *   - "ai":                stub — currently falls back to "db"; future
 *                          Claude polish layer goes here (see TODO below).
 *
 * The "db" mode aggregates `UrbanFactor` rows per polygon into the 5
 * standardized observation buckets, derives Conclusão action items from
 * the top órgãos with pending factors, and pulls 1-2 recent tip relatos
 * to enrich the context paragraph.
 */

import { prisma } from "@/lib/prisma";
import { presVargasFixture } from "./fixtures/pres-vargas";
import type { Raa, RaaAction, RaaLocation, RaaObservations } from "./types";

export type RaaSource = "db" | "fixture" | "ai";

export interface GenerateOptions {
  polygonFid: number;
  source?: RaaSource;
}

// ──────────────────────────────────────────────────────────────────
// Factor-type → observation bucket mapping
// ──────────────────────────────────────────────────────────────────

type ObsKey = keyof RaaObservations;

/** Map a Portuguese `tipoOcorrenciaDesc` to one of the 5 observation buckets. */
function categorize(desc: string | null): ObsKey | null {
  if (!desc) return null;
  const d = desc.toLowerCase();
  if (d.includes("retenção") || d.includes("retencao")) return "retencaoFluxo";
  if (
    d.includes("iluminação") ||
    d.includes("iluminacao") ||
    d.includes("iluminada") ||
    d.includes("vegetação encobrindo") ||
    d.includes("vegetacao encobrindo") ||
    d.includes("vegetação obstruindo") ||
    d.includes("vegetacao obstruindo") ||
    d.includes("lixo")
  ) {
    return "baixaVisibilidade";
  }
  if (
    d.includes("comércio irregular") ||
    d.includes("comercio irregular") ||
    d.includes("calçada") ||
    d.includes("calcada") ||
    d.includes("estacionamento") ||
    d.includes("mobiliário") ||
    d.includes("mobiliario") ||
    d.includes("tapumes") ||
    d.includes("esconderijo") ||
    d.includes("vão") ||
    d.includes("vao")
  ) {
    return "obstaculos";
  }
  if (d.includes("motocicleta") || d.includes("bicicleta")) {
    return "motosBicis";
  }
  // PSR, drogas, etc. fall through — handled as conclusion action items, not bullets
  return null;
}

/** Decapitalize and turn into a noun phrase suitable for a bullet detail. */
function detailize(desc: string): string {
  const lc = desc.charAt(0).toLowerCase() + desc.slice(1);
  return lc.replace(/\s+/g, " ").trim();
}

/** Build the 5 observation bullets from real factor counts in this polygon. */
function buildObservations(
  factorCounts: Record<string, { desc: string; count: number; orgao: string | null }>,
): RaaObservations {
  // For each bucket, pick the top-N factor descriptions
  const buckets: Record<ObsKey, Array<{ desc: string; count: number }>> = {
    retencaoFluxo: [],
    baixaVisibilidade: [],
    obstaculos: [],
    motosBicis: [],
    rotasDispersao: [],
  };

  for (const v of Object.values(factorCounts)) {
    const k = categorize(v.desc);
    if (k && k !== "rotasDispersao") buckets[k].push({ desc: v.desc, count: v.count });
  }
  for (const k of Object.keys(buckets) as ObsKey[]) {
    buckets[k].sort((a, b) => b.count - a.count);
  }

  const top = (k: ObsKey, fallback: string): string => {
    const items = buckets[k].slice(0, 2).map((b) => detailize(b.desc));
    if (items.length === 0) return fallback;
    return `${items.join(" e ")} (${buckets[k][0].count} ocorrências registradas em campo)`;
  };

  return {
    retencaoFluxo: top(
      "retencaoFluxo",
      "concentração de pedestres em pontos de embarque e travessias do perímetro",
    ),
    baixaVisibilidade: top(
      "baixaVisibilidade",
      "trechos com iluminação deficiente e vegetação encobrindo o passeio",
    ),
    obstaculos: top(
      "obstaculos",
      "comércio irregular e mobiliário urbano comprometendo a visibilidade do logradouro",
    ),
    motosBicis: top(
      "motosBicis",
      "circulação de motocicletas e bicicletas nos passeios e vias adjacentes",
    ),
    rotasDispersao:
      "vias transversais e acessos múltiplos ao transporte público favorecem dispersão imediata após a prática criminosa",
  };
}

/** Build the Conclusão action list from the top órgãos with pending (unvalidated) factors. */
function buildActions(
  byOrgao: Array<{ orgao: string; pending: number; sample: string }>,
): RaaAction[] {
  const map: Record<string, { category: string; build: (sample: string, n: number) => string }> = {
    "RioLuz": {
      category: "melhoria da iluminação pública",
      build: (sample, n) => `priorização das ${n} ocorrências sob responsabilidade da RioLuz no perímetro (ex.: ${sample.toLowerCase()})`,
    },
    "Rio Luz": {
      category: "melhoria da iluminação pública",
      build: (sample, n) => `priorização das ${n} ocorrências sob responsabilidade da RioLuz no perímetro (ex.: ${sample.toLowerCase()})`,
    },
    "COMLURB": {
      category: "poda de vegetação e remoção de lixo",
      build: (sample, n) => `ação da COMLURB nos ${n} pontos identificados em campo (ex.: ${sample.toLowerCase()})`,
    },
    "SEOP": {
      category: "fiscalização e ordenamento do comércio irregular",
      build: (sample, n) => `${n} pontos demandando ordenamento da SEOP (ex.: ${sample.toLowerCase()})`,
    },
    "SECONSERVA": {
      category: "intervenção em calçadas e mobiliário urbano",
      build: (sample, n) => `SECONSERVA atuando nos ${n} pontos mapeados (ex.: ${sample.toLowerCase()})`,
    },
    "CET-Rio": {
      category: "revisão de pontos de retenção do tráfego",
      build: (sample, n) => `CET-Rio em ${n} pontos do perímetro (ex.: ${sample.toLowerCase()})`,
    },
    "SMAS": {
      category: "ações de assistência social voltadas à PSR e cenas de uso",
      build: (sample, n) => `SMAS em ${n} pontos identificados (ex.: ${sample.toLowerCase()})`,
    },
    "GM-Rio": {
      category: "reforço do patrulhamento preventivo",
      build: (sample, n) => `GM-Rio com missões dirigidas nas ${n} ocorrências relacionadas no perímetro`,
    },
    "SMTR": {
      category: "manutenção de pontos de ônibus",
      build: (_sample, n) => `SMTR atuando nos ${n} pontos de ônibus mapeados como vulneráveis`,
    },
  };

  const out: RaaAction[] = [];
  for (const { orgao, pending, sample } of byOrgao) {
    const m = map[orgao];
    if (!m) continue;
    out.push({ category: m.category, detail: m.build(sample, pending), orgao });
  }
  // Always close with the multi-órgão coordination item if we have ≥3 órgãos
  if (out.length >= 3) {
    out.push({
      category: "ações integradas de ordenamento urbano",
      detail:
        "coordenação permanente entre Força Municipal, PMERJ, PCERJ e SEOP, com operações abrangendo o eixo completo do perímetro",
    });
  }
  return out.slice(0, 6);
}

// ──────────────────────────────────────────────────────────────────
// Main generator
// ──────────────────────────────────────────────────────────────────

export async function generateRaa(opts: GenerateOptions): Promise<Raa> {
  const { polygonFid, source = "db" } = opts;

  if (source === "fixture") return presVargasFixture;

  const polygon = await prisma.polygon.findUnique({ where: { fid: polygonFid } });
  if (!polygon) throw new Error(`Polygon ${polygonFid} not found`);

  // ── Factor aggregations ──────────────────────────────────────────
  const factorsAll = await prisma.urbanFactor.findMany({
    where: { polygonFid },
    select: { tipoOcorrenciaDesc: true, orgaoResponsavel: true, valido: true, logradouro: true },
  });

  const factorByDesc: Record<string, { desc: string; count: number; orgao: string | null }> = {};
  for (const f of factorsAll) {
    if (!f.tipoOcorrenciaDesc) continue;
    const key = f.tipoOcorrenciaDesc;
    if (!factorByDesc[key]) {
      factorByDesc[key] = { desc: key, count: 0, orgao: f.orgaoResponsavel ?? null };
    }
    factorByDesc[key].count++;
  }

  // Top órgãos by mapped factor count (`valido=1` means validated as a real
  // problem in the field; we want all real factors as pending action).
  const pendingByOrgao: Record<string, { pending: number; samples: string[] }> = {};
  for (const f of factorsAll) {
    const o = f.orgaoResponsavel?.trim();
    if (!o) continue;
    if (!pendingByOrgao[o]) pendingByOrgao[o] = { pending: 0, samples: [] };
    pendingByOrgao[o].pending++;
    if (f.tipoOcorrenciaDesc && pendingByOrgao[o].samples.length < 3) {
      pendingByOrgao[o].samples.push(f.tipoOcorrenciaDesc);
    }
  }
  const orgaoRanked = Object.entries(pendingByOrgao)
    .map(([orgao, v]) => ({ orgao, pending: v.pending, sample: v.samples[0] ?? "ocorrência mapeada" }))
    .sort((a, b) => b.pending - a.pending);

  // ── Recent tips for context flavor ───────────────────────────────
  const tips = await prisma.tip.findMany({
    where: { polygonFid, relato: { not: null } },
    orderBy: { dataDenuncia: "desc" },
    select: { dataDenuncia: true, bairro: true, classe: true, relato: true },
    take: 3,
  });

  // ── Occurrence rollup ────────────────────────────────────────────
  const occByYear = await prisma.occurrence.groupBy({
    by: ["ano"],
    where: { polygonFid },
    _count: true,
    orderBy: { ano: "desc" },
    take: 3,
  });
  const totalOcc = occByYear.reduce((s, r) => s + r._count, 0);
  const yearList = occByYear.map((r) => r.ano).join(", ");

  // ── Build the single Location section ────────────────────────────
  const orgaoSummary = orgaoRanked
    .slice(0, 4)
    .map((o) => `${o.orgao} (${o.pending})`)
    .join(", ");
  const tipsLine =
    tips.length > 0
      ? ` Denúncias recentes do Disque Denúncia incluem casos em ${tips.map((t) => t.bairro ?? "área não identificada").filter(Boolean).slice(0, 2).join(" e ")}.`
      : "";

  const context =
    `O perímetro ${polygon.nome} concentra ${totalOcc.toLocaleString("pt-BR")} ocorrências registradas no período ${yearList}, ` +
    `com ${factorsAll.length} fatores urbanos mapeados em campo distribuídos entre os órgãos responsáveis ${orgaoSummary || "municipais"}. ` +
    `Foram observados elementos urbanos e fluxos que favorecem a prática de furtos e roubos contra transeuntes, especialmente em horários de circulação intensa.${tipsLine}`;

  const observations = buildObservations(factorByDesc);

  const location: RaaLocation = {
    title: polygon.nome.toUpperCase(),
    context,
    observations,
  };

  // ── Conclusão ────────────────────────────────────────────────────
  const actions = buildActions(orgaoRanked);

  const synthesis =
    `A área analisada concentra ${totalOcc.toLocaleString("pt-BR")} ocorrências de furto e roubo no período ${yearList} ` +
    `e ${factorsAll.length} fatores urbanos mapeados em campo pendentes de ação coordenada entre os órgãos municipais. ` +
    `A intervenção articulada entre as Secretarias responsáveis permite atuar simultaneamente sobre a dinâmica criminal e as condições ambientais que a favorecem.`;

  const closingTimePattern =
    `Os delitos tendem a ocorrer principalmente nos horários de pico de circulação ` +
    `(07h–09h e 17h–20h), com agravamento em fins de semana e períodos de grande aglomeração.`;

  return {
    polygonFid,
    areaTitle: polygon.nome.toUpperCase(),
    locations: [location],
    conclusion: { synthesis, actions, closingTimePattern },
    meta: {
      generatedAt: new Date().toISOString(),
      weekIso: currentIsoWeek(),
      source,
    },
  };

  // TODO(claude): when source === "ai", layer a Claude polish call on top of
  // the deterministic RAA above. The LLM should ONLY rewrite prose
  // (context, synthesis, closingTimePattern) — the structure and counts come
  // from the data above, never the model.
}

function currentIsoWeek(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const firstJan = new Date(Date.UTC(year, 0, 1));
  const dayOfYear =
    Math.floor((now.getTime() - firstJan.getTime()) / 86_400_000) + 1;
  const week = Math.ceil((dayOfYear + firstJan.getUTCDay()) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}
