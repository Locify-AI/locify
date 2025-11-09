"use client";

import { XCircle } from "lucide-react";
import { useMapContext, useMap } from "@/context/map-context";
import { Button } from "@/components/ui/button";

export default function ClearRouteButton() {
  const { selectedPOI, setSelectedPOI, activeNarration, isPanelExpanded } = useMapContext();
  const { map, userLocation } = useMap();

  if (!selectedPOI || !map) return null;

  const handleClearRoute = () => {
    // Clear the selected POI (which will clear the route)
    setSelectedPOI(null);
    
    // Center map on user's current location
    if (userLocation) {
      map.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 15,
        duration: 1500,
      });
    } else {
      // If no user location, try to get it
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.flyTo({
              center: [longitude, latitude],
              zoom: 15,
              duration: 1500,
            });
          },
          (error) => {
            console.error("Error getting location:", error);
          }
        );
      }
    }
  };

  // Calculate bottom offset to match map styles component positioning
  // Position it above the map styles button
  const bottomOffset = activeNarration
    ? (isPanelExpanded ? "39rem" : "14rem")
    : "10rem";

  return (
    <div 
      className="absolute left-4 z-[1001] transition-all duration-300" 
      style={{ bottom: `calc(${bottomOffset} + 3.5rem)` }}
    >
      <Button
        variant="outline"
        onClick={handleClearRoute}
        className="h-10 px-4 bg-black text-white shadow-lg flex items-center gap-2"
        title="Clear route and center on location"
      >
        <XCircle className="h-4 w-4 text-white" />
      </Button>
    </div>
  );
}
