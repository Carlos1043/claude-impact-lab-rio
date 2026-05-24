"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { PolygonListSchema, type Polygon } from "@/lib/schemas/polygon";
import { useDashboardStore } from "@/lib/state/dashboard-store";
import { LayerToggles } from "./LayerToggles";

const areaFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

function formatAreaKm2(areaM2: number): string {
  return `${areaFormatter.format(areaM2 / 1_000_000)} km²`;
}

export function Sidebar() {
  const { data, error, isLoading, mutate } = useSWR<Polygon[]>("/api/polygons");
  const selectedFid = useDashboardStore((s) => s.selectedPolygonFid);
  const setSelectedFid = useDashboardStore((s) => s.setSelectedPolygonFid);

  const parsed = useMemo(() => {
    if (!data) return null;
    return PolygonListSchema.safeParse(data);
  }, [data]);

  const polygons = useMemo(() => {
    if (!parsed?.success) return [];
    return [...parsed.data].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR")
    );
  }, [parsed]);

  return (
    <nav className="flex h-full flex-col">
      <header className="border-b border-neutral-200 px-4 py-4">
        <h2 className="text-lg font-bold text-neutral-900">Regiões</h2>
        <p className="text-sm text-neutral-600">Força Municipal</p>
        {parsed?.success ? (
          <p className="mt-1 text-xs text-neutral-400">
            {polygons.length} polígonos
          </p>
        ) : null}
      </header>

      <div className="flex-1 overflow-y-auto">
        {isLoading || (!data && !error) ? (
          <ul className="space-y-1 px-2 py-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <li
                key={i}
                className="h-14 animate-pulse rounded-md bg-neutral-100"
              />
            ))}
          </ul>
        ) : error || (parsed && !parsed.success) ? (
          <div className="px-4 py-4">
            <p className="text-sm text-red-600">
              Erro ao carregar regiões.
            </p>
            <button
              type="button"
              onClick={() => void mutate()}
              className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <ul className="py-2">
            {polygons.map((polygon) => {
              const isSelected = polygon.fid === selectedFid;
              return (
                <li key={polygon.fid}>
                  <button
                    type="button"
                    aria-current={isSelected ? "true" : undefined}
                    onClick={() =>
                      setSelectedFid(isSelected ? null : polygon.fid)
                    }
                    className={`flex w-full flex-col items-start gap-0.5 border-l-4 px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-l-emerald-600 bg-emerald-50"
                        : "border-l-transparent hover:bg-neutral-50"
                    }`}
                  >
                    <span className="text-sm font-medium text-neutral-900">
                      {polygon.nome}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {formatAreaKm2(polygon.areaM2)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <LayerToggles />
    </nav>
  );
}
