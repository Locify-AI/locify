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
  isActive?: boolean;
  name?: string;
  distance?: number; // meters
}

// React-based marker component
export default function ReactCustomMarker({
  longitude,
  latitude,
  maki,
  category,
  onClick,
  isActive = false,
  name,
  distance,
}: CustomMarkerProps) {
  const { map } = useMap();
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);

  const iconKey = (maki || category || "default").toLowerCase();
  const IconComponent = iconMap[iconKey] || MapPin;

  // 🔹 Helper: render marker content (called on init + updates)
  const renderContent = () => {
    const baseClasses =
      "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-xl " +
      "border-2 border-white rounded-full flex items-center justify-center " +
      "w-10 h-10 md:w-11 md:h-11 " +
      "transform transition-all duration-200 " +
      "group-hover:scale-110 group-hover:shadow-2xl";

    const activeRing = isActive
      ? " ring-2 ring-offset-2 ring-rose-500 scale-110"
      : "";

    const prettyName = name || "Point of Interest";
    const prettyCategory = category || "";
    const prettyDistance =
      typeof distance === "number"
        ? `${Math.round(distance)}m away`
        : "";

    return (
      <div
        onClick={onClick}
        className={`group relative ${onClick ? "cursor-pointer" : ""}`}
        style={{ position: "relative" }}
      >
        {/* Hover card */}
        <div
          className="
            pointer-events-none
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2
            px-3 py-2 rounded-2xl
            bg-slate-900/95 text-white shadow-2xl
            text-[9px] leading-snug
            flex flex-col gap-0.5
            opacity-0 group-hover:opacity-100
            transition-opacity duration-150
            min-w-[140px] max-w-[180px]
            z-50
          "
        >
          <div className="font-semibold text-[10px] truncate">
            {prettyName}
          </div>
          {prettyCategory && (
            <div className="text-[9px] text-emerald-300 truncate">
              {prettyCategory}
            </div>
          )}
          {prettyDistance && (
            <div className="text-[8px] text-slate-400">
              {prettyDistance}
            </div>
          )}
        </div>

        {/* Outer wrapper */}
        <div className="custom-marker-wrapper">
          {/* Optional subtle pulse */}
          <div
            className={
              "marker-pulse " +
              (isActive ? "scale-110 opacity-90" : "opacity-70")
            }
          />
          {/* Main circular marker */}
          <div className="custom-marker">
            <div className={baseClasses + activeRing}>
              <IconComponent className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🔹 Create marker once
  useEffect(() => {
    if (!map || markerRef.current) return;

    const container = document.createElement("div");
    container.className = "custom-marker-container";
    containerRef.current = container;

    const root = createRoot(container);
    rootRef.current = root;
    root.render(renderContent());

    const marker = new mapboxgl.Marker({
      element: container,
      anchor: "center",
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
    // only on mount/unmount for this position
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, longitude, latitude]);

  // 🔹 Update marker content on prop changes (no remove/re-add)
  useEffect(() => {
    if (!rootRef.current) return;
    rootRef.current.render(renderContent());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, name, category, distance, onClick, IconComponent]);

  return null;
}
