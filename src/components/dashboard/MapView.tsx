"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import useSWR from "swr";
import { useEffect, useMemo } from "react";
import { wktToGeoJson, type PolygonFeature } from "@/lib/geo/wkt";
import { useDashboardStore } from "@/lib/state/dashboard-store";
import { PolygonListSchema, type Polygon } from "@/lib/schemas";
import { useMapInstanceStore } from "./map-instance";

const RIO_CENTER: [number, number] = [-22.9068, -43.1729];
const RIO_ZOOM = 11;

type PolygonWithFeature = Polygon & { feature: PolygonFeature };

function RegisterMapInstance() {
  const map = useMap();
  const setMap = useMapInstanceStore((s) => s.setMap);
  useEffect(() => {
    setMap(map);
    return () => setMap(null);
  }, [map, setMap]);
  return null;
}

function FlyToSelected({ polygons }: { polygons: PolygonWithFeature[] }) {
  const map = useMap();
  const selectedPolygonFid = useDashboardStore((s) => s.selectedPolygonFid);

  useEffect(() => {
    if (selectedPolygonFid == null) {
      map.flyTo(RIO_CENTER, RIO_ZOOM, { duration: 0.8 });
      return;
    }
    const target = polygons.find((p) => p.fid === selectedPolygonFid);
    if (!target) return;
    const layer = L.geoJSON(target.feature);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.flyToBounds(bounds, { padding: [40, 40], duration: 0.8 });
    }
  }, [selectedPolygonFid, polygons, map]);

  return null;
}

export function MapView() {
  const { data: rawPolygons } = useSWR<Polygon[]>("/api/polygons");
  const selectedPolygonFid = useDashboardStore((s) => s.selectedPolygonFid);
  const setSelectedPolygonFid = useDashboardStore((s) => s.setSelectedPolygonFid);

  const polygons = useMemo<PolygonWithFeature[]>(() => {
    if (!rawPolygons) return [];
    const parsed = PolygonListSchema.safeParse(rawPolygons);
    if (!parsed.success) return [];
    const out: PolygonWithFeature[] = [];
    for (const p of parsed.data) {
      const feature = wktToGeoJson(p.geometryWkt);
      if (!feature) {
        console.warn(`Failed to parse WKT for polygon fid=${p.fid}`);
        continue;
      }
      out.push({ ...p, feature });
    }
    return out;
  }, [rawPolygons]);

  return (
    <MapContainer
      center={RIO_CENTER}
      zoom={RIO_ZOOM}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        maxZoom={19}
      />
      {polygons.map((polygon) => {
        const isSelected = polygon.fid === selectedPolygonFid;
        return (
          <GeoJSON
            key={`${polygon.fid}-${isSelected ? "sel" : "un"}`}
            data={polygon.feature}
            style={() =>
              isSelected
                ? { color: "#059669", weight: 3, fillColor: "#10b981", fillOpacity: 0.2 }
                : { color: "#525252", weight: 1.5, fillColor: "#a3a3a3", fillOpacity: 0.1 }
            }
            onEachFeature={(_, layer) => {
              layer.bindTooltip(polygon.nome, { sticky: true });
              layer.on("mouseover", () => {
                (layer as L.Path).setStyle({ weight: 3 });
              });
              layer.on("mouseout", () => {
                (layer as L.Path).setStyle({ weight: isSelected ? 3 : 1.5 });
              });
              layer.on("click", () => {
                setSelectedPolygonFid(isSelected ? null : polygon.fid);
              });
            }}
          />
        );
      })}
      <FlyToSelected polygons={polygons} />
      <RegisterMapInstance />
    </MapContainer>
  );
}
