/**
 * AI-driven RAA generator.
 *
 * Given a polygon, fetch the relevant data from Prisma, feed it to Claude
 * with the RELINT template constraints, and return a structured `Raa`.
 *
 * STATUS: scaffolded. The Anthropic SDK call is stubbed — see TODO below.
 * Until that's wired, callers should fall back to the fixture.
 */

import { prisma } from "@/lib/prisma";
import { presVargasFixture } from "./fixtures/pres-vargas";
import type { Raa } from "./types";

interface GenerateOptions {
  polygonFid: number;
  /** Window of data to summarize. Defaults to the last 28 days. */
  sinceIso?: string;
  /** When true, return the fixture instead of calling the LLM (useful for tests). */
  useFixture?: boolean;
}

/**
 * Generate an RAA for the given polygon.
 *
 * @throws if the polygon does not exist.
 */
export async function generateRaa(opts: GenerateOptions): Promise<Raa> {
  if (opts.useFixture) return presVargasFixture;

  const polygon = await prisma.polygon.findUnique({
    where: { fid: opts.polygonFid },
    include: {
      _count: {
        select: { occurrences: true, tips: true, factors: true, cameras: true },
      },
      relints: { select: { titulo: true, markdown: true } },
    },
  });
  if (!polygon) {
    throw new Error(`Polygon ${opts.polygonFid} not found`);
  }

  // The 4 data inputs that drive every RAA section. The LLM reads these
  // and produces structured output that conforms to the `Raa` shape.
  const since = opts.sinceIso ?? new Date(Date.now() - 28 * 86_400_000).toISOString();

  const [recentTips, factors, recentOccurrences, dataSnapshot] = await Promise.all([
    prisma.tip.findMany({
      where: { polygonFid: opts.polygonFid, dataDenuncia: { gte: since } },
      orderBy: { dataDenuncia: "desc" },
      select: {
        dataDenuncia: true,
        bairro: true,
        logradouro: true,
        classe: true,
        tipo: true,
        relato: true,
      },
      take: 50,
    }),
    prisma.urbanFactor.findMany({
      where: { polygonFid: opts.polygonFid },
      select: {
        tipoOcorrenciaDesc: true,
        orgaoResponsavel: true,
        logradouro: true,
        observacao: true,
        valido: true,
      },
    }),
    prisma.occurrence.groupBy({
      by: ["descDelito", "ano", "mes"],
      where: { polygonFid: opts.polygonFid },
      _count: true,
      orderBy: [{ ano: "desc" }, { mes: "desc" }],
      take: 24,
    }),
    Promise.resolve({
      polygon: { fid: polygon.fid, nome: polygon.nome, areaM2: polygon.areaM2 },
      counts: polygon._count,
      existingRelints: polygon.relints,
    }),
  ]);

  // TODO(claude): Wire up the Anthropic SDK call here.
  //
  // The shape of the call should be roughly:
  //
  //   const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  //   const response = await client.messages.create({
  //     model: "claude-opus-4-7",
  //     max_tokens: 8000,
  //     system: SYSTEM_PROMPT,  // RELINT voice + structural rules from db/relint-template.md
  //     messages: [{
  //       role: "user",
  //       content: buildUserPrompt({
  //         polygon: dataSnapshot.polygon,
  //         recentTips,
  //         factors,
  //         recentOccurrences,
  //         existingRelints: dataSnapshot.existingRelints,
  //       }),
  //     }],
  //     tool_choice: { type: "tool", name: "emit_raa" },
  //     tools: [{
  //       name: "emit_raa",
  //       description: "Emit the structured RAA payload.",
  //       input_schema: RAA_JSON_SCHEMA,  // derived from ./types.ts
  //     }],
  //   });
  //
  //   return response.content[0].input as Raa;

  // Until the LLM call is wired, fall back to the fixture for the polygon
  // it actually represents. For other polygons, throw so the caller knows.
  if (opts.polygonFid === presVargasFixture.polygonFid) {
    return presVargasFixture;
  }
  throw new Error(
    `RAA generator not yet wired for polygon ${opts.polygonFid}. ` +
      `See TODO(claude) in src/lib/raa/generate.ts.`,
  );
}
