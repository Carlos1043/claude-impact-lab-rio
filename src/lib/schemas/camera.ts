import { z } from "zod";

export const CameraSchema = z.object({
  id: z.string(),
  nomeArea: z.string(),
  lat: z.number(),
  lon: z.number(),
});

export type Camera = z.infer<typeof CameraSchema>;
export const CameraListSchema = z.array(CameraSchema);
