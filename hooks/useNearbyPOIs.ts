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

export function useNearbyPOIs(radius = 2000) {
  const { userLocation, pois } = useMapContext();
  const [loading, setLoading] = useState(false);

  // Note: POIs are now only fetched when the search button is clicked
  // No automatic fetching on mount

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
