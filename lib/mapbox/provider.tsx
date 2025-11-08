"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { MapContext, type UserLocation } from "@/context/map-context";

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

export default function MapProvider({
  mapContainerRef,
  initialViewState,
  children,
}: MapComponentProps) {
  const map = useRef<mapboxgl.Map | null>(null);
  const watchId = useRef<number | null>(null);
  const compassHeadingRef = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Handle device orientation (compass) for heading
  useEffect(() => {
    if (!isTracking) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      // Use alpha (compass heading) if available
      // Alpha is 0-360 degrees, where 0 is north
      if (event.alpha !== null && !isNaN(event.alpha)) {
        compassHeadingRef.current = event.alpha;
        
        // Update user location with new heading if location exists
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
          } else {
            console.warn('Device orientation permission denied');
          }
        })
        .catch((error: Error) => {
          console.error('Error requesting device orientation permission:', error);
        });
    } else {
      // For browsers that don't require permission
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isTracking]);

  const startTracking = useCallback(() => {
    setIsTracking(true);

    if ("geolocation" in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          // Use compass heading if available, otherwise use geolocation heading
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
          // Don't stop tracking on error, keep trying
        },
        {
          enableHighAccuracy: true, // Uses GPS for better accuracy
          maximumAge: 0, // Don't use cached positions - get fresh data every time
          timeout: 10000, // Wait up to 10 seconds for position
        }
      );
    }
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    compassHeadingRef.current = null;
    setUserLocation(null);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: [initialViewState.longitude, initialViewState.latitude],
      zoom: initialViewState.zoom,
      attributionControl: false,
      logoPosition: "bottom-right",
    });

    map.current.on("load", () => {
      setLoaded(true);
      setMapInstance(map.current);
    });

    setMapInstance(map.current);

    return () => {
      stopTracking();
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapInstance(null);
      }
    };
  }, [initialViewState, mapContainerRef, stopTracking]);

  return (
    <>
      <MapContext.Provider
        value={{
          map: mapInstance,
          userLocation,
          setUserLocation,
          isTracking,
          startTracking,
          stopTracking,
        }}
      >
        {children}
      </MapContext.Provider>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-[1000]">
          <div className="text-lg font-medium">Loading map...</div>
        </div>
      )}
    </>
  );
}
