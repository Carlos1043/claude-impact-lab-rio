"use client";

import { UrbanFactorListSchema } from "@/lib/schemas";
import { useLayer } from "./useLayer";

export function useUrbanFactors(polygonFid: number | null) {
  const { data, isLoading, isValidating, error, mutate } = useLayer(
    "urbanFactor",
    polygonFid,
    UrbanFactorListSchema,
  );
  return { urbanFactors: data, isLoading, isValidating, error, mutate };
}
