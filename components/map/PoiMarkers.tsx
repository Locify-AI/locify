"use client";

import { useNearbyPOIs } from "@/hooks/useNearbyPOIs";
import { useMapContext } from "@/context/map-context";
import PoiPulseMarker from "./poi-pulse-marker";

export default function PoiMarkers() {
  const { pois } = useNearbyPOIs(2000); // 2km radius
  const { selectedPOI, setSelectedPOI } = useMapContext();

  if (!pois.length) return null;

  return (
    <>
      {pois.map((poi) => (
        <PoiPulseMarker
          key={poi.id}
          latitude={poi.lat}
          longitude={poi.lon}
          name={poi.name}
          isActive={selectedPOI?.id === poi.id}
          onClick={() => setSelectedPOI(poi)}
        />
      ))}
    </>
  );
}
