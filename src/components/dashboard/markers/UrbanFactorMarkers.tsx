"use client";

import L from "leaflet";
import { useDashboardStore } from "@/lib/state/dashboard-store";
import { useUrbanFactors } from "@/lib/hooks/useUrbanFactors";
import type { UrbanFactor } from "@/lib/schemas";
import { iconFor } from "./icons";
import { useMarkerLayer } from "./useMarkerLayer";
import { escapeHtml, tooltipShell } from "./tooltip";

function renderTooltip(u: UrbanFactor): string {
  const heading = u.tipoOcorrenciaDesc ?? "Fator urbano";
  const orgao = u.orgaoResponsavel ?? "—";
  let status = "";
  if (u.valido === 1) {
    status = '<br/><span style="color:#059669;font-weight:600">validado</span>';
  } else if (u.valido === 0) {
    status = '<br/><span style="color:#dc2626">não validado</span>';
  }
  return tooltipShell(
    "urbanFactor",
    `<div><strong>${escapeHtml(heading)}</strong><br/><span style="color:#525252">${escapeHtml(orgao)}</span>${status}</div>`,
  );
}

export function UrbanFactorMarkers(): null {
  const fid = useDashboardStore((s) => s.selectedPolygonFid);
  const { urbanFactors } = useUrbanFactors(fid);
  const icon = iconFor("urbanFactor");

  useMarkerLayer(
    "urbanFactor",
    (group) => {
      urbanFactors?.forEach((u) => {
        group.addLayer(
          L.marker([u.lat, u.lon], { icon }).bindTooltip(renderTooltip(u), { sticky: true }),
        );
      });
    },
    [urbanFactors],
  );

  return null;
}
