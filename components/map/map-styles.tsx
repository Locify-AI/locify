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
  const [isOpen, setIsOpen] = useState(false);
  const styleUrlRef = useRef<string>("mapbox://styles/mapbox/standard");
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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
      setIsOpen(false);
    }
  };

  if (!map) return null;

  const currentStyleData = mapStyles.find((s) => s.id === currentStyle) || mapStyles[0];
  const CurrentIcon = currentStyleData.icon;

  return (
    <div ref={dropdownRef} className="absolute bottom-40 left-4 z-[1001]">
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 w-10 bg-background/80 backdrop-blur-sm flex items-center justify-center"
          title="Map style"
        >
          <CurrentIcon className="h-4 w-4" />
        </Button>
        
        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden min-w-[140px]">
            {mapStyles.map((style) => {
              const Icon = style.icon;
              const isSelected = currentStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => handleStyleChange(style.id)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-sm
                    hover:bg-accent transition-colors
                    ${isSelected ? "bg-accent font-medium" : ""}
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{style.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
