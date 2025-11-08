"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { MapProvider as ContextProvider, type UserLocation, useMapContext } from "@/context/map-context";

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!mapboxToken) {
  console.error(
    "NEXT_PUBLIC_MAPBOX_TOKEN is not set. Please add it to your .env.local file."
  );
}

mapboxgl.accessToken = mapboxToken || "";

type MapComponentProps = {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  initialViewState: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  children?: React.ReactNode;
};

// Inner component that handles map initialization and tracking
function MapboxProviderInner({
  mapContainerRef,
  initialViewState,
  children,
}: MapComponentProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const watchId = useRef<number | null>(null);
  const compassHeadingRef = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { setMap, setUserLocation, startTracking: contextStartTracking, stopTracking: contextStopTracking } = useMapContext();

  // Handle device orientation (compass) for heading
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null && !isNaN(event.alpha)) {
        compassHeadingRef.current = event.alpha;
        
        setUserLocation((prevLocation: UserLocation | null) => {
          if (prevLocation) {
            return {
              ...prevLocation,
              heading: event.alpha ?? prevLocation.heading,
            };
          }
          return prevLocation;
        });
      }
    };

    // Request permission for device orientation (required on iOS)
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch((error: Error) => {
          console.error('Error requesting device orientation permission:', error);
        });
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [setUserLocation]);

  const startTracking = useCallback(() => {
    contextStartTracking();

    if ("geolocation" in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const heading = compassHeadingRef.current ?? position.coords.heading ?? undefined;
          
          const location: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: heading,
          };
          setUserLocation(location);
          console.log("Location updated:", location);
        },
        (error) => {
          console.error("Geolocation error:", error.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      );
    }
  }, [contextStartTracking, setUserLocation]);

  const stopTracking = useCallback(() => {
    contextStopTracking();
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    compassHeadingRef.current = null;
    setUserLocation(null);
  }, [contextStopTracking, setUserLocation]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: [initialViewState.longitude, initialViewState.latitude],
      zoom: initialViewState.zoom,
      attributionControl: false,
      logoPosition: "bottom-right",
    });

    mapRef.current = map;

    map.on("load", () => {
      setLoaded(true);
      setMap(map);
    });

    setMap(map);

    // Expose tracking functions
    (map as any).startTracking = startTracking;
    (map as any).stopTracking = stopTracking;

    return () => {
      stopTracking();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMap(null);
      }
    };
  }, [initialViewState, mapContainerRef, setMap, stopTracking, startTracking]);

  return (
    <>
      {children}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-[1000]">
          <div className="text-lg font-medium">Loading map...</div>
        </div>
      )}
    </>
  );
}

// Main provider component that wraps with context
export default function MapboxProvider(props: MapComponentProps): React.ReactElement {
  return (
    <ContextProvider>
      <MapboxProviderInner {...props} />
    </ContextProvider>
  );
}
