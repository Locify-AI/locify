"use client";

import { useState, useEffect, useRef } from "react";
import { useMapContext } from "@/context/map-context";
import type { POI } from "@/context/map-context";

function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // meters
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Default coordinate (Princeton, NJ) for discovery on app mount
const DEFAULT_LAT = 40.3431;
const DEFAULT_LON = -74.6551;

export function useNearbyPOIs(radius = 2000) {
  const { userLocation, pois, setPois } = useMapContext();
  const [loading, setLoading] = useState(false);
  const fetchedOnceRef = useRef(false);

  // Fetch POIs once on mount (or when userLocation becomes available)
  // Uses default coordinate if no userLocation yet, or userLocation if available
  useEffect(() => {
    if (fetchedOnceRef.current) return;
    
    // Check localStorage synchronously to avoid race condition
    let hasCachedPois = false;
    try {
      const raw = window.localStorage.getItem("locify_pois");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          hasCachedPois = true;
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    
    if (hasCachedPois || pois.length > 0) {
      // POIs already cached in localStorage or context, skip fetch
      fetchedOnceRef.current = true;
      return;
    }

    const run = async () => {
      // Use userLocation if available, otherwise use default coordinate (Princeton)
      const lat = userLocation?.latitude ?? DEFAULT_LAT;
      const lon = userLocation?.longitude ?? DEFAULT_LON;
      
      setLoading(true);
      try {
        const response = await fetch(
          `/api/places?lat=${lat}&lon=${lon}&radius=${radius}`
        );
        if (!response.ok) {
          console.error("Failed to fetch POIs:", response.statusText);
          return;
        }
        const data: unknown = await response.json();
        type RawPoi = { id: string; name: string; lat: number; lon: number; categories?: string[]; address?: string; icon?: string | null; narration?: string };
        const extractPois = (v: unknown): RawPoi[] => {
          if (!v || typeof v !== "object") return [];
          const maybe = (v as { pois?: unknown }).pois;
          if (!Array.isArray(maybe)) return [];
          const isRawPoi = (item: unknown): item is RawPoi => {
            if (!item || typeof item !== "object") return false;
            const r = item as Record<string, unknown>;
            return (
              typeof r.id === "string" &&
              typeof r.name === "string" &&
              typeof r.lat === "number" &&
              typeof r.lon === "number"
            );
          };
          return maybe.filter(isRawPoi);
        };
        const rawArray = extractPois(data);
        const basePois: POI[] = rawArray.map((p) => ({
          id: p.id,
          name: p.name,
          lat: p.lat,
          lon: p.lon,
          distance: 0,
            categories: p.categories || [],
          address: p.address,
          icon: p.icon,
          narration: p.narration,
        }));
        setPois(basePois);
        fetchedOnceRef.current = true;
        console.log(`Fetched ${basePois.length} POIs (using ${userLocation ? 'user location' : 'default coordinate'})`);
      } catch (e) {
        console.error("Error fetching POIs:", e);
      } finally {
        setLoading(false);
      }
    };
    
    // Small delay to ensure context is ready
    const timeoutId = setTimeout(run, 100);
    return () => clearTimeout(timeoutId);
  }, [userLocation, pois.length, radius, setPois]);

  // Return POIs with dynamic distance filter
  const enriched = (userLocation
    ? pois.map(p => ({
        ...p,
        distance: getDistanceMeters(userLocation.latitude, userLocation.longitude, p.lat, p.lon),
      }))
    : []
  ).filter(p => p.distance <= radius);

  return { pois: enriched, loading };
}
