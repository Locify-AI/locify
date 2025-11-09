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
  narration?: string; // MCP-provided narration text about this place
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
  // Internal refs for actual tracking functions (set by provider)
  _setStartTrackingImpl?: (fn: () => void) => void;
  _setStopTrackingImpl?: (fn: () => void) => void;

  // POI state
  pois: POI[];
  setPois: (pois: POI[]) => void;
  selectedPOI: POI | null;
  setSelectedPOI: (poi: POI | null) => void;
  favorites: POI[];
  toggleFavorite: (poi: POI) => void;
  // Active narration (shown when user is close to a POI or clicks a POI)
  activeNarration: { poi: POI; text: string; isLoading?: boolean } | null;
  setActiveNarration: (narration: { poi: POI; text: string; isLoading?: boolean } | null) => void;
  // Manual POI discovery
  scanForPOIs: (radius?: number) => Promise<void>;
  isScanning: boolean;
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocationState] = useState<UserLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [pois, setPois] = useState<POI[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [favorites, setFavorites] = useState<POI[]>([]);
  const [activeNarration, setActiveNarration] = useState<{ poi: POI; text: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const startTrackingImplRef = useRef<(() => void) | null>(null);
  const stopTrackingImplRef = useRef<(() => void) | null>(null);

  // Wrapper for setUserLocation to support function updates
  const setUserLocation = (location: UserLocation | null | ((prev: UserLocation | null) => UserLocation | null)) => {
    if (typeof location === 'function') {
      setUserLocationState(location);
    } else {
      setUserLocationState(location);
    }
  };

  const _setStartTrackingImpl = (fn: () => void) => {
    startTrackingImplRef.current = fn;
  };

  const _setStopTrackingImpl = (fn: () => void) => {
    stopTrackingImplRef.current = fn;
  };

  // Load favorites from localStorage (defer state update to microtask to avoid synchronous render warning)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("locify_favorites");
      if (raw) {
        const parsed = JSON.parse(raw);
        Promise.resolve().then(() => setFavorites(parsed));
      }
    } catch (e) {
      console.error("Failed to load favorites", e);
    }
  }, []);

  // Load POIs from localStorage on mount (synchronous check, async state update)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("locify_pois");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Set immediately to prevent race condition with discovery fetch
          setPois(parsed);
          console.log(`Loaded ${parsed.length} POIs from localStorage`);
        }
      }
    } catch (e) {
      console.error("Failed to load POIs from localStorage", e);
    }
  }, []);

  // Save POIs to localStorage whenever they change
  useEffect(() => {
    if (pois.length > 0) {
      try {
        window.localStorage.setItem("locify_pois", JSON.stringify(pois));
      } catch (e) {
        console.error("Failed to save POIs to localStorage", e);
      }
    }
  }, [pois]);

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
    // Call the actual implementation from provider
    if (startTrackingImplRef.current) {
      startTrackingImplRef.current();
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    // Call the actual implementation from provider
    if (stopTrackingImplRef.current) {
      stopTrackingImplRef.current();
    }
  };

  // Manual POI discovery function
  const scanForPOIs = async (radius = 2000) => {
    if (isScanning) return; // Prevent concurrent scans
    
    setIsScanning(true);
    try {
      // Use userLocation if available, otherwise use default coordinate (Princeton)
      const DEFAULT_LAT = 40.3431;
      const DEFAULT_LON = -74.6551;
      const lat = userLocation?.latitude ?? DEFAULT_LAT;
      const lon = userLocation?.longitude ?? DEFAULT_LON;

      const response = await fetch(
        `/api/places?lat=${lat}&lon=${lon}&radius=${radius}`
      );
      
      if (!response.ok) {
        console.error("Failed to fetch POIs:", response.statusText);
        return;
      }

      const data: unknown = await response.json();
      type RawPoi = { 
        id: string; 
        name: string; 
        lat: number; 
        lon: number; 
        categories?: string[]; 
        address?: string; 
        icon?: string | null; 
        narration?: string;
      };
      
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

      // Clear old POIs and set new ones
      setPois(basePois);
      console.log(`Scanned and loaded ${basePois.length} new POIs`);
    } catch (e) {
      console.error("Error scanning for POIs:", e);
    } finally {
      setIsScanning(false);
    }
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
        _setStartTrackingImpl,
        _setStopTrackingImpl,
        pois,
        setPois,
        selectedPOI,
        setSelectedPOI,
        favorites,
        toggleFavorite,
        activeNarration,
        setActiveNarration,
        scanForPOIs,
        isScanning,
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

