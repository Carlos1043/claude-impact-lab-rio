"use client";

import { HomelessCensusListSchema } from "@/lib/schemas";
import { useLayer } from "./useLayer";

export function useHomelessCensus(polygonFid: number | null) {
  const { data, isLoading, isValidating, error, mutate } = useLayer(
    "homelessCensus",
    polygonFid,
    HomelessCensusListSchema,
  );
  return { homelessCensus: data, isLoading, isValidating, error, mutate };
}
