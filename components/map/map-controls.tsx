"use client";

import { useMapContext } from "@/context/map-context";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Compass } from "lucide-react";

export default function MapControls() {
  const { map, userLocation, startTracking, activeNarration } = useMapContext();

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

  // Adjust bottom position when narration is active (move up by half screen height)
  const bottomOffset = activeNarration ? "calc(50vh + 1rem)" : "1rem";

  return (
    <div 
      className="absolute left-4 z-[1001] flex flex-col gap-2 transition-all duration-300 ease-out"
      style={{ bottom: bottomOffset }}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={zoomIn}
        className="h-10 w-10 bg-background/80 backdrop-blur-sm"
        title="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={zoomOut}
        className="h-10 w-10 bg-background/80 backdrop-blur-sm"
        title="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={locateUser}
        className="h-10 w-10 bg-background/80 backdrop-blur-sm"
        title="Locate me"
      >
        <Compass className="h-4 w-4" />
      </Button>
    </div>
  );
}
