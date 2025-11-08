"use client";

import { useMap } from "@/context/map-context";
import { Button } from "@/components/ui/button";
import { Map, Satellite, Navigation } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const mapStyles = [
  {
    id: "standard",
    name: "Standard",
    style: "mapbox://styles/mapbox/standard",
    icon: Map,
  },
  {
    id: "satellite",
    name: "Satellite",
    style: "mapbox://styles/mapbox/satellite-streets-v12",
    icon: Satellite,
  },
  {
    id: "navigation",
    name: "Navigation",
    style: "mapbox://styles/mapbox/navigation-day-v1",
    icon: Navigation,
  },
];

export default function MapStyles() {
  const { map } = useMap();
  const [currentStyle, setCurrentStyle] = useState("standard");
  const styleUrlRef = useRef<string>("mapbox://styles/mapbox/standard");

  useEffect(() => {
    if (!map) return;

    // Determine style from the stored style URL
    const determineStyleFromUrl = (url: string) => {
      if (url.includes("satellite")) {
        return "satellite";
      } else if (url.includes("navigation")) {
        return "navigation";
      }
      return "standard";
    };

    // Update current style based on the URL we're tracking
    setCurrentStyle(determineStyleFromUrl(styleUrlRef.current));

    // Listen for style.load event to detect when style changes
    const onStyleLoad = () => {
      // After style loads, we can safely determine which style is active
      // by checking which style URL matches
      const activeStyle = mapStyles.find((s) => 
        styleUrlRef.current.includes(s.style.split("/").pop() || "")
      );
      if (activeStyle) {
        setCurrentStyle(activeStyle.id);
      }
    };

    map.on("style.load", onStyleLoad);

    return () => {
      map.off("style.load", onStyleLoad);
    };
  }, [map]);

  const handleStyleChange = (styleId: string) => {
    if (!map) return;
    const style = mapStyles.find((s) => s.id === styleId);
    if (style) {
      // Update the ref with the new style URL
      styleUrlRef.current = style.style;
      // Optimistically update the UI
      setCurrentStyle(styleId);
      // Set the style on the map
      map.setStyle(style.style);
    }
  };

  if (!map) return null;

  return (
    <div className="absolute top-4 right-4 z-[1001] flex gap-2">
      {mapStyles.map((style) => {
        const Icon = style.icon;
        return (
          <Button
            key={style.id}
            variant={currentStyle === style.id ? "default" : "outline"}
            size="icon"
            onClick={() => handleStyleChange(style.id)}
            title={style.name}
            className="h-10 w-10"
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}
