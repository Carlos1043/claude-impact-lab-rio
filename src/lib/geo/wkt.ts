import wellknown from "wellknown";
import type { Feature, Polygon, MultiPolygon } from "geojson";

export type PolygonFeature = Feature<Polygon | MultiPolygon>;

export function wktToGeoJson(wkt: string): PolygonFeature | null {
  const geometry = wellknown.parse(wkt);
  if (!geometry) return null;
  if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") return null;
  return {
    type: "Feature",
    geometry: geometry as Polygon | MultiPolygon,
    properties: {},
  };
}
