import { create } from "zustand";
import { LAYER_KEYS, type LayerKey } from "@/lib/schemas";

type LayerVisibility = Record<LayerKey, boolean>;

const initialVisibility: LayerVisibility = LAYER_KEYS.reduce(
  (acc, key) => ({ ...acc, [key]: false }),
  {} as LayerVisibility
);

type DashboardState = {
  selectedPolygonFid: number | null;
  layerVisibility: LayerVisibility;
  setSelectedPolygonFid: (fid: number | null) => void;
  toggleLayer: (key: LayerKey) => void;
  setLayerVisibility: (key: LayerKey, visible: boolean) => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedPolygonFid: null,
  layerVisibility: initialVisibility,
  setSelectedPolygonFid: (fid) => set({ selectedPolygonFid: fid }),
  toggleLayer: (key) =>
    set((state) => ({
      layerVisibility: { ...state.layerVisibility, [key]: !state.layerVisibility[key] },
    })),
  setLayerVisibility: (key, visible) =>
    set((state) => ({
      layerVisibility: { ...state.layerVisibility, [key]: visible },
    })),
}));
