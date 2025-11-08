"use client";

import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import { useMap } from "@/context/map-context";
import React from "react";

interface PoiTowerMarkerProps {
  longitude: number;
  latitude: number;
  name: string;
  category?: string;
  distance?: number;
  onClick?: () => void;
  isActive?: boolean;
}

/**
 * Tower-style marker for Points of Interest
 * Displays as a 3D tower structure on the map
 */
export default function PoiTowerMarker({
  longitude,
  latitude,
  name,
  category,
  distance,
  onClick,
  isActive = false,
}: PoiTowerMarkerProps) {
  const { map } = useMap();
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);

  const renderTower = () => {
    const activeClass = isActive ? "ring-4 ring-blue-400 ring-offset-2 scale-110" : "";
    const distanceText = distance ? `${Math.round(distance)}m` : "";

    return (
      <div
        onClick={onClick}
        className={`group relative ${onClick ? "cursor-pointer" : ""} ${activeClass} transition-all duration-200`}
        style={{ position: "relative" }}
      >
        {/* Hover tooltip */}
        <div
          className="
            pointer-events-none
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2
            px-3 py-2 rounded-lg
            bg-slate-900/95 text-white shadow-2xl
            text-xs
            flex flex-col gap-1
            opacity-0 group-hover:opacity-100
            transition-opacity duration-150
            min-w-[120px] max-w-[200px]
            z-50
          "
        >
          <div className="font-semibold text-sm truncate">{name}</div>
          {category && (
            <div className="text-xs text-blue-300 truncate">{category}</div>
          )}
          {distanceText && (
            <div className="text-xs text-slate-400">{distanceText} away</div>
          )}
        </div>

        {/* Tower structure */}
        <div className="relative">
          {/* Tower base (wider) */}
          <div
            className="w-8 h-8 bg-gradient-to-b from-blue-600 to-blue-700 rounded-t-lg shadow-lg"
            style={{
              clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)",
            }}
          />
          
          {/* Tower middle section */}
          <div
            className="w-6 h-6 bg-gradient-to-b from-blue-500 to-blue-600 mx-auto -mt-1 shadow-md"
            style={{
              clipPath: "polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)",
            }}
          />
          
          {/* Tower top (pointed) */}
          <div
            className="w-4 h-6 bg-gradient-to-b from-blue-400 to-blue-500 mx-auto -mt-1 shadow-sm"
            style={{
              clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
            }}
          />
          
          {/* Glow effect when active */}
          {isActive && (
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-50 -z-10 animate-pulse" />
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!map || markerRef.current) return;

    const container = document.createElement("div");
    container.className = "poi-tower-marker-container";
    containerRef.current = container;

    const root = createRoot(container);
    rootRef.current = root;
    root.render(renderTower());

    const marker = new mapboxgl.Marker({
      element: container,
      anchor: "bottom",
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        try {
          markerRef.current.remove();
        } catch {}
        markerRef.current = null;
      }
      if (rootRef.current) {
        try {
          rootRef.current.unmount();
        } catch {}
        rootRef.current = null;
      }
    };
  }, [map, longitude, latitude]);

  // Update marker content on prop changes
  useEffect(() => {
    if (!rootRef.current) return;
    rootRef.current.render(renderTower());
  }, [isActive, name, category, distance, onClick]);

  return null;
}

