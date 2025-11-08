"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useMap } from "@/context/map-context";

/**
 * UserLocationMarker renders a large white arrow rotated by heading,
 * with a transparent blue accuracy circle behind it.
 */
export default function UserLocationMarker() {
  const { map, userLocation } = useMap();
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    // Cleanup when no location
    if (!userLocation) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const heading = userLocation.heading ?? 0;

    // Create container if missing
    if (!markerRef.current) {
      const container = document.createElement("div");
      container.style.position = "relative";
      container.style.width = "0";
      container.style.height = "0";
      container.style.pointerEvents = "none";

      // Accuracy circle (semi-transparent blue)
      const accuracyEl = document.createElement("div");
      accuracyEl.className = "user-location-accuracy-circle";
      accuracyEl.style.position = "absolute";
      accuracyEl.style.left = "50%";
      accuracyEl.style.top = "50%";
      accuracyEl.style.transform = "translate(-50%, -50%)";
      accuracyEl.style.borderRadius = "50%";
      accuracyEl.style.border = "2px solid rgba(59, 130, 246, 0.25)"; // blue-500 at 25%
      accuracyEl.style.backgroundColor = "rgba(59, 130, 246, 0.08)"; // faint fill
      accuracyEl.style.pointerEvents = "none";
      accuracyEl.style.zIndex = "1";
      container.appendChild(accuracyEl);

      // White arrow (SVG) with subtle shadow
      const arrowWrapper = document.createElement("div");
      arrowWrapper.style.position = "absolute";
      arrowWrapper.style.left = "50%";
      arrowWrapper.style.top = "50%";
      arrowWrapper.style.transform = `translate(-50%, -50%) rotate(${heading}deg)`;
      arrowWrapper.style.width = "40px";
      arrowWrapper.style.height = "40px";
      arrowWrapper.style.zIndex = "2";
      arrowWrapper.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.35))";

      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("width", "40");
      svg.setAttribute("height", "40");

      // Triangle arrow pointing up (we rotate wrapper to heading)
      const arrow = document.createElementNS(svgNS, "path");
      arrow.setAttribute("d", "M50 5 L85 80 L50 65 L15 80 Z");
      arrow.setAttribute("fill", "#ffffff");
      arrow.setAttribute("stroke", "#e5e7eb"); // gray-200 stroke
      arrow.setAttribute("stroke-width", "2");
      svg.appendChild(arrow);
      arrowWrapper.appendChild(svg);
      container.appendChild(arrowWrapper);

      // Create marker
      markerRef.current = new mapboxgl.Marker({ element: container, anchor: "center" })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map);
    } else {
      // Update position
      markerRef.current.setLngLat([userLocation.longitude, userLocation.latitude]);
    }

    // Update accuracy circle size and arrow rotation
    const el = markerRef.current.getElement();
    const accuracyEl = el.querySelector(".user-location-accuracy-circle") as HTMLElement | null;
    const arrowWrapper = el.children.item(1) as HTMLElement | null;

    if (accuracyEl) {
      const accuracy = Math.max(5, Math.min(userLocation.accuracy || 0, 500)); // clamp
      // Convert meters to pixels roughly: scale factor that looks reasonable
      const px = Math.min((accuracy / 5) * 4, 220); // heuristic for visibility
      accuracyEl.style.width = `${px}px`;
      accuracyEl.style.height = `${px}px`;
    }
    if (arrowWrapper) {
      arrowWrapper.style.transform = `translate(-50%, -50%) rotate(${heading}deg)`;
    }
  // Depend on full userLocation object (safe; null check at top handles cleanup) and map
  }, [map, userLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, []);

  return null;
}
