"use client";

import useSWR from "swr";
import type { ZodType } from "zod";
import type { LayerKey } from "@/lib/schemas";

const PATH_BY_LAYER: Record<LayerKey, string> = {
  occurrence: "occurrences",
  tip: "tips",
  camera: "cameras",
  urbanFactor: "urban-factors",
  homelessCensus: "homeless-census",
};

export function useLayer<T>(
  layerKey: LayerKey,
  polygonFid: number | null,
  schema: ZodType<T[]>,
): {
  data: T[] | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  mutate: () => void;
} {
  const segment = PATH_BY_LAYER[layerKey];
  const key = polygonFid !== null ? `/api/polygons/${polygonFid}/${segment}` : null;

  const { data, isLoading, isValidating, error, mutate } = useSWR<unknown>(key, {
    keepPreviousData: true,
  });

  if (data === undefined) {
    return { data: undefined, isLoading, isValidating, error, mutate: () => void mutate() };
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { data: undefined, isLoading, isValidating, error: parsed.error, mutate: () => void mutate() };
  }

  return { data: parsed.data, isLoading, isValidating, error, mutate: () => void mutate() };
}
