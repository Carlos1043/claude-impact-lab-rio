import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HomelessCensusListSchema, PolygonFidParam } from "@/lib/schemas";
import { wktToGeoJson } from "@/lib/geo/wkt";
import { isPointInside } from "@/lib/geo/pointInPolygon";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ fid: string }> },
) {
  const parsed = PolygonFidParam.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid fid" }, { status: 400 });
  }
  const polygon = await prisma.polygon.findUnique({
    where: { fid: parsed.data.fid },
    select: { geometryWkt: true },
  });
  if (!polygon) {
    return NextResponse.json({ error: "Polygon not found" }, { status: 404 });
  }
  const feature = wktToGeoJson(polygon.geometryWkt);
  if (!feature) {
    return NextResponse.json({ error: "Invalid polygon geometry" }, { status: 500 });
  }
  const rows = await prisma.homelessCensus.findMany({
    where: { lat: { not: null }, lon: { not: null } },
    select: { id: true, ano: true, bairro: true, lat: true, lon: true },
  });
  const inside = rows.filter((r) => isPointInside(r.lat as number, r.lon as number, feature));
  const data = HomelessCensusListSchema.parse(inside);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=86400" },
  });
}
