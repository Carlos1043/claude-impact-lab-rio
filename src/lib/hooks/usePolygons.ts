"use client";

import useSWR from "swr";
import { PolygonListSchema, type Polygon } from "@/lib/schemas";

export function usePolygons() {
  const { data, isLoading, isValidating, error, mutate } = useSWR<unknown>("/api/polygons");

  if (data === undefined) {
    return { polygons: undefined, isLoading, isValidating, error, mutate };
  }

  const parsed = PolygonListSchema.safeParse(data);
  if (!parsed.success) {
    return { polygons: undefined, isLoading, isValidating, error: parsed.error, mutate };
  }

  return {
    polygons: parsed.data as Polygon[],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}
