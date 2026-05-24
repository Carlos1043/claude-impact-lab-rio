import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PolygonListSchema } from "@/lib/schemas";

export async function GET() {
  const rows = await prisma.polygon.findMany({
    select: {
      fid: true,
      nome: true,
      centroidLon: true,
      centroidLat: true,
      areaM2: true,
      geometryWkt: true,
    },
  });
  const data = PolygonListSchema.parse(rows);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=86400" },
  });
}
