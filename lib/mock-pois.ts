// lib/mock-pois.ts
// Random POI locations for testing
// Will be replaced by Python backend using MCPs

import type { POI } from "@/context/map-context";

// Generate random POIs around a center point
function generateRandomPOI(
  id: string,
  name: string,
  centerLat: number,
  centerLon: number,
  radiusKm: number = 2,
  categories: string[]
): POI {
  // Generate random angle and distance
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusKm; // km
  
  // Convert to lat/lon offset
  const latOffset = (distance / 111) * Math.cos(angle);
  const lonOffset = (distance / (111 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
  
  return {
    id,
    name,
    lat: centerLat + latOffset,
    lon: centerLon + lonOffset,
    distance: 0, // will be computed
    categories,
    address: undefined,
    icon: null,
  };
}

// Center point (Princeton area)
const CENTER_LAT = 40.3431;
const CENTER_LON = -74.6551;

export const MOCK_POIS: POI[] = [
  generateRandomPOI("poi-1", "Historic Landmark", CENTER_LAT, CENTER_LON, 1.5, ["Historic Building"]),
  generateRandomPOI("poi-2", "Art Gallery", CENTER_LAT, CENTER_LON, 1.5, ["Museum", "Art"]),
  generateRandomPOI("poi-3", "Public Library", CENTER_LAT, CENTER_LON, 1.5, ["Library"]),
  generateRandomPOI("poi-4", "Memorial Park", CENTER_LAT, CENTER_LON, 1.5, ["Park", "Memorial"]),
  generateRandomPOI("poi-5", "University Chapel", CENTER_LAT, CENTER_LON, 1.5, ["Religious", "Historic Building"]),
  generateRandomPOI("poi-6", "Science Museum", CENTER_LAT, CENTER_LON, 1.5, ["Museum", "Science"]),
  generateRandomPOI("poi-7", "Botanical Garden", CENTER_LAT, CENTER_LON, 1.5, ["Garden", "Nature"]),
  generateRandomPOI("poi-8", "Historic Bridge", CENTER_LAT, CENTER_LON, 1.5, ["Historic Building", "Bridge"]),
];

