import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { PolygonFeature } from "./wkt";

export function isPointInside(lat: number, lon: number, polygon: PolygonFeature): boolean {
  return booleanPointInPolygon(point([lon, lat]), polygon);
}
