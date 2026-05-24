import { create } from "zustand";
import type { Map as LeafletMap } from "leaflet";

type MapInstanceStore = {
  map: LeafletMap | null;
  setMap: (m: LeafletMap | null) => void;
};

export const useMapInstanceStore = create<MapInstanceStore>((set) => ({
  map: null,
  setMap: (map) => set({ map }),
}));
