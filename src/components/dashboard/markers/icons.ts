import L from "leaflet";
import type { LayerKey } from "@/lib/schemas";
import { LAYER_META } from "./layer-meta";

export function dotIcon(color: string, sizePx = 10): L.DivIcon {
  return L.divIcon({
    className: "compstat-dot",
    html: `<span style="display:block;width:${sizePx}px;height:${sizePx}px;border-radius:50%;background:${color};box-shadow:0 0 0 1.5px white,0 0 4px rgba(0,0,0,0.4);"></span>`,
    iconSize: [sizePx, sizePx],
    iconAnchor: [sizePx / 2, sizePx / 2],
  });
}

const ICON_CACHE = new Map<LayerKey, L.DivIcon>();

export function iconFor(layerKey: LayerKey): L.DivIcon {
  const cached = ICON_CACHE.get(layerKey);
  if (cached) return cached;
  const meta = LAYER_META[layerKey];
  const icon = dotIcon(meta.color, meta.iconSize ?? 10);
  ICON_CACHE.set(layerKey, icon);
  return icon;
}
