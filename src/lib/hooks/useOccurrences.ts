"use client";

import { OccurrenceListSchema } from "@/lib/schemas";
import { useLayer } from "./useLayer";

export function useOccurrences(polygonFid: number | null) {
  const { data, isLoading, isValidating, error, mutate } = useLayer(
    "occurrence",
    polygonFid,
    OccurrenceListSchema,
  );
  return { occurrences: data, isLoading, isValidating, error, mutate };
}
