import type { LayerKey } from "@/lib/schemas";
import { LAYER_META } from "./layer-meta";

export function escapeHtml(value: string): string {
  return value.replace(/[<>&"']/g, (ch) => {
    switch (ch) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return ch;
    }
  });
}

export function tooltipShell(layerKey: LayerKey, bodyHtml: string): string {
  const { color, label } = LAYER_META[layerKey];
  return `<div style="border-left:3px solid ${color};padding:2px 0 2px 8px;min-width:120px;max-width:260px"><div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${color}"></span><span style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:${color}">${label}</span></div>${bodyHtml}</div>`;
}
