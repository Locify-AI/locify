"use client";

import { useEffect, useState } from "react";
import { useMapContext } from "@/context/map-context";
import { useNearbyPOIs, type POI } from "@/hooks/useNearbyPOIs";
import { ChevronUp, ChevronDown, X, Loader2 } from "lucide-react";

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
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [locationIdCache, setLocationIdCache] = useState<Map<string, number>>(new Map());

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
          // Check for existing video or generate new one
          handleVideoForPOI(nearbyPOI);
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
          // Check for existing video or generate new one
          handleVideoForPOI(nearbyPOI);
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

  const handleVideoForPOI = async (poi: POI) => {
    try {
      // Check if POI already has audio_url in memory
      if (poi.audio_url) {
        setVideoUrl(poi.audio_url);
        setIsLoadingVideo(false);
        return;
      }

      // Get the database location_id for this POI
      const cachedLocationId = locationIdCache.get(poi.id);
      let locationId = cachedLocationId;
      let existingVideoUrl: string | null = null;

      // Always fetch from backend to check for existing video
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

      if (!locationId) {
        // Fetch location details from backend to get the database ID
        const locationResponse = await fetch(`${backendUrl}/api/locations`);

        if (locationResponse.ok) {
          const locationsData = await locationResponse.json();
          const matchingLocation = locationsData.locations?.find(
            (loc: any) => loc.name === poi.name &&
            Math.abs(loc.latitude - poi.lat) < 0.0001 &&
            Math.abs(loc.longitude - poi.lon) < 0.0001
          );

          if (matchingLocation?.id) {
            locationId = matchingLocation.id;
            // Cache the location ID
            setLocationIdCache((prev) => {
              const newCache = new Map(prev);
              newCache.set(poi.id, locationId!);
              return newCache;
            });

            existingVideoUrl = matchingLocation.audio_url || null;
          }
        }
      } else {
        // We have cached location ID, fetch the specific location to check for video
        const locationDetailResponse = await fetch(`${backendUrl}/api/locations/${locationId}`);

        if (locationDetailResponse.ok) {
          const locationDetail = await locationDetailResponse.json();
          existingVideoUrl = locationDetail.audio_url || null;
        }
      }

      // If video exists in database, use it
      if (existingVideoUrl) {
        console.log(`Found existing video for ${poi.name}:`, existingVideoUrl);
        setVideoUrl(existingVideoUrl);
        poi.audio_url = existingVideoUrl;
        setIsLoadingVideo(false);
        return;
      }

      if (!locationId) {
        console.warn("Could not find database location_id for POI:", poi.name);
        setIsLoadingVideo(false);
        return;
      }

      // No existing video found, generate new one
      console.log(`Generating new video for ${poi.name} (location_id: ${locationId})`);
      setIsLoadingVideo(true);
      const avatarResponse = await fetch(`${backendUrl}/api/generate-talking-avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location_id: locationId }),
      });

      if (avatarResponse.ok) {
        const avatarData = await avatarResponse.json();
        console.log(`Video generated successfully for ${poi.name}:`, avatarData.s3_url);
        setVideoUrl(avatarData.s3_url);
        // Update POI with the new video URL
        poi.audio_url = avatarData.s3_url;
      } else {
        console.error("Failed to generate avatar video:", await avatarResponse.text());
      }
    } catch (error) {
      console.error("Error handling video for POI:", error);
    } finally {
      setIsLoadingVideo(false);
    }
  };

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

        // Handle video generation
        handleVideoForPOI(poi);
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

  const hasVideo = videoUrl || activeNarration.poi.audio_url;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[2000] transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden">
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

        {/* Content - Expandable */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {isLoadingVideo ? (
            <div className="w-full p-8 flex flex-col items-center justify-center bg-gray-50">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-sm text-slate-600">Generating avatar video...</p>
              <p className="text-xs text-slate-400 mt-1">This may take a moment</p>
            </div>
          ) : hasVideo ? (
            <div className="w-full">
              <video
                src={videoUrl || activeNarration.poi.audio_url}
                controls
                autoPlay
                playsInline
                className="w-full max-h-[500px] object-contain bg-black"
                onError={(e) => {
                  console.error("Video playback error:", e);
                }}
              >
                Your browser does not support the video tag.
              </video>
              {/* Optional: Show text narration below video */}
              <div className="p-4 pt-2 border-t border-gray-100">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeNarration.text}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 pt-2">
              <p className="text-slate-700 leading-relaxed">
                {activeNarration.text}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

