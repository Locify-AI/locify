"use client";

import { useEffect, useState } from "react";
import { useMapContext } from "@/context/map-context";
import { useNearbyPOIs, type POI } from "@/hooks/useNearbyPOIs";
import { ChevronUp, ChevronDown, X } from "lucide-react";

const PROXIMITY_THRESHOLD = 50; // meters - show narration when within 50m

/**
 * Component that detects when user is close to a POI and displays MCP narration
 * in a Google Maps-style bottom tab with smooth animations
 */
export default function PoiNarration() {
  const { userLocation, activeNarration, setActiveNarration } = useMapContext();
  const { pois } = useNearbyPOIs(2000); // Check POIs within 2km
  const [narrationCache, setNarrationCache] = useState<Map<string, string>>(new Map());
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!userLocation || pois.length === 0) {
      if (activeNarration) {
        setIsVisible(false);
        // Delay clearing narration to allow exit animation
        setTimeout(() => setActiveNarration(null), 300);
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
          setIsVisible(true);
          setIsExpanded(true);
        }
      } else if (!nearbyPOI.narration) {
        // Fetch narration from MCP backend
        fetchNarrationFromMCP(nearbyPOI);
      } else {
        // POI already has narration
        if (!activeNarration || activeNarration.poi.id !== nearbyPOI.id) {
          setActiveNarration({ poi: nearbyPOI, text: nearbyPOI.narration });
          setIsVisible(true);
          setIsExpanded(true);
        }
      }
    } else {
      // User moved away from all POIs
      if (activeNarration) {
        setIsVisible(false);
        setTimeout(() => setActiveNarration(null), 300);
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
        setIsVisible(true);
        setIsExpanded(true);
      } else {
        // Fallback narration if MCP fails
        const fallbackNarration = `You're near ${poi.name}, a ${poi.categories[0] || "point of interest"}.`;
        setActiveNarration({ poi, text: fallbackNarration });
        setIsVisible(true);
        setIsExpanded(true);
      }
    } catch (error) {
      console.error("Error fetching narration from MCP:", error);
      // Fallback narration
      const fallbackNarration = `You're near ${poi.name}, a ${poi.categories[0] || "point of interest"}.`;
      setActiveNarration({ poi, text: fallbackNarration });
      setIsVisible(true);
      setIsExpanded(true);
    }
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setActiveNarration(null), 300);
  };

  if (!activeNarration) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[2000] transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-4 mb-4 bg-white rounded-t-3xl shadow-2xl overflow-hidden">
        {/* Header - Always visible */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer border-b border-gray-100"
          onClick={handleToggle}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-slate-900 truncate">
                {activeNarration.poi.name}
              </h3>
              <div className="text-xs text-slate-500">
                {Math.round(activeNarration.poi.distance)}m away
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-slate-600" />
            </button>
            <button
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown size={20} className="text-slate-600" />
              ) : (
                <ChevronUp size={20} className="text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Content - Expandable */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="p-4 pt-2">
            <p className="text-slate-700 leading-relaxed">
              {activeNarration.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

