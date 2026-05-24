"use client";

import { TipListSchema } from "@/lib/schemas";
import { useLayer } from "./useLayer";

export function useTips(polygonFid: number | null) {
  const { data, isLoading, isValidating, error, mutate } = useLayer(
    "tip",
    polygonFid,
    TipListSchema,
  );
  return { tips: data, isLoading, isValidating, error, mutate };
}
