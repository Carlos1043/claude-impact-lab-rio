import L from "leaflet";

export function dotIcon(color: string, sizePx = 10): L.DivIcon {
  return L.divIcon({
    className: "compstat-dot",
    html: `<span style="display:block;width:${sizePx}px;height:${sizePx}px;border-radius:50%;background:${color};box-shadow:0 0 0 1.5px white,0 0 4px rgba(0,0,0,0.4);"></span>`,
    iconSize: [sizePx, sizePx],
    iconAnchor: [sizePx / 2, sizePx / 2],
  });
}

export const occurrenceIcon = dotIcon("#dc2626");
export const tipIcon = dotIcon("#ea580c");
export const cameraIcon = dotIcon("#2563eb", 12);
export const urbanFactorIcon = dotIcon("#d97706");
export const homelessCensusIcon = dotIcon("#7c3aed");
