"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useMap } from "@/context/map-context";

/**
 * UserLocationMarker component that displays a rotating arrow marker
 * indicating the user's location and the direction they're facing.
 * Uses Mapbox Marker API for smooth rotation updates without flicker.
 */
export default function UserLocationMarker() {
  const { map, userLocation } = useMap();
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const previousHeadingRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map || !userLocation) {
      // Clean up marker when location is not available
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    // Create or update the main marker container (combines arrow and circle)
    if (!markerRef.current) {
      // Create container that holds both circle and arrow
      const container = document.createElement("div");
      container.style.position = "relative";
      container.style.width = "0";
      container.style.height = "0";
      container.style.pointerEvents = "none";

      // Create accuracy circle (background)
      if (userLocation.accuracy) {
        const accuracyRadius = userLocation.accuracy / 111000;
        const circleSize = Math.min(accuracyRadius * 200000, 200);
        
        const circleEl = document.createElement("div");
        circleEl.className = "user-location-accuracy-circle";
        circleEl.style.position = "absolute";
        circleEl.style.left = "50%";
        circleEl.style.top = "50%";
        circleEl.style.transform = "translate(-50%, -50%)";
        circleEl.style.width = `${circleSize}px`;
        circleEl.style.height = `${circleSize}px`;
        circleEl.style.border = "2px solid rgba(59, 130, 246, 0.3)";
        circleEl.style.borderRadius = "50%";
        circleEl.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
        circleEl.style.pointerEvents = "none";
        circleEl.style.zIndex = "1";
        container.appendChild(circleEl);
      }

      // Create blue circle background (semi-transparent, no border)
      const blueCircleEl = document.createElement("div");
      blueCircleEl.className = "user-location-blue-circle";
      blueCircleEl.style.position = "absolute";
      blueCircleEl.style.left = "50%";
      blueCircleEl.style.top = "50%";
      blueCircleEl.style.transform = "translate(-50%, -50%)";
      blueCircleEl.style.width = "64px";
      blueCircleEl.style.height = "64px";
      blueCircleEl.style.borderRadius = "50%";
      blueCircleEl.style.backgroundColor = "rgba(59, 130, 246, 0.4)"; // Transparent blue
      blueCircleEl.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
      blueCircleEl.style.pointerEvents = "none";
      blueCircleEl.style.zIndex = "2";
      container.appendChild(blueCircleEl);

      // Create kite-shaped plane element (foreground, centered on blue circle)
      const arrowEl = document.createElement("div");
      arrowEl.className = "user-location-arrow";
      arrowEl.style.position = "absolute";
      arrowEl.style.left = "50%";
      arrowEl.style.top = "50%";
      arrowEl.style.transform = "translate(-50%, -50%)";
      arrowEl.style.width = "56px";
      arrowEl.style.height = "56px";
      arrowEl.style.backgroundImage = "url(data:image/svg+xml;base64," + getArrowSVGBase64() + ")";
      arrowEl.style.backgroundSize = "contain";
      arrowEl.style.backgroundRepeat = "no-repeat";
      arrowEl.style.backgroundPosition = "center";
      arrowEl.style.transition = "transform 0.2s ease-out";
      arrowEl.style.zIndex = "3";
      container.appendChild(arrowEl);

      markerRef.current = new mapboxgl.Marker({
        element: container,
        anchor: "center",
      })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map);
    } else {
      // Update marker position
      markerRef.current.setLngLat([userLocation.longitude, userLocation.latitude]);
      
      // Update accuracy circle size if it exists
      const container = markerRef.current.getElement();
      if (container && userLocation.accuracy) {
        const circleEl = container.querySelector(".user-location-accuracy-circle") as HTMLElement;
        if (circleEl) {
          const accuracyRadius = userLocation.accuracy / 111000;
          const circleSize = Math.min(accuracyRadius * 200000, 200);
          circleEl.style.width = `${circleSize}px`;
          circleEl.style.height = `${circleSize}px`;
        }
      }
    }

    // Update arrow rotation based on heading
    // Fix: Negate heading to correct rotation direction
    // Account for map bearing so arrow rotates relative to map, not absolute north
    if (markerRef.current && userLocation.heading !== undefined) {
      const heading = userLocation.heading;
      const mapBearing = map.getBearing();
      
      // Calculate rotation: -heading - mapBearing
      // Negative heading fixes the opposite direction issue
      // Subtract map bearing to keep arrow correct relative to map rotation
      const rotation = -heading - mapBearing;
      
      const container = markerRef.current.getElement();
      if (container) {
        const arrowEl = container.querySelector(".user-location-arrow") as HTMLElement;
        if (arrowEl) {
          // Apply rotation to arrow element (which is already centered)
          arrowEl.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
          previousHeadingRef.current = heading;
        }
      }
    } else if (markerRef.current) {
      // Reset rotation if heading is not available
      const container = markerRef.current.getElement();
      if (container) {
        const arrowEl = container.querySelector(".user-location-arrow") as HTMLElement;
        if (arrowEl) {
          arrowEl.style.transform = "translate(-50%, -50%) rotate(0deg)";
        }
      }
    }

    // Update rotation when map bearing changes
    const handleBearingChange = () => {
      if (markerRef.current && userLocation.heading !== undefined) {
        const heading = userLocation.heading;
        const mapBearing = map.getBearing();
        const rotation = -heading - mapBearing;
        const container = markerRef.current.getElement();
        if (container) {
          const arrowEl = container.querySelector(".user-location-arrow") as HTMLElement;
          if (arrowEl) {
            arrowEl.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
          }
        }
      }
    };

    map.on("rotate", handleBearingChange);

    return () => {
      map.off("rotate", handleBearingChange);
    };
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

/**
 * Creates a white arrow icon using SVG
 * Returns base64 encoded SVG string
 * White arrow on blue circle background
 */
function getArrowSVGBase64(): string {
  // Arrow shape - triangle pointing up (north), bigger size
  const svg = `<svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.25)"/>
      </filter>
    </defs>
    <!-- Arrow triangle pointing up (north) - white -->
    <path d="M 28 6 L 48 40 L 32 40 L 32 48 L 24 48 L 24 40 L 8 40 Z" 
          fill="#ffffff" 
          filter="url(#shadow)"
          stroke="none"
          stroke-linejoin="round"/>
    <!-- Center circle -->
    <circle cx="28" cy="28" r="4" fill="#ffffff" filter="url(#shadow)"/>
  </svg>`;
  
  // Properly encode SVG to base64
  return btoa(unescape(encodeURIComponent(svg)));
}

/**
 * Creates arrow icon and adds it to map (legacy support)
 */
function createArrowIcon(map: mapboxgl.Map) {
  const canvas = document.createElement("canvas");
  const size = 64; // Higher resolution for better quality
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, size, size);

  // Draw arrow triangle pointing up (north)
  ctx.fillStyle = "#3b82f6";
  ctx.beginPath();
  ctx.moveTo(size / 2, 8); // Top point (north)
  ctx.lineTo(size - 8, size - 8); // Bottom right
  ctx.lineTo(size / 2, size - 16); // Bottom middle (notch)
  ctx.lineTo(8, size - 8); // Bottom left
  ctx.closePath();
  ctx.fill();

  // Draw white border
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw center circle
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // Add shadow for depth
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  // Convert canvas to ImageData for Mapbox
  const imageData = ctx.getImageData(0, 0, size, size);
  map.addImage("user-arrow-icon", imageData, { sdf: false });
}
