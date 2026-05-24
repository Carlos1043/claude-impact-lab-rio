"use client";

import { OccurrenceMarkers } from "./OccurrenceMarkers";
import { TipMarkers } from "./TipMarkers";
import { CameraMarkers } from "./CameraMarkers";
import { UrbanFactorMarkers } from "./UrbanFactorMarkers";
import { HomelessCensusMarkers } from "./HomelessCensusMarkers";

export function MapLayers(): React.JSX.Element {
  return (
    <>
      <OccurrenceMarkers />
      <TipMarkers />
      <CameraMarkers />
      <UrbanFactorMarkers />
      <HomelessCensusMarkers />
    </>
  );
}
