"use client";

import { useMap } from "@/context/map-context";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Compass } from "lucide-react";
import { useEffect, useState } from "react";

export default function MapControls() {
  const { map } = useMap();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!map) return;

    // Request user location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, [map]);

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
        center: [userLocation.lng, userLocation.lat],
        zoom: 15,
        duration: 1500,
      });
    } else if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          map.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 1500,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please enable location services.");
        }
      );
    }
  };

  if (!map) return null;

  return (
    <div className="absolute bottom-4 right-4 z-[1001] flex flex-col gap-2">
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
