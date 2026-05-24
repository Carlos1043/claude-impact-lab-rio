"use client";

import { CameraListSchema } from "@/lib/schemas";
import { useLayer } from "./useLayer";

export function useCameras(polygonFid: number | null) {
  const { data, isLoading, isValidating, error, mutate } = useLayer(
    "camera",
    polygonFid,
    CameraListSchema,
  );
  return { cameras: data, isLoading, isValidating, error, mutate };
}
