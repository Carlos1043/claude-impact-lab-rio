"use client";

import L from "leaflet";
import { useDashboardStore } from "@/lib/state/dashboard-store";
import { useOccurrences } from "@/lib/hooks/useOccurrences";
import type { Occurrence } from "@/lib/schemas";
import { iconFor } from "./icons";
import { useMarkerLayer } from "./useMarkerLayer";
import { escapeHtml, tooltipShell } from "./tooltip";

function renderTooltip(o: Occurrence): string {
  const date = `${o.mes.toString().padStart(2, "0")}/${o.ano}${o.hora ? ` ${escapeHtml(o.hora)}h` : ""}`;
  return tooltipShell(
    "occurrence",
    `<div><strong>${escapeHtml(o.descDelito)}</strong><br/><span style="color:#525252">${date}</span></div>`,
  );
}

export function OccurrenceMarkers(): null {
  const fid = useDashboardStore((s) => s.selectedPolygonFid);
  const { occurrences } = useOccurrences(fid);
  const icon = iconFor("occurrence");

  useMarkerLayer(
    "occurrence",
    (group) => {
      occurrences?.forEach((o) => {
        group.addLayer(
          L.marker([o.lat, o.lon], { icon }).bindTooltip(renderTooltip(o), { sticky: true }),
        );
      });
    },
    [occurrences],
    { cluster: true },
  );

  return null;
}
