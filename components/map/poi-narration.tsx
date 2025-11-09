"use client";

import { useEffect, useState } from "react";
import { useMapContext, type POI } from "@/context/map-context";
import { useNearbyPOIs } from "@/hooks/useNearbyPOIs";
import { X, Loader2 } from "lucide-react";

const PROXIMITY_THRESHOLD = 50; // meters - show narration when within 50m

/**
 * Component that displays narration when user is close to a POI or clicks a POI
 */
export default function PoiNarration() {
  const { userLocation, activeNarration, setActiveNarration } = useMapContext();
  const { pois } = useNearbyPOIs(2000); // Check POIs within 2km
  const [narrationCache, setNarrationCache] = useState<Map<string, string>>(new Map());

  // Auto-detect proximity-based narration (only if no manual narration is active)
  useEffect(() => {
    // If narration is manually set (from click), don't auto-clear it
    // Only auto-detect if there's no active narration
    if (activeNarration) {
      return; // Keep the current narration (set by click or proximity)
    }

    // If no userLocation or no POIs, return
    if (!userLocation || pois.length === 0) {
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
        setActiveNarration({ poi: nearbyPOI, text: cachedNarration, isLoading: false });
      } else if (!nearbyPOI.narration) {
        // Fetch narration from MCP backend
        fetchNarrationFromMCP(nearbyPOI);
      } else {
        // POI already has narration
        setActiveNarration({ poi: nearbyPOI, text: nearbyPOI.narration, isLoading: false });
      }
    }
  }, [userLocation, pois, activeNarration, narrationCache, setActiveNarration]);

  const fetchNarrationFromMCP = async (poi: POI) => {
    try {
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
        setActiveNarration({ poi, text: narrationText, isLoading: false });
      } else {
        // Fallback narration if MCP fails
        const fallbackNarration = `You're near ${poi.name}, a ${poi.categories[0] || "point of interest"}.`;
        setActiveNarration({ poi, text: fallbackNarration, isLoading: false });
      }
    } catch (error) {
      console.error("Error fetching narration from MCP:", error);
      // Fallback narration
      const fallbackNarration = `You're near ${poi.name}, a ${poi.categories[0] || "point of interest"}.`;
      setActiveNarration({ poi, text: fallbackNarration, isLoading: false });
    }
  };

  if (!activeNarration) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[2000] h-1/2 animate-slide-up">
      <div className="h-full bg-white/95 backdrop-blur-sm shadow-2xl rounded-t-2xl border-t border-x border-blue-200 flex flex-col">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-blue-200">
          <h3 className="font-semibold text-xl text-slate-900">
            {activeNarration.poi.name}
          </h3>
          <button
            onClick={() => setActiveNarration(null)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close narration"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeNarration.isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-slate-600">Loading narration...</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mt-2" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-700 leading-relaxed text-base">
                  {activeNarration.text}
                </p>
                {userLocation && (
                  <div className="mt-3 text-sm text-slate-500">
                    {Math.round(activeNarration.poi.distance)}m away
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Placeholder for future avatar area */}
        <div className="h-0 w-0" />
      </div>
    </div>
  );
}

