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

export default function PoiPulseMarker({
  latitude,
  longitude,
  name,
  isActive = false,
  onClick,
}: PulseMarkerProps) {
  const { map } = useMapContext();
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const latestOnClick = useRef<(() => void) | undefined>(onClick);

  // keep latest onClick in a ref so listeners always call the new one
  useEffect(() => {
    latestOnClick.current = onClick;
  }, [onClick]);

  // Create marker once
  useEffect(() => {
    if (!map || markerRef.current) return;

    const container = document.createElement("div");
    container.className = "poi-pulse-container";
    container.style.position = "relative";
    container.style.width = "110px";
    container.style.height = "110px";
    container.style.cursor = "pointer";
    container.style.zIndex = "10";
    container.style.transform = "translate(-50%, -50%)";
    containerRef.current = container;

    // Outer ring
    const ring = document.createElement("div");
    ring.className = "poi-pulse-ring";
    ring.style.position = "absolute";
    ring.style.left = "50%";
    ring.style.top = "50%";
    ring.style.transform = "translate(-50%, -50%)";
    ring.style.width = "110px";
    ring.style.height = "110px";
    ring.style.borderRadius = "50%";
    ring.style.backgroundColor = "rgba(220, 38, 38, 0.35)";
    ring.style.animation = "poi-pulse-ring 2.4s ease-out infinite";
    ring.style.pointerEvents = "auto";
    ring.style.cursor = "pointer";
    container.appendChild(ring);

    // Inner dot
    const dot = document.createElement("div");
    dot.className = "poi-pulse-dot";
    dot.style.position = "absolute";
    dot.style.left = "50%";
    dot.style.top = "50%";
    dot.style.transform = "translate(-50%, -50%)";
    dot.style.width = "34px";
    dot.style.height = "34px";
    dot.style.borderRadius = "50%";
    dot.style.background = "#dc2626";
    dot.style.boxShadow = "0 4px 14px rgba(0,0,0,0.4)";
    dot.style.border = "3px solid #ffffff";
    dot.style.animation = "poi-pulse-dot 2.4s ease-in-out infinite";
    dot.style.pointerEvents = "auto";
    dot.style.cursor = "pointer";
    container.appendChild(dot);

    // Label
    const label = document.createElement("div");
    label.className = "poi-pulse-label";
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
    label.style.transition = "opacity 0.2s, transform 0.2s";
    label.style.pointerEvents = "none";
    container.appendChild(label);

    // Hover (desktop)
    container.onmouseenter = () => {
      if (!container.dataset.active) {
        label.style.opacity = "1";
        label.style.transform = "translate(-50%, -110%)";
      }
    };
    container.onmouseleave = () => {
      if (!container.dataset.active) {
        label.style.opacity = "0";
        label.style.transform = "translate(-50%, -100%)";
      }
    };

    // CLICK: desktop
    container.addEventListener("click", (e) => {
      e.stopPropagation();
      latestOnClick.current?.();
    });

    // TAP: mobile
    container.addEventListener(
      "touchend",
      (e) => {
        e.stopPropagation();
        e.preventDefault();
        latestOnClick.current?.();
      },
      { passive: false }
    );

    // Inject animations once
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

    const marker = new mapboxgl.Marker({ element: container, anchor: "center" })
      .setLngLat([longitude, latitude])
      .addTo(map);

    markerRef.current = marker;

    return () => {
      try {
        marker.remove();
      } catch {}
      markerRef.current = null;
    };
  }, [map, longitude, latitude, name]);

  // Update active state when selection changes
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const dot = container.querySelector(
      ".poi-pulse-dot"
    ) as HTMLElement | null;
    const label = container.querySelector(
      ".poi-pulse-label"
    ) as HTMLElement | null;

    if (dot) {
      dot.style.background = isActive
        ? "linear-gradient(135deg,#dc2626,#ef4444)"
        : "#dc2626";
    }

    if (label) {
      if (isActive) {
        container.dataset.active = "true";
        label.style.opacity = "1";
        label.style.transform = "translate(-50%, -110%)";
      } else {
        delete container.dataset.active;
        label.style.opacity = "0";
        label.style.transform = "translate(-50%, -100%)";
      }
    }
  }, [isActive]);

  return null;
}
