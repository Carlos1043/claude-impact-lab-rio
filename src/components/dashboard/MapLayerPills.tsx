"use client";

import { useDashboardStore } from "@/lib/state/dashboard-store";
import { LAYER_KEYS, type LayerKey } from "@/lib/schemas";
import { useOccurrences } from "@/lib/hooks/useOccurrences";
import { useTips } from "@/lib/hooks/useTips";
import { useCameras } from "@/lib/hooks/useCameras";
import { useUrbanFactors } from "@/lib/hooks/useUrbanFactors";
import { useHomelessCensus } from "@/lib/hooks/useHomelessCensus";
import { LAYER_META } from "./markers/layer-meta";

const countFormatter = new Intl.NumberFormat("pt-BR");

export function MapLayerPills() {
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
    <div
      className="pointer-events-none absolute right-4 top-4 z-[1000] flex w-56 flex-col gap-1.5"
      role="group"
      aria-label="Camadas do mapa"
    >
      <div className="pointer-events-auto rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-600 shadow-sm backdrop-blur">
        Camadas
        {disabled ? (
          <span className="ml-2 normal-case font-normal text-neutral-400">
            selecione uma região
          </span>
        ) : null}
      </div>
      {LAYER_KEYS.map((key) => {
        const meta = LAYER_META[key];
        const checked = visibility[key];
        const count = counts[key];
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            aria-pressed={checked}
            onClick={() => toggleLayer(key)}
            className={`pointer-events-auto flex items-center justify-between rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur transition-colors ${
              disabled
                ? "cursor-not-allowed border-neutral-200 bg-white/70 text-neutral-400"
                : checked
                  ? "border-transparent text-white"
                  : "border-neutral-200 bg-white/95 text-neutral-700 hover:bg-neutral-50"
            }`}
            style={
              !disabled && checked
                ? { backgroundColor: meta.color, borderColor: meta.color }
                : undefined
            }
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: checked && !disabled ? "white" : meta.color,
                  boxShadow:
                    checked && !disabled
                      ? "0 0 0 1.5px rgba(255,255,255,0.6)"
                      : `0 0 0 1.5px ${meta.color}33`,
                }}
              />
              <span>{meta.label}</span>
            </span>
            {!disabled && count !== undefined ? (
              <span
                className={`ml-2 rounded-full px-1.5 text-xs tabular-nums ${
                  checked ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {countFormatter.format(count)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
