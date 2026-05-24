"use client";

import { useDashboardStore } from "@/lib/state/dashboard-store";
import { LAYER_KEYS, type LayerKey } from "@/lib/schemas";
import { useOccurrences } from "@/lib/hooks/useOccurrences";
import { useTips } from "@/lib/hooks/useTips";
import { useCameras } from "@/lib/hooks/useCameras";
import { useUrbanFactors } from "@/lib/hooks/useUrbanFactors";
import { useHomelessCensus } from "@/lib/hooks/useHomelessCensus";

const LABELS: Record<LayerKey, string> = {
  occurrence: "Ocorrências",
  tip: "Disque Denúncia",
  camera: "Câmeras",
  urbanFactor: "Fatores Urbanos",
  homelessCensus: "Censo de Rua",
};

const countFormatter = new Intl.NumberFormat("pt-BR");

export function LayerToggles() {
  const fid = useDashboardStore((s) => s.selectedPolygonFid);
  const visibility = useDashboardStore((s) => s.layerVisibility);
  const toggleLayer = useDashboardStore((s) => s.toggleLayer);

  const { occurrences } = useOccurrences(fid);
  const { tips } = useTips(fid);
  const { cameras } = useCameras(fid);
  const { urbanFactors } = useUrbanFactors(fid);
  const { homelessCensus } = useHomelessCensus(fid);

  const counts: Record<LayerKey, number | undefined> = {
    occurrence: occurrences?.length,
    tip: tips?.length,
    camera: cameras?.length,
    urbanFactor: urbanFactors?.length,
    homelessCensus: homelessCensus?.length,
  };

  const disabled = fid === null;

  return (
    <div className="border-t border-neutral-200 px-4 py-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Camadas
      </h3>
      <ul className="mt-2 space-y-1">
        {LAYER_KEYS.map((key) => {
          const checked = visibility[key];
          const count = counts[key];
          return (
            <li key={key}>
              <label
                className={`flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
                  disabled
                    ? "cursor-not-allowed text-neutral-400"
                    : checked
                      ? "bg-emerald-50 text-emerald-900"
                      : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer accent-emerald-600 disabled:cursor-not-allowed"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleLayer(key)}
                  />
                  <span>{LABELS[key]}</span>
                </span>
                {!disabled && count !== undefined ? (
                  <span className="text-xs tabular-nums text-neutral-500">
                    {countFormatter.format(count)}
                  </span>
                ) : null}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
