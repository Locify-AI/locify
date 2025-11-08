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
  const stopTrackingRef = useRef<(() => void) | null>(null);
  const locationRequestedRef = useRef(false);
  const startTrackingRef = useRef<(() => void) | null>(null);
  const trackingStartedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const { setMap, setUserLocation, startTracking: contextStartTracking, stopTracking: contextStopTracking, _setStartTrackingImpl, _setStopTrackingImpl } = useMapContext();

  // Handle device orientation (compass) for heading
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null && !isNaN(event.alpha)) {
        // Convert device orientation alpha (0-360, counter-clockwise) to compass heading (0-360, clockwise)
        // Formula: heading = (360 - alpha) % 360
        const heading = (360 - event.alpha) % 360;
        compassHeadingRef.current = heading;
        
        // Update heading only if we have a location (use functional update to avoid dependency)
        setUserLocation((prevLocation: UserLocation | null) => {
          if (prevLocation) {
            return {
              ...prevLocation,
              heading: heading,
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
    // setUserLocation is now memoized, so this dependency is safe
  }, [setUserLocation]);

  const startTracking = useCallback(() => {
    // Don't call contextStartTracking here - it creates infinite loop
    // The context will set isTracking flag, we just do the actual geolocation work
    
    // Prevent multiple simultaneous tracking starts
    if (trackingStartedRef.current && watchId.current !== null) {
      return;
    }
    
    if ("geolocation" in navigator) {
      // Clear any existing watch
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      
      trackingStartedRef.current = true;
      
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
          trackingStartedRef.current = false;
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      );
    }
  }, [setUserLocation]);

  // Store startTracking in ref for use in location request effect
  startTrackingRef.current = startTracking;

  const stopTracking = useCallback(() => {
    // Don't call contextStopTracking here - it creates infinite loop
    // The context will set isTracking flag, we just do the actual cleanup
    
    trackingStartedRef.current = false;
    
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    compassHeadingRef.current = null;
    // Don't clear userLocation when stopping - keep the last known position
    // setUserLocation(null);
  }, []); // Remove setUserLocation dependency to prevent loops

  // Store stopTracking in ref to avoid dependency issues
  stopTrackingRef.current = stopTracking;

  // Expose tracking functions to context
  useEffect(() => {
    if (_setStartTrackingImpl) {
      _setStartTrackingImpl(startTracking);
    }
    if (_setStopTrackingImpl) {
      _setStopTrackingImpl(stopTracking);
    }
  }, [startTracking, stopTracking, _setStartTrackingImpl, _setStopTrackingImpl]);

  // Request user location on mount and update map center (only once)
  useEffect(() => {
    if (locationRequestedRef.current) return;
    locationRequestedRef.current = true;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location: UserLocation = {
            latitude,
            longitude,
            accuracy: position.coords.accuracy,
          };
          setUserLocation(location);
          
          // Update map center once map is loaded
          const updateMapCenter = () => {
            if (mapRef.current) {
              mapRef.current.flyTo({
                center: [longitude, latitude],
                zoom: 15,
                duration: 2000,
              });
            } else {
              // Map not loaded yet, try again after a short delay
              setTimeout(updateMapCenter, 100);
            }
          };
          updateMapCenter();
          
          // Start tracking automatically (use ref to ensure it's available)
          // Only start if not already tracking
          if (startTrackingRef.current && !trackingStartedRef.current) {
            // Use setTimeout to defer tracking start and prevent immediate state updates
            setTimeout(() => {
              if (startTrackingRef.current && !trackingStartedRef.current) {
                startTrackingRef.current();
              }
            }, 100);
          }
        },
        (error) => {
          console.error("Error getting initial location:", error);
          // If location is denied, use initial view state
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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
      // Use ref to avoid dependency issues
      if (stopTrackingRef.current) {
        stopTrackingRef.current();
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMap(null);
      }
    };
  }, [initialViewState, mapContainerRef, setMap, setUserLocation]);

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
export default function MapboxProvider(props: MapComponentProps) {
  return (
    <ContextProvider>
      <MapboxProviderInner {...props} />
    </ContextProvider>
  );
}
