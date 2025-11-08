"use client";

import { useNearbyPOIs } from "@/hooks/useNearbyPOIs";
import { useMapContext } from "@/context/map-context";
import CustomMarker from "./custom-marker";

export default function PoiMarkers() {
  const { pois } = useNearbyPOIs(1000); 
  const { selectedPOI, setSelectedPOI } = useMapContext();

  if (!pois.length) return null;

  return (
    <>
      {pois.map((poi) => (
        <CustomMarker
          key={poi.id}
          latitude={poi.lat}
          longitude={poi.lon}
          category={poi.categories?.[0]}
          name={poi.name}
          distance={poi.distance}
          isActive={selectedPOI?.id === poi.id}
          onClick={() => setSelectedPOI(poi)}
        />
      ))}
    </>
  );
}
