"use client";

import L from "leaflet";
import { useDashboardStore } from "@/lib/state/dashboard-store";
import { useHomelessCensus } from "@/lib/hooks/useHomelessCensus";
import type { HomelessCensus } from "@/lib/schemas";
import { homelessCensusIcon } from "./icons";
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

function renderHomelessCensusTooltip(h: HomelessCensus): string {
  const bairro = h.bairro ?? "—";
  return `<div><strong>${escapeHtml(bairro)}</strong><br/>Censo ${h.ano}</div>`;
}

export function HomelessCensusMarkers(): null {
  const fid = useDashboardStore((s) => s.selectedPolygonFid);
  const { homelessCensus } = useHomelessCensus(fid);

  useMarkerLayer(
    "homelessCensus",
    (group) => {
      homelessCensus?.forEach((h) => {
        group.addLayer(
          L.marker([h.lat, h.lon], { icon: homelessCensusIcon }).bindTooltip(
            renderHomelessCensusTooltip(h),
            { sticky: true },
          ),
        );
      });
    },
    [homelessCensus],
  );

  return null;
}
