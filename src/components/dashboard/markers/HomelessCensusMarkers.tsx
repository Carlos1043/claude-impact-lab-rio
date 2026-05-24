"use client";

import L from "leaflet";
import { useDashboardStore } from "@/lib/state/dashboard-store";
import { useHomelessCensus } from "@/lib/hooks/useHomelessCensus";
import type { HomelessCensus } from "@/lib/schemas";
import { iconFor } from "./icons";
import { useMarkerLayer } from "./useMarkerLayer";
import { escapeHtml, tooltipShell } from "./tooltip";

function renderTooltip(h: HomelessCensus): string {
  const bairro = h.bairro ?? "—";
  return tooltipShell(
    "homelessCensus",
    `<div><strong>${escapeHtml(bairro)}</strong><br/><span style="color:#525252">Censo ${h.ano}</span></div>`,
  );
}

export function HomelessCensusMarkers(): null {
  const fid = useDashboardStore((s) => s.selectedPolygonFid);
  const { homelessCensus } = useHomelessCensus(fid);
  const icon = iconFor("homelessCensus");

  useMarkerLayer(
    "homelessCensus",
    (group) => {
      homelessCensus?.forEach((h) => {
        group.addLayer(
          L.marker([h.lat, h.lon], { icon }).bindTooltip(renderTooltip(h), { sticky: true }),
        );
      });
    },
    [homelessCensus],
  );

  return null;
}
