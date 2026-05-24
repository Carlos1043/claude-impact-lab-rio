import { z } from "zod";

export const OccurrenceSchema = z.object({
  id: z.string(),
  ano: z.number().int(),
  mes: z.number().int(),
  hora: z.string().nullable(),
  descDelito: z.string(),
  lat: z.number(),
  lon: z.number(),
});

export type Occurrence = z.infer<typeof OccurrenceSchema>;
export const OccurrenceListSchema = z.array(OccurrenceSchema);
