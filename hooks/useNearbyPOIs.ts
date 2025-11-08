"use client";

import { useMapContext } from "@/context/map-context";
import { MOCK_POIS } from "@/lib/mock-pois";

export type POI = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  categories: string[];
  address?: string;
  icon?: string | null;
};

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

export function useNearbyPOIs(radius = 1000) {
  const { userLocation } = useMapContext();

  if (!userLocation) return { pois: [] };

  const pois = MOCK_POIS.map((poi) => {
    const distance = getDistanceMeters(
      userLocation.lat,
      userLocation.lon,
      poi.lat,
      poi.lon
    );
    return { ...poi, distance };
  }).filter((poi) => poi.distance <= radius);

  return { pois };
}
