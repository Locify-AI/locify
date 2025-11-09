"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useMapContext } from "@/context/map-context";

interface PulseMarkerProps {
  latitude: number;
  longitude: number;
  name: string;
  isActive?: boolean;
  onClick?: () => void;
}

export default function PoiPulseMarker({ latitude, longitude, name, isActive, onClick }: PulseMarkerProps) {
  const { map, setSelectedPOI } = useMapContext();
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  

  useEffect(() => {
    if (!map) return;

    if (!markerRef.current) {
      const container = document.createElement("div");
      container.className = "poi-pulse-container";
      container.style.position = "absolute";
      container.style.width = "40px";
      container.style.height = "40px";
      container.style.pointerEvents = "auto";
      container.style.cursor = "pointer";
      container.style.zIndex = "10";
      containerRef.current = container;

      // Outer pulsing ring
      const ring = document.createElement("div");
      ring.className = "poi-pulse-ring";
      ring.style.position = "absolute";
      ring.style.left = "50%";
      ring.style.top = "50%";
      ring.style.transform = "translate(-50%, -50%)";
      ring.style.width = "110px";
      ring.style.height = "110px";
      ring.style.borderRadius = "50%";
      ring.style.backgroundColor = "rgba(201, 45, 45, 0.35)"; // red-600 w/ opacity
      ring.style.animation = "poi-pulse-ring 2.4s ease-out infinite";
      ring.style.pointerEvents = "none";
      container.appendChild(ring);

      // Inner solid dot
      const dot = document.createElement("div");
      dot.className = "poi-pulse-dot";
      dot.style.position = "absolute";
      dot.style.left = "50%";
      dot.style.top = "50%";
      dot.style.transform = "translate(-50%, -50%)";
      dot.style.width = "34px";
      dot.style.height = "34px";
      dot.style.borderRadius = "50%";
      dot.style.background = isActive ? "linear-gradient(135deg,#dc2626,#ef4444)" : "#dc2626"; // red gradient when active
      dot.style.boxShadow = "0 4px 14px rgba(0,0,0,0.4)";
      dot.style.border = "3px solid #ffffff";
      dot.style.pointerEvents = "none";
      dot.style.animation = "poi-pulse-dot 2.4s ease-in-out infinite";
      container.appendChild(dot);

      // Label (hover tooltip)
      const label = document.createElement("div");
      label.textContent = name;
      label.style.position = "absolute";
      label.style.left = "50%";
      label.style.top = "-8px";
      label.style.transform = "translate(-50%, -100%)";
      label.style.whiteSpace = "nowrap";
      label.style.fontSize = "12px";
      label.style.fontWeight = "600";
      label.style.padding = "4px 8px";
      label.style.borderRadius = "6px";
      label.style.background = "rgba(0,0,0,0.7)";
      label.style.color = "#fff";
      label.style.opacity = "0";
      label.style.transition = "opacity 0.2s";
      label.style.pointerEvents = "none";
      container.appendChild(label);

      container.onmouseenter = () => { label.style.opacity = "1"; };
      container.onmouseleave = () => { label.style.opacity = "0"; };
      container.onclick = (e) => {
        e.stopPropagation();
        console.log("POI clicked:", name);
        setSelectedPOI({
          id: `${latitude}-${longitude}`,
          name,
          lat: latitude,
          lon: longitude,
          distance: 0,
          categories: [],
        });
        onClick?.();
      };

      // Inject styles once
      if (!document.getElementById("poi-pulse-styles")) {
        const style = document.createElement("style");
        style.id = "poi-pulse-styles";
        style.textContent = `
          @keyframes poi-pulse-ring {
            0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0.9; }
            60% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
          }
          @keyframes poi-pulse-dot {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.15); }
          }
        `;
        document.head.appendChild(style);
      }

      markerRef.current = new mapboxgl.Marker({ element: container, anchor: "center" })
        .setLngLat([longitude, latitude])
        .addTo(map);
    } else {
      markerRef.current.setLngLat([longitude, latitude]);
      const container = markerRef.current.getElement();
      const dot = container.querySelector(".poi-pulse-dot") as HTMLElement | null;
      if (dot) {
        dot.style.background = isActive ? "linear-gradient(135deg,#dc2626,#ef4444)" : "#dc2626";
      }
    }
  }, [map, latitude, longitude, name, isActive, onClick]);

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
