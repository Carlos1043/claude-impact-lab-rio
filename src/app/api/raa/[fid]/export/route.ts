/**
 * GET /api/raa/[fid]/export
 *
 * Generates a Relatório Analítico de Área (RAA) for the given polygon
 * and streams it back as a .docx download.
 *
 * Query params:
 *   - source=fixture  → use the canned fixture (default until AI is wired)
 *   - source=ai       → call the Claude generator
 *
 * @example
 *   curl -O http://localhost:3000/api/raa/20/export
 *   → RAA_2026-W21_pol-20.docx
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { generateRaa } from "@/lib/raa/generate";
import { raaFilename, renderRaaToBuffer } from "@/lib/raa/render";

const paramsSchema = z.object({
  fid: z.coerce.number().int().positive(),
});

const querySchema = z.object({
  source: z.enum(["fixture", "ai"]).optional().default("fixture"),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fid: string }> },
) {
  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json(
      { error: "Invalid polygon fid", details: parsedParams.error.flatten() },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const parsedQuery = querySchema.safeParse({
    source: url.searchParams.get("source") ?? undefined,
  });
  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsedQuery.error.flatten() },
      { status: 400 },
    );
  }

  const { fid } = parsedParams.data;
  const { source } = parsedQuery.data;

  try {
    const raa = await generateRaa({
      polygonFid: fid,
      useFixture: source === "fixture",
    });
    const buf = await renderRaaToBuffer(raa);

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${raaFilename(fid, raa.meta?.weekIso)}"`,
        "Content-Length": String(buf.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
