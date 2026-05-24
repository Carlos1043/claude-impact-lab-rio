import type { LayerKey } from "@/lib/schemas";

export type LayerMeta = {
  label: string;
  color: string;
  cluster: boolean;
  iconSize?: number;
};

// Distinct hues spread across the spectrum so each layer is identifiable.
// Cluster density inside a layer is shown by SIZE + lightness within that
// layer's hue (see useMarkerLayer), which keeps the green/yellow/red default
// from leaflet.markercluster out of the way for color-blind users.
export const LAYER_META: Record<LayerKey, LayerMeta> = {
  occurrence: { label: "Ocorrências", color: "#dc2626", cluster: true },
  tip: { label: "Disque Denúncia", color: "#ea580c", cluster: true },
  camera: { label: "Câmeras", color: "#2563eb", cluster: false, iconSize: 12 },
  urbanFactor: { label: "Fatores Urbanos", color: "#d97706", cluster: false },
  homelessCensus: { label: "Censo de Rua", color: "#7c3aed", cluster: false },
};
