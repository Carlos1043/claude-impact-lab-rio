"use client";

import { useEffect, type DependencyList } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { LayerKey } from "@/lib/schemas";
import { useDashboardStore } from "@/lib/state/dashboard-store";
import { useMapInstanceStore } from "../map-instance";
import { LAYER_META } from "./layer-meta";

type UseMarkerLayerOptions = {
  cluster?: boolean;
};

// Single-hue density scale per layer: cluster size and inner-disc darkness grow
// with the child count, while the hue stays fixed for the layer. This replaces
// the default green/yellow/red density coding (which fails for red-green
// color-blind viewers) — the count number and disc size both encode magnitude.
function clusterIconFactory(baseColor: string) {
  return (cluster: L.MarkerCluster): L.DivIcon => {
    const count = cluster.getChildCount();
    const size = count < 10 ? 32 : count < 100 ? 38 : count < 1000 ? 46 : 54;
    const inner = count < 10 ? size - 8 : count < 100 ? size - 6 : size - 4;
    const ringAlpha = count < 10 ? 0.25 : count < 100 ? 0.35 : 0.45;
    const fontSize = count < 100 ? 12 : count < 1000 ? 13 : 14;
    return L.divIcon({
      className: "compstat-cluster",
      html:
        `<div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;` +
        `background:${baseColor}1A;display:flex;align-items:center;justify-content:center;` +
        `box-shadow:0 0 0 2px ${baseColor}${Math.round(ringAlpha * 255).toString(16).padStart(2, "0")}">` +
        `<div style="width:${inner}px;height:${inner}px;border-radius:50%;background:${baseColor};` +
        `color:white;font-weight:700;font-size:${fontSize}px;display:flex;align-items:center;` +
        `justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.35)">${count}</div></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };
}

export function useMarkerLayer(
  layerKey: LayerKey,
  build: (group: L.LayerGroup) => void,
  deps: DependencyList,
  options?: UseMarkerLayerOptions,
): void {
  const map = useMapInstanceStore((s) => s.map);
  const visible = useDashboardStore((s) => s.layerVisibility[layerKey]);

  useEffect(() => {
    if (!map || !visible) return;

    const group: L.LayerGroup = options?.cluster
      ? L.markerClusterGroup({
          chunkedLoading: true,
          maxClusterRadius: 50,
          showCoverageOnHover: false,
          iconCreateFunction: clusterIconFactory(LAYER_META[layerKey].color),
        })
      : L.layerGroup();

    build(group);
    map.addLayer(group);

    return () => {
      map.removeLayer(group);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, visible, ...deps]);
}
