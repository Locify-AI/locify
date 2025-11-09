"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useMapContext } from "@/context/map-context";

/**
 * ScanPulse component that shows a large pulsing animation
 * when the user is scanning for POIs
 */
export default function ScanPulse() {
  const { map, userLocation, isScanning } = useMapContext();
  const pulseRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!map || !userLocation) return;

    if (!isScanning) {
      if (pulseRef.current) {
        pulseRef.current.remove();
        pulseRef.current = null;
      }
      return;
    }

    // Create pulse marker container
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.width = "0";
    container.style.height = "0";
    container.style.pointerEvents = "none";

    // Create outer giant pulse circle (larger radius)
    const outerPulse = document.createElement("div");
    outerPulse.style.position = "absolute";
    outerPulse.style.left = "50%";
    outerPulse.style.top = "50%";
    outerPulse.style.transform = "translate(-50%, -50%)";
    outerPulse.style.width = "300px";
    outerPulse.style.height = "300px";
    outerPulse.style.borderRadius = "50%";
    outerPulse.style.border = "5px solid rgba(59, 130, 246, 0.5)";
    outerPulse.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
    outerPulse.style.animation = "pulse-expand 2s ease-out infinite";
    outerPulse.style.pointerEvents = "none";
    outerPulse.style.zIndex = "3000";
    container.appendChild(outerPulse);

    // Create middle pulse circle
    const middlePulse = document.createElement("div");
    middlePulse.style.position = "absolute";
    middlePulse.style.left = "50%";
    middlePulse.style.top = "50%";
    middlePulse.style.transform = "translate(-50%, -50%)";
    middlePulse.style.width = "250px";
    middlePulse.style.height = "250px";
    middlePulse.style.borderRadius = "50%";
    middlePulse.style.border = "4px solid rgba(59, 130, 246, 0.6)";
    middlePulse.style.backgroundColor = "rgba(59, 130, 246, 0.2)";
    middlePulse.style.animation = "pulse-expand 2s ease-out infinite 0.3s";
    middlePulse.style.pointerEvents = "none";
    middlePulse.style.zIndex = "3000";
    container.appendChild(middlePulse);

    // Create inner pulse circle
    const innerPulse = document.createElement("div");
    innerPulse.style.position = "absolute";
    innerPulse.style.left = "50%";
    innerPulse.style.top = "50%";
    innerPulse.style.transform = "translate(-50%, -50%)";
    innerPulse.style.width = "200px";
    innerPulse.style.height = "200px";
    innerPulse.style.borderRadius = "50%";
    innerPulse.style.border = "3px solid rgba(59, 130, 246, 0.8)";
    innerPulse.style.backgroundColor = "rgba(59, 130, 246, 0.3)";
    innerPulse.style.animation = "pulse-expand 2s ease-out infinite 0.6s";
    innerPulse.style.pointerEvents = "none";
    innerPulse.style.zIndex = "3000";
    container.appendChild(innerPulse);

    const marker = new mapboxgl.Marker({
      element: container,
      anchor: "center",
    })
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .addTo(map);

    pulseRef.current = marker;

    return () => {
      if (pulseRef.current) {
        pulseRef.current.remove();
        pulseRef.current = null;
      }
    };
  }, [map, userLocation, isScanning]);

  return null;
}
