"use client";

import L from "leaflet";
import { useDashboardStore } from "@/lib/state/dashboard-store";
import { useTips } from "@/lib/hooks/useTips";
import type { Tip } from "@/lib/schemas";
import { tipIcon } from "./icons";
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

function renderTipTooltip(t: Tip): string {
  const heading = t.tipo ?? t.classe ?? "Denúncia";
  const date = t.dataDenuncia ?? "";
  const relato = t.relato ?? "";
  const trimmed = relato.slice(0, 120);
  const ellipsis = relato.length > 120 ? "…" : "";
  return `<div style="max-width:240px"><strong>${escapeHtml(heading)}</strong><br/><span>${escapeHtml(date)}</span><p>${escapeHtml(trimmed)}${ellipsis}</p></div>`;
}

export function TipMarkers(): null {
  const fid = useDashboardStore((s) => s.selectedPolygonFid);
  const { tips } = useTips(fid);

  useMarkerLayer(
    "tip",
    (group) => {
      tips?.forEach((t) => {
        group.addLayer(
          L.marker([t.lat, t.lon], { icon: tipIcon }).bindTooltip(
            renderTipTooltip(t),
            { sticky: true },
          ),
        );
      });
    },
    [tips],
    { cluster: true },
  );

  return null;
}
