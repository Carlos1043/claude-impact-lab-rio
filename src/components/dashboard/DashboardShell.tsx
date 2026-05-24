"use client";

import dynamic from "next/dynamic";
import { Sidebar } from "./Sidebar";

const MapView = dynamic(() => import("./MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-neutral-50 text-sm text-neutral-500">
      Carregando mapa...
    </div>
  ),
});

const MapLayers = dynamic(
  () => import("./markers/MapLayers").then((m) => m.MapLayers),
  { ssr: false },
);

export function DashboardShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="w-80 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white">
        <Sidebar />
      </aside>
      <main className="relative flex-1">
        <MapView />
        <MapLayers />
      </main>
    </div>
  );
}
