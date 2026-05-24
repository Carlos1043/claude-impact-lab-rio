import { z } from "zod";

export const UrbanFactorSchema = z.object({
  id: z.number().int(),
  tipoOcorrenciaDesc: z.string().nullable(),
  orgaoResponsavel: z.string().nullable(),
  valido: z.number().int().nullable(),
  lat: z.number(),
  lon: z.number(),
});

export type UrbanFactor = z.infer<typeof UrbanFactorSchema>;
export const UrbanFactorListSchema = z.array(UrbanFactorSchema);
