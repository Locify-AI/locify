"use client";

import { createContext, useContext } from "react";
import mapboxgl from "mapbox-gl";

export type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number; // Compass heading in degrees (0-360)
};

export type MapContextType = {
  map: mapboxgl.Map | null;
  userLocation: UserLocation | null;
  setUserLocation: (location: UserLocation | null) => void;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
};

export const MapContext = createContext<MapContextType>({
  map: null,
  userLocation: null,
  setUserLocation: () => {},
  isTracking: false,
  startTracking: () => {},
  stopTracking: () => {},
});

export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a MapProvider");
  }
  return context;
}

