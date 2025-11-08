"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type mapboxgl from "mapbox-gl";

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

type UserLocation = { lat: number; lon: number } | null;

type MapContextType = {
  // Mapbox instance (for map-controls, markers, etc.)
  map: mapboxgl.Map | null;
  setMap: (map: mapboxgl.Map | null) => void;

  // Location & POI state
  userLocation: UserLocation;
  setUserLocation: (loc: UserLocation) => void;

  selectedPOI: POI | null;
  setSelectedPOI: (poi: POI | null) => void;

  favorites: POI[];
  toggleFavorite: (poi: POI) => void;
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);

  // 🔹 Hard-coded location for now so you can test
  const [userLocation, setUserLocation] = useState<UserLocation>({
    lat: 40.3431, // Princeton
    lon: -74.6551,
  });

  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [favorites, setFavorites] = useState<POI[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("locify_favorites");
      if (raw) setFavorites(JSON.parse(raw));
    } catch (e) {
      console.error("Failed to load favorites", e);
    }
  }, []);

  const toggleFavorite = (poi: POI) => {
    setFavorites((prev) => {
      const exists = prev.some((p) => p.id === poi.id);
      const updated = exists
        ? prev.filter((p) => p.id !== poi.id)
        : [...prev, poi];

      window.localStorage.setItem(
        "locify_favorites",
        JSON.stringify(updated)
      );
      return updated;
    });
  };

  return (
    <MapContext.Provider
      value={{
        map,
        setMap,
        userLocation,
        setUserLocation,
        selectedPOI,
        setSelectedPOI,
        favorites,
        toggleFavorite,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapContext must be used within MapProvider");
  return ctx;
}

export function useMap() {
  const { map } = useMapContext();
  return { map }; 
}
