"use client";

import L from "leaflet";
import { useDashboardStore } from "@/lib/state/dashboard-store";
import { useTips } from "@/lib/hooks/useTips";
import type { Tip } from "@/lib/schemas";
import { iconFor } from "./icons";
import { useMarkerLayer } from "./useMarkerLayer";
import { escapeHtml, tooltipShell } from "./tooltip";

function renderTooltip(t: Tip): string {
  const heading = t.tipo ?? t.classe ?? "Denúncia";
  const date = t.dataDenuncia ?? "";
  const relato = t.relato ?? "";
  const trimmed = relato.slice(0, 120);
  const ellipsis = relato.length > 120 ? "…" : "";
  return tooltipShell(
    "tip",
    `<div><strong>${escapeHtml(heading)}</strong>${date ? `<br/><span style="color:#525252">${escapeHtml(date)}</span>` : ""}${relato ? `<p style="margin:4px 0 0">${escapeHtml(trimmed)}${ellipsis}</p>` : ""}</div>`,
  );
}

export function TipMarkers(): null {
  const fid = useDashboardStore((s) => s.selectedPolygonFid);
  const { tips } = useTips(fid);
  const icon = iconFor("tip");

  useMarkerLayer(
    "tip",
    (group) => {
      tips?.forEach((t) => {
        group.addLayer(
          L.marker([t.lat, t.lon], { icon }).bindTooltip(renderTooltip(t), { sticky: true }),
        );
      });
    },
    [tips],
    { cluster: true },
  );

  return null;
}
