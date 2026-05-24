import { z } from "zod";

export * from "./polygon";
export * from "./occurrence";
export * from "./tip";
export * from "./camera";
export * from "./urbanFactor";
export * from "./homelessCensus";

export const PolygonFidParam = z.object({
  fid: z.coerce.number().int().positive(),
});

export type LayerKey = "occurrence" | "tip" | "camera" | "urbanFactor" | "homelessCensus";

export const LAYER_KEYS = [
  "occurrence",
  "tip",
  "camera",
  "urbanFactor",
  "homelessCensus",
] as const satisfies readonly LayerKey[];
