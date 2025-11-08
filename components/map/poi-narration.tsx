"use client";

import { useEffect, useState } from "react";
import { useMapContext } from "@/context/map-context";
import { useNearbyPOIs, type POI } from "@/hooks/useNearbyPOIs";

const PROXIMITY_THRESHOLD = 50; // meters - show narration when within 50m

/**
 * Component that detects when user is close to a POI and displays MCP narration
 */
export default function PoiNarration() {
  const { userLocation, activeNarration, setActiveNarration } = useMapContext();
  const { pois } = useNearbyPOIs(2000); // Check POIs within 2km
  const [narrationCache, setNarrationCache] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!userLocation || pois.length === 0) {
      if (activeNarration) {
        setActiveNarration(null);
      }
      return;
    }

    // Find the closest POI within proximity threshold
    const nearbyPOI = pois
      .filter((poi) => poi.distance <= PROXIMITY_THRESHOLD)
      .sort((a, b) => a.distance - b.distance)[0];

    if (nearbyPOI) {
      // Check if we already have narration for this POI
      const cachedNarration = narrationCache.get(nearbyPOI.id);
      
      if (cachedNarration) {
        // Use cached narration
        if (!activeNarration || activeNarration.poi.id !== nearbyPOI.id) {
          setActiveNarration({ poi: nearbyPOI, text: cachedNarration });
        }
      } else if (!nearbyPOI.narration) {
        // Fetch narration from MCP backend
        fetchNarrationFromMCP(nearbyPOI);
      } else {
        // POI already has narration
        if (!activeNarration || activeNarration.poi.id !== nearbyPOI.id) {
          setActiveNarration({ poi: nearbyPOI, text: nearbyPOI.narration });
        }
      }
    } else {
      // User moved away from all POIs
      if (activeNarration) {
        setActiveNarration(null);
      }
    }
  }, [userLocation, pois, activeNarration, narrationCache, setActiveNarration]);

  const fetchNarrationFromMCP = async (poi: POI) => {
    try {
      // TODO: Replace with actual MCP backend endpoint
      // For now, using a placeholder that will be replaced by Python backend
      const response = await fetch(`/api/narration?poi_id=${poi.id}&name=${encodeURIComponent(poi.name)}`);
      
      if (response.ok) {
        const data = await response.json();
        const narrationText = data.narration || `Welcome to ${poi.name}! ${poi.categories.join(", ")}.`;
        
        // Cache the narration
        setNarrationCache((prev) => {
          const newCache = new Map(prev);
          newCache.set(poi.id, narrationText);
          return newCache;
        });

        // Set active narration
        setActiveNarration({ poi, text: narrationText });
      } else {
        // Fallback narration if MCP fails
        const fallbackNarration = `You're near ${poi.name}, a ${poi.categories[0] || "point of interest"}.`;
        setActiveNarration({ poi, text: fallbackNarration });
      }
    } catch (error) {
      console.error("Error fetching narration from MCP:", error);
      // Fallback narration
      const fallbackNarration = `You're near ${poi.name}, a ${poi.categories[0] || "point of interest"}.`;
      setActiveNarration({ poi, text: fallbackNarration });
    }
  };

  if (!activeNarration) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[2000] max-w-2xl w-full px-4">
      <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mt-2" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-slate-900 mb-1">
              {activeNarration.poi.name}
            </h3>
            <p className="text-slate-700 leading-relaxed">
              {activeNarration.text}
            </p>
            <div className="mt-2 text-xs text-slate-500">
              {Math.round(activeNarration.poi.distance)}m away
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

