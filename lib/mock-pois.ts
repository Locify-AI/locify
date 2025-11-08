// lib/mock-pois.ts

import type { POI } from "@/hooks/useNearbyPOIs";

// Assume your hard-coded userLocation is Princeton-ish:
// { lat: 40.3431, lon: -74.6551 }

export const MOCK_POIS: POI[] = [
  {
    id: "nassau-hall",
    name: "Nassau Hall",
    lat: 40.3487,
    lon: -74.6593,
    distance: 0, // will recompute
    categories: ["Historic Building"],
    address: "Princeton University, Princeton, NJ",
    icon: null,
  },
  {
    id: "firestone-library",
    name: "Firestone Library",
    lat: 40.3493,
    lon: -74.6582,
    distance: 0,
    categories: ["Library"],
    address: "1 Washington Rd, Princeton, NJ",
    icon: null,
  },
  {
    id: "art-museum",
    name: "Princeton University Art Museum",
    lat: 40.3473,
    lon: -74.6586,
    distance: 0,
    categories: ["Museum"],
    address: "Elm Dr, Princeton, NJ",
    icon: null,
  },
  {
    id: "prospect-garden",
    name: "Prospect Garden",
    lat: 40.3479,
    lon: -74.6559,
    distance: 0,
    categories: ["Park", "Garden"],
    address: "Princeton University, Princeton, NJ",
    icon: null,
  },
];
