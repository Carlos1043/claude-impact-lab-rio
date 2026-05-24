import { z } from "zod";

export const PolygonSchema = z.object({
  fid: z.number().int(),
  nome: z.string(),
  centroidLon: z.number(),
  centroidLat: z.number(),
  areaM2: z.number(),
  geometryWkt: z.string(),
});

export type Polygon = z.infer<typeof PolygonSchema>;
export const PolygonListSchema = z.array(PolygonSchema);
