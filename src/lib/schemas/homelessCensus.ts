import { z } from "zod";

export const HomelessCensusSchema = z.object({
  id: z.number().int(),
  ano: z.number().int(),
  bairro: z.string().nullable(),
  lat: z.number(),
  lon: z.number(),
});

export type HomelessCensus = z.infer<typeof HomelessCensusSchema>;
export const HomelessCensusListSchema = z.array(HomelessCensusSchema);
