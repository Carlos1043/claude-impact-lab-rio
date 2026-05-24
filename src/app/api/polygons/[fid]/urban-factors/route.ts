import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PolygonFidParam, UrbanFactorListSchema } from "@/lib/schemas";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ fid: string }> },
) {
  const parsed = PolygonFidParam.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid fid" }, { status: 400 });
  }
  const rows = await prisma.urbanFactor.findMany({
    where: {
      polygonFid: parsed.data.fid,
      lat: { not: null },
      lon: { not: null },
    },
    select: {
      id: true,
      tipoOcorrenciaDesc: true,
      orgaoResponsavel: true,
      valido: true,
      lat: true,
      lon: true,
    },
  });
  const data = UrbanFactorListSchema.parse(rows);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=86400" },
  });
}
