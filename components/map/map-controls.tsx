"use client";

import { useState } from "react";
import { useMap, useMapContext } from "@/context/map-context";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Compass, ChevronUp, ChevronDown } from "lucide-react";

export default function MapControls() {
  const { map, userLocation, startTracking } = useMap();
  const { activeNarration, isPanelExpanded } = useMapContext();

  const zoomIn = () => {
    if (!map) return;
    map.zoomIn();
  };

  const zoomOut = () => {
    if (!map) return;
    map.zoomOut();
  };

  const locateUser = () => {
    if (!map) return;

    if (userLocation) {
      map.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 15,
        duration: 1500,
      });
    } else {
      startTracking();

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
            alert(
              "Unable to get your location. Please enable location services."
            );
          }
        );
      }
    }
  };

  if (!map) return null;

  // Calculate bottom offset based on narration panel state
  // When narration is active:
  // - If expanded: move up more (to clear the video content)
  // - If collapsed: move up less (just clear the header)
  // - If no narration: stay at bottom
  const bottomOffset = activeNarration
    ? (isPanelExpanded ? "30.5rem" : "5.5rem")
    : "1rem"; 

  return (
    <div className="absolute left-4 z-[1001] flex flex-col items-start gap-2 transition-all duration-300" style={{ bottom: bottomOffset }}>
      <Button
        variant="outline"
        size="icon"
        onClick={zoomIn}
        className="h-10 w-10 bg-background/95 backdrop-blur-sm shadow-lg"
        title="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={zoomOut}
        className="h-10 w-10 bg-background/95 backdrop-blur-sm shadow-lg"
        title="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={locateUser}
        className="h-10 w-10 bg-background/95 backdrop-blur-sm shadow-lg"
        title="Locate me"
      >
        <Compass className="h-4 w-4" />
      </Button>
    </div>
  );
}
