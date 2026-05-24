"use client";

import L from "leaflet";
import { useDashboardStore } from "@/lib/state/dashboard-store";
import { useOccurrences } from "@/lib/hooks/useOccurrences";
import type { Occurrence } from "@/lib/schemas";
import { occurrenceIcon } from "./icons";
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

function renderOccurrenceTooltip(o: Occurrence): string {
  const date = `${o.mes.toString().padStart(2, "0")}/${o.ano}${o.hora ? ` ${escapeHtml(o.hora)}h` : ""}`;
  return `<div><strong>${escapeHtml(o.descDelito)}</strong><br/>${date}</div>`;
}

export function OccurrenceMarkers(): null {
  const fid = useDashboardStore((s) => s.selectedPolygonFid);
  const { occurrences } = useOccurrences(fid);

  useMarkerLayer(
    "occurrence",
    (group) => {
      occurrences?.forEach((o) => {
        group.addLayer(
          L.marker([o.lat, o.lon], { icon: occurrenceIcon }).bindTooltip(
            renderOccurrenceTooltip(o),
            { sticky: true },
          ),
        );
      });
    },
    [occurrences],
    { cluster: true },
  );

  return null;
}
