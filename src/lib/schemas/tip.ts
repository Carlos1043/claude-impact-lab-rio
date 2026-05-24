import { z } from "zod";

export const TipSchema = z.object({
  numeroDenuncia: z.string(),
  dataDenuncia: z.string().nullable(),
  classe: z.string().nullable(),
  tipo: z.string().nullable(),
  relato: z.string().nullable(),
  lat: z.number(),
  lon: z.number(),
});

export type Tip = z.infer<typeof TipSchema>;
export const TipListSchema = z.array(TipSchema);
