"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useMap } from "@/context/map-context";

/**
 * UserLocationMarker renders a large white arrow rotated by heading,
 * with a transparent blue accuracy circle behind it.
 */
export default function UserLocationMarker() {
  const { map, userLocation } = useMap();
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Track map load state
  useEffect(() => {
    if (!map) {
      setMapLoaded(false);
      return;
    }

    // Check if already loaded
    try {
      if (map.loaded() && map.getContainer()) {
        setMapLoaded(true);
        return;
      }
    } catch (e) {
      // Map might not be ready
    }

    // Wait for map to load
    const handleLoad = () => {
      setMapLoaded(true);
    };

    map.once("load", handleLoad);
    
    return () => {
      try {
        map.off("load", handleLoad);
      } catch (e) {
        // Map might be destroyed, ignore
      }
    };
  }, [map]);

  useEffect(() => {
    if (!map || !mapLoaded) return;

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
      container.className = "user-location-marker-container";
      container.style.position = "relative";
      container.style.width = "0";
      container.style.height = "0";
      container.style.pointerEvents = "none";
      container.style.zIndex = "100"; // Above POI markers (10) but below bottom bar (2000)

      // Accuracy circle (larger blue circle)
      const accuracyEl = document.createElement("div");
      accuracyEl.className = "user-location-accuracy-circle";
      accuracyEl.style.position = "absolute";
      accuracyEl.style.left = "50%";
      accuracyEl.style.top = "50%";
      accuracyEl.style.transform = "translate(-50%, -50%)";
      accuracyEl.style.borderRadius = "50%";
      accuracyEl.style.border = "3px solid rgba(59, 130, 246, 0.4)"; // blue-500 thicker border
      accuracyEl.style.backgroundColor = "rgba(59, 130, 246, 0.15)"; // more visible fill
      accuracyEl.style.pointerEvents = "none";
      accuracyEl.style.zIndex = "3001"; // Above POI markers
      accuracyEl.style.width = "60px"; // Larger default size
      accuracyEl.style.height = "60px";
      container.appendChild(accuracyEl);

<<<<<<< HEAD
      // Transparent circle behind arrow
      const circleEl = document.createElement("div");
      circleEl.className = "user-location-circle";
      circleEl.style.position = "absolute";
      circleEl.style.left = "50%";
      circleEl.style.top = "50%";
      circleEl.style.transform = "translate(-50%, -50%)";
      circleEl.style.width = "80px";
      circleEl.style.height = "80px";
      circleEl.style.borderRadius = "50%";
      circleEl.style.backgroundColor = "rgba(255, 255, 255, 0.3)"; // transparent white
      circleEl.style.pointerEvents = "none";
      circleEl.style.zIndex = "1.5";
      container.appendChild(circleEl);

      // White arrow (SVG) with subtle shadow
      const arrowWrapper = document.createElement("div");
      arrowWrapper.style.position = "absolute";
      arrowWrapper.style.left = "50%";
      arrowWrapper.style.top = "50%";
      arrowWrapper.style.transform = `translate(-50%, -50%) rotate(${heading}deg)`;
      arrowWrapper.style.width = "40px";
      arrowWrapper.style.height = "40px";
      arrowWrapper.style.zIndex = "3002"; // Above POI markers
      arrowWrapper.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.35))";

      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("width", "40");
      svg.setAttribute("height", "40");

      // Triangle arrow pointing up (we rotate wrapper to heading) - no stroke
      const arrow = document.createElementNS(svgNS, "path");
      arrow.setAttribute("d", "M50 5 L85 80 L50 65 L15 80 Z");
      arrow.setAttribute("fill", "#ffffff");
      svg.appendChild(arrow);
      arrowWrapper.appendChild(svg);
      container.appendChild(arrowWrapper);

      // Create marker - ensure map is ready before adding
      try {
        markerRef.current = new mapboxgl.Marker({ element: container, anchor: "center" })
          .setLngLat([userLocation.longitude, userLocation.latitude])
          .addTo(map);
      } catch (error) {
        console.error("Error adding user location marker:", error);
        markerRef.current = null;
        return;
      }
    } else {
      // Update position
      try {
        markerRef.current.setLngLat([userLocation.longitude, userLocation.latitude]);
      } catch (error) {
        console.error("Error updating user location marker:", error);
      }
    }

    // Update accuracy circle size and arrow rotation, and ensure marker is on top
    if (markerRef.current) {
      try {
        const el = markerRef.current.getElement();
        if (el) {
          const accuracyEl = el.querySelector(".user-location-accuracy-circle") as HTMLElement | null;
          const arrowWrapper = el.children.item(1) as HTMLElement | null; // Now the second child (after accuracy circle)

          if (accuracyEl) {
            const accuracy = Math.max(5, Math.min(userLocation.accuracy || 0, 500)); // clamp
            // Convert meters to pixels roughly: scale factor that looks reasonable
            const px = Math.max(60, Math.min((accuracy / 5) * 4, 220)); // Minimum 60px, heuristic for visibility
            accuracyEl.style.width = `${px}px`;
            accuracyEl.style.height = `${px}px`;
          }
          if (arrowWrapper) {
            arrowWrapper.style.transform = `translate(-50%, -50%) rotate(${heading}deg)`;
          }

          // Ensure marker appears on top of POI markers by setting z-index on parent element
          // Mapbox wraps markers in a div - find it and set z-index
          // Use 100 to be above POI markers (10) but below bottom bar (2000)
          let parent = el.parentElement;
          while (parent && !parent.classList.contains('mapboxgl-canvas-container')) {
            if (parent.classList.contains('mapboxgl-marker') || parent.style.position === 'absolute') {
              parent.style.zIndex = '100';
              break;
            }
            parent = parent.parentElement;
          }
        }
      } catch (error) {
        console.error("Error updating marker element:", error);
      }
    }
  // Depend on full userLocation object (safe; null check at top handles cleanup), map, and mapLoaded
  }, [map, userLocation, mapLoaded]);

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
