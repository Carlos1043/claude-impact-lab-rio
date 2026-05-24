"use client";

import L from "leaflet";
import { useDashboardStore } from "@/lib/state/dashboard-store";
import { useCameras } from "@/lib/hooks/useCameras";
import type { Camera } from "@/lib/schemas";
import { iconFor } from "./icons";
import { useMarkerLayer } from "./useMarkerLayer";
import { escapeHtml, tooltipShell } from "./tooltip";

function renderTooltip(c: Camera): string {
  return tooltipShell("camera", `<div><strong>${escapeHtml(c.nomeArea)}</strong></div>`);
}

export function CameraMarkers(): null {
  const fid = useDashboardStore((s) => s.selectedPolygonFid);
  const { cameras } = useCameras(fid);
  const icon = iconFor("camera");

  useMarkerLayer(
    "camera",
    (group) => {
      cameras?.forEach((c) => {
        group.addLayer(
          L.marker([c.lat, c.lon], { icon }).bindTooltip(renderTooltip(c), { sticky: true }),
        );
      });
    },
    [cameras],
  );

  return null;
}
