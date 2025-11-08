"use client";

import { MapPin } from "lucide-react";
import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import { useMap } from "@/context/map-context";
import { iconMap } from "@/lib/mapbox/utils";
import React from "react";

interface CustomMarkerProps {
  longitude: number;
  latitude: number;
  maki?: string;
  category?: string;
  onClick?: () => void;
}

// React-based marker component for better styling
export default function ReactCustomMarker({
  longitude,
  latitude,
  maki,
  category,
  onClick,
}: CustomMarkerProps) {
  const { map } = useMap();
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);

  // Determine icon - get the Lucide icon component
  const iconKey = (maki || category || "default").toLowerCase();
  const IconComponent = iconMap[iconKey] || MapPin;

  useEffect(() => {
    if (!map) return;

    // Create container for React component
    const container = document.createElement("div");
    container.className = "custom-marker-container";
    containerRef.current = container;

    // Create React root and render marker
    const root = createRoot(container);
    rootRef.current = root;

    // Render the marker with React
    root.render(
      React.createElement(
        "div",
        {
          onClick: onClick,
          className: onClick ? "cursor-pointer" : "",
          style: { position: "relative" },
        },
        React.createElement(
          "div",
          { className: "custom-marker-wrapper" },
          // Pulse animation
          React.createElement("div", {
            className: "marker-pulse",
          }),
          // Main marker (no pin triangle)
          React.createElement(
            "div",
            { className: "custom-marker" },
            React.createElement(
              "div",
              {
                className:
                  "marker-icon bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-xl border-2 border-white rounded-full flex items-center justify-center transform transition-all duration-200 hover:scale-110 hover:shadow-2xl",
              },
              React.createElement(IconComponent, {
                className: "h-4 w-4",
              })
            )
          )
        )
      )
    );

    // Create Mapbox marker
    // Use "center" anchor since we removed the pin pointer
    const marker = new mapboxgl.Marker({
      element: container,
      anchor: "center",
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    markerRef.current = marker;

    return () => {
      // Remove marker from map first
      if (markerRef.current) {
        try {
          markerRef.current.remove();
        } catch {
          // Marker may have already been removed
        }
        markerRef.current = null;
      }
      
      // Use requestAnimationFrame to defer unmount until after React finishes rendering
      if (rootRef.current) {
        requestAnimationFrame(() => {
          // Double-check root still exists before unmounting
          if (rootRef.current && containerRef.current) {
            try {
              rootRef.current.unmount();
            } catch {
              // React may have already cleaned up, this is safe to ignore
            }
          }
          rootRef.current = null;
        });
      }
    };
  }, [map, longitude, latitude, maki, category, onClick, IconComponent]);

  return null;
}
