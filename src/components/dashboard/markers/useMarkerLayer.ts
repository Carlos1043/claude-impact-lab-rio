"use client";

import { useEffect, type DependencyList } from "react";
import L from "leaflet";
// Side-effect import: attaches markerClusterGroup constructor to the L namespace.
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { LayerKey } from "@/lib/schemas";
import { useDashboardStore } from "@/lib/state/dashboard-store";
import { useMapInstanceStore } from "../map-instance";

type UseMarkerLayerOptions = {
  cluster?: boolean;
};

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
      ? L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50 })
      : L.layerGroup();

    build(group);
    map.addLayer(group);

    return () => {
      map.removeLayer(group);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, visible, ...deps]);
}
