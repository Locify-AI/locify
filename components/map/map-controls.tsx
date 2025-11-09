"use client";

import { useState } from "react";
import { useMap } from "@/context/map-context";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Compass, ChevronUp, ChevronDown } from "lucide-react";

export default function MapControls() {
  const { map, userLocation, startTracking } = useMap();
  const [isExpanded, setIsExpanded] = useState(true);

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

  const togglePanel = () => {
    setIsExpanded(!isExpanded);
  };

  if (!map) return null;

  return (
    <div className="absolute bottom-4 left-4 z-[1001] flex flex-col items-start gap-2">
      {/* Control buttons - slide up/down */}
      <div
        className={`flex flex-col gap-2 transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
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

      {/* Toggle button - always visible */}
      <Button
        variant="outline"
        size="icon"
        onClick={togglePanel}
        className="h-10 w-10 bg-background/95 backdrop-blur-sm shadow-lg"
        title={isExpanded ? "Hide controls" : "Show controls"}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
