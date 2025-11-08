"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import mapboxgl from "mapbox-gl";

// User location type (for tracking)
export type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number; // Compass heading in degrees (0-360)
};

// POI type (for Points of Interest)
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

// Combined context type
export type MapContextType = {
  // Mapbox instance
  map: mapboxgl.Map | null;
  setMap: (map: mapboxgl.Map | null) => void;

  // User location tracking
  userLocation: UserLocation | null;
  setUserLocation: (location: UserLocation | null | ((prev: UserLocation | null) => UserLocation | null)) => void;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;

  // POI state
  selectedPOI: POI | null;
  setSelectedPOI: (poi: POI | null) => void;
  favorites: POI[];
  toggleFavorite: (poi: POI) => void;
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocationState] = useState<UserLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [favorites, setFavorites] = useState<POI[]>([]);

  // Wrapper for setUserLocation to support function updates
  const setUserLocation = (location: UserLocation | null | ((prev: UserLocation | null) => UserLocation | null)) => {
    if (typeof location === 'function') {
      setUserLocationState(location);
    } else {
      setUserLocationState(location);
    }
  };

  // Load favorites from localStorage
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

  const startTracking = () => {
    setIsTracking(true);
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  return (
    <MapContext.Provider
      value={{
        map,
        setMap,
        userLocation,
        setUserLocation,
        isTracking,
        startTracking,
        stopTracking,
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

// Backward compatibility hook
export function useMap() {
  const ctx = useMapContext();
  return {
    map: ctx.map,
    userLocation: ctx.userLocation,
    setUserLocation: ctx.setUserLocation,
    isTracking: ctx.isTracking,
    startTracking: ctx.startTracking,
    stopTracking: ctx.stopTracking,
  };
}
