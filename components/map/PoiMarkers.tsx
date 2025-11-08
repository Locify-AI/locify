"use client";

import { useNearbyPOIs } from "@/hooks/useNearbyPOIs";
import { useMapContext } from "@/context/map-context";
import PoiTowerMarker from "./poi-tower-marker";

export default function PoiMarkers() {
  const { pois } = useNearbyPOIs(2000); // 2km radius
  const { selectedPOI, setSelectedPOI } = useMapContext();

  if (!pois.length) return null;

  return (
    <>
      {pois.map((poi) => (
        <PoiTowerMarker
          key={poi.id}
          latitude={poi.lat}
          longitude={poi.lon}
          name={poi.name}
          category={poi.categories?.[0]}
          distance={poi.distance}
          isActive={selectedPOI?.id === poi.id}
          onClick={() => setSelectedPOI(poi)}
        />
      ))}
    </>
  );
}
