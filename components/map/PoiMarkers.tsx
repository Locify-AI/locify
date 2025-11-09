"use client";

import { useNearbyPOIs } from "@/hooks/useNearbyPOIs";
import { useMapContext } from "@/context/map-context";
import PoiPulseMarker from "./poi-pulse-marker";

export default function PoiMarkers() {
  const { pois } = useNearbyPOIs(2000); // 2km radius
  const { selectedPOI, setSelectedPOI, setUserLocation, setActiveNarration } = useMapContext();

  // Handle POI click - show narration panel
  const handlePoiClick = async (poi: typeof pois[0]) => {
    setSelectedPOI(poi);
    
    // Set loading state immediately
    setActiveNarration({
      poi: {
        ...poi,
        distance: poi.distance, // Keep actual distance
      },
      text: "", // Empty text indicates loading
      isLoading: true,
    });

    // Fetch narration if not already available
    let narrationText: string = poi.narration || "";
    
    if (!narrationText) {
      try {
        const response = await fetch(`/api/narration?poi_id=${poi.id}&name=${encodeURIComponent(poi.name)}`);
        if (response.ok) {
          const data = await response.json();
          narrationText = data.narration || `Welcome to ${poi.name}! ${poi.categories.join(", ")}.`;
        } else {
          narrationText = `You're near ${poi.name}, a ${poi.categories[0] || "point of interest"}.`;
        }
      } catch (error) {
        console.error("Error fetching narration:", error);
        narrationText = `You're near ${poi.name}, a ${poi.categories[0] || "point of interest"}.`;
      }
    }

    // Set active narration with loaded text
    setActiveNarration({
      poi: {
        ...poi,
        distance: poi.distance, // Keep actual distance
      },
      text: narrationText,
      isLoading: false,
    });
  };

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
          onClick={() => handlePoiClick(poi)}
        />
      ))}
    </>
  );
}
