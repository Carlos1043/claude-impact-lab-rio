"use client";

import L from "leaflet";
import { useDashboardStore } from "@/lib/state/dashboard-store";
import { useUrbanFactors } from "@/lib/hooks/useUrbanFactors";
import type { UrbanFactor } from "@/lib/schemas";
import { urbanFactorIcon } from "./icons";
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

function renderUrbanFactorTooltip(u: UrbanFactor): string {
  const heading = u.tipoOcorrenciaDesc ?? "Fator urbano";
  const orgao = u.orgaoResponsavel ?? "—";
  let status = "";
  if (u.valido === 1) {
    status = '<br/><span style="color:#059669;font-weight:600">validado</span>';
  } else if (u.valido === 0) {
    status = '<br/><span style="color:#dc2626">não validado</span>';
  }
  return `<div><strong>${escapeHtml(heading)}</strong><br/>${escapeHtml(orgao)}${status}</div>`;
}

export function UrbanFactorMarkers(): null {
  const fid = useDashboardStore((s) => s.selectedPolygonFid);
  const { urbanFactors } = useUrbanFactors(fid);

  useMarkerLayer(
    "urbanFactor",
    (group) => {
      urbanFactors?.forEach((u) => {
        group.addLayer(
          L.marker([u.lat, u.lon], { icon: urbanFactorIcon }).bindTooltip(
            renderUrbanFactorTooltip(u),
            { sticky: true },
          ),
        );
      });
    },
    [urbanFactors],
  );

  return null;
}
