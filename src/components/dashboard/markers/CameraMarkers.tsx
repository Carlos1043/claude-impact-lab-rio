"use client";

import L from "leaflet";
import { useDashboardStore } from "@/lib/state/dashboard-store";
import { useCameras } from "@/lib/hooks/useCameras";
import type { Camera } from "@/lib/schemas";
import { cameraIcon } from "./icons";
import { useMarkerLayer } from "./useMarkerLayer";

function escapeHtml(value: string): string {
  return value.replace(/[<>&"']/g, (ch) => {
    switch (ch) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return ch;
    }
  });
}

function renderCameraTooltip(c: Camera): string {
  return `<div><strong>${escapeHtml(c.nomeArea)}</strong></div>`;
}

export function CameraMarkers(): null {
  const fid = useDashboardStore((s) => s.selectedPolygonFid);
  const { cameras } = useCameras(fid);

  useMarkerLayer(
    "camera",
    (group) => {
      cameras?.forEach((c) => {
        group.addLayer(
          L.marker([c.lat, c.lon], { icon: cameraIcon }).bindTooltip(
            renderCameraTooltip(c),
            { sticky: true },
          ),
        );
      });
    },
    [cameras],
  );

  return null;
}
