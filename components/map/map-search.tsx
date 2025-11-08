"use client";

import { useMap, useMapContext } from "@/context/map-context";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, X, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import React from "react";
import mapboxgl from "mapbox-gl";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { iconMap, LocationSuggestion } from "@/lib/mapbox/utils";
import type { POI } from "@/context/map-context";

interface SearchPulseProps {
  latitude: number;
  longitude: number;
  isActive: boolean;
}

function SearchPulse({ latitude, longitude, isActive }: SearchPulseProps) {
  const { map } = useMap();
  const pulseRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!isActive) {
      if (pulseRef.current) {
        pulseRef.current.remove();
        pulseRef.current = null;
      }
      return;
    }

    // Create pulse marker container
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.width = "0";
    container.style.height = "0";
    container.style.pointerEvents = "none";

    // Create outer giant pulse circle (larger radius)
    const outerPulse = document.createElement("div");
    outerPulse.style.position = "absolute";
    outerPulse.style.left = "50%";
    outerPulse.style.top = "50%";
    outerPulse.style.transform = "translate(-50%, -50%)";
    outerPulse.style.width = "300px";
    outerPulse.style.height = "300px";
    outerPulse.style.borderRadius = "50%";
    outerPulse.style.border = "5px solid rgba(59, 130, 246, 0.5)";
    outerPulse.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
    outerPulse.style.animation = "pulse-expand 2s ease-out infinite";
    outerPulse.style.pointerEvents = "none";
    outerPulse.style.zIndex = "1000";
    container.appendChild(outerPulse);

    // Create middle pulse circle
    const middlePulse = document.createElement("div");
    middlePulse.style.position = "absolute";
    middlePulse.style.left = "50%";
    middlePulse.style.top = "50%";
    middlePulse.style.transform = "translate(-50%, -50%)";
    middlePulse.style.width = "250px";
    middlePulse.style.height = "250px";
    middlePulse.style.borderRadius = "50%";
    middlePulse.style.border = "4px solid rgba(59, 130, 246, 0.6)";
    middlePulse.style.backgroundColor = "rgba(59, 130, 246, 0.2)";
    middlePulse.style.animation = "pulse-expand 2s ease-out infinite 0.3s";
    middlePulse.style.pointerEvents = "none";
    middlePulse.style.zIndex = "1001";
    container.appendChild(middlePulse);

    // Create inner pulse circle
    const innerPulse = document.createElement("div");
    innerPulse.style.position = "absolute";
    innerPulse.style.left = "50%";
    innerPulse.style.top = "50%";
    innerPulse.style.transform = "translate(-50%, -50%)";
    innerPulse.style.width = "200px";
    innerPulse.style.height = "200px";
    innerPulse.style.borderRadius = "50%";
    innerPulse.style.border = "3px solid rgba(59, 130, 246, 0.8)";
    innerPulse.style.backgroundColor = "rgba(59, 130, 246, 0.3)";
    innerPulse.style.animation = "pulse-expand 2s ease-out infinite 0.6s";
    innerPulse.style.pointerEvents = "none";
    innerPulse.style.zIndex = "1002";
    container.appendChild(innerPulse);

    const marker = new mapboxgl.Marker({
      element: container,
      anchor: "center",
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    pulseRef.current = marker;

    return () => {
      if (pulseRef.current) {
        pulseRef.current.remove();
        pulseRef.current = null;
      }
    };
  }, [map, latitude, longitude, isActive]);

  return null;
}

export default function MapSearch() {
  const { map, userLocation } = useMap();
  const { setPois } = useMapContext();
  const [query, setQuery] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [results, setResults] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchPulseActive, setSearchPulseActive] = useState(false);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Search for suggestions
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchLocations = async () => {
      setIsSearching(true);
      setIsOpen(true);

      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            debouncedQuery
          )}.json?access_token=${
            process.env.NEXT_PUBLIC_MAPBOX_TOKEN
          }&limit=5&types=poi,address,place`
        );

        const data = await response.json() as {
          features?: Array<{
            place_name?: string;
            text?: string;
            center?: [number, number];
            properties?: {
              maki?: string;
              category?: string;
            };
          }>;
        };
        
        if (data.features) {
          const suggestions: LocationSuggestion[] = data.features.map((feature) => ({
            name: feature.place_name || feature.text || "Unknown",
            place_formatted: feature.place_name || "",
            center: feature.center,
            maki: feature.properties?.maki || feature.properties?.category,
            full_address: feature.place_name,
            coordinates: feature.center
              ? {
                  latitude: feature.center[1],
                  longitude: feature.center[0],
                }
              : undefined,
          }));
          setResults(suggestions);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchLocations();
  }, [debouncedQuery]);

  // Handle location selection
  const handleSelect = (suggestion: LocationSuggestion) => {
    if (!map || !suggestion.center) return;

    const [lng, lat] = suggestion.center;

    // Fly to location
    map.flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 1500,
    });

    setDisplayValue(suggestion.name);
    setResults([]);
    setIsOpen(false);
    setQuery("");
  };

  // Clear search
  const clearSearch = () => {
    setQuery("");
    setDisplayValue("");
    setResults([]);
    setIsOpen(false);
  };

  // Handle input change
  const handleInputChange = (value: string) => {
    setQuery(value);
    setDisplayValue(value);
    if (value.trim()) {
      setIsOpen(true);
    }
  };

  // Handle search for places (calls API)
  const handleSearchPlaces = async () => {
    if (!map) return;

    setIsSearchingPlaces(true);

    try {
      // DUMMY LOCATION FOR TESTING
      const dummyLat = 40.350285;
      const dummyLng = -74.65778;
      
      let lat: number;
      let lng: number;

      if (userLocation) {
        // Use existing user location (will be dummy location in test mode)
        lat = userLocation.latitude;
        lng = userLocation.longitude;
      } else {
        // Use dummy location for testing
        lat = dummyLat;
        lng = dummyLng;
        
        // REAL LOCATION CODE - COMMENTED OUT FOR TESTING
        /*
        // Request user location
        const location = await new Promise<{ lat: number; lng: number }>((resolve) => {
          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                });
              },
              (error) => {
                console.error("Error getting location:", error);
                // Fallback to map center
                const center = map.getCenter();
                resolve({
                  lat: center.lat,
                  lng: center.lng,
                });
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
              }
            );
          } else {
            // Fallback to map center
            const center = map.getCenter();
            resolve({
              lat: center.lat,
              lng: center.lng,
            });
          }
        });
        lat = location.lat;
        lng = location.lng;
        */
      }

      // Fly to user location
      map.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 1500,
      });

      // Wait for animation to complete, then show pulse and search
      setTimeout(() => {
        setSearchPulseActive(true);
        setSearchCenter({ lat, lng });

        // Call the places API
        fetch(`/api/places?lat=${lat}&lon=${lng}&radius=1000`)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to search for places");
            }
            return response.json();
          })
          .then((data) => {
            // Update POIs in context from API response
            if (data.pois && Array.isArray(data.pois)) {
              const newPois: POI[] = data.pois.map((p: {
                id: string;
                name: string;
                lat: number;
                lon: number;
                categories?: string[];
                address?: string;
                icon?: string | null;
                narration?: string;
              }) => ({
                id: p.id,
                name: p.name,
                lat: p.lat,
                lon: p.lon,
                distance: 0, // Will be calculated by useNearbyPOIs
                categories: p.categories || [],
                address: p.address,
                icon: p.icon,
                narration: p.narration,
              }));
              setPois(newPois);
              console.log(`Found and updated ${newPois.length} places`);
            }

            // Keep pulse active for 4 seconds to show the animation
            setTimeout(() => {
              setSearchPulseActive(false);
              setSearchCenter(null);
            }, 4000);
          })
          .catch((error) => {
            console.error("Error searching places:", error);
            setSearchPulseActive(false);
            setSearchCenter(null);
          })
          .finally(() => {
            setIsSearchingPlaces(false);
          });
      }, 1600); // Wait for flyTo animation to complete
    } catch (error) {
      console.error("Error searching places:", error);
      setSearchPulseActive(false);
      setSearchCenter(null);
      setIsSearchingPlaces(false);
    }
  };

  if (!map) return null;

  return (
    <>
      <section className="absolute top-4 left-1/2 sm:left-4 z-[1001] w-[90vw] sm:w-[400px] -translate-x-1/2 sm:translate-x-0">
        <Command className="rounded-lg border bg-background/95 backdrop-blur-sm shadow-lg">
          <div
            className={cn(
              "w-full flex items-center justify-between px-3 gap-2",
              isOpen && results.length > 0 && "border-b"
            )}
          >
            <CommandInput
              placeholder="Search locations..."
              value={displayValue}
              onValueChange={handleInputChange}
              className="flex-1 border-0 focus:ring-0"
            />
            {displayValue && !isSearching && (
              <X
                className="size-4 shrink-0 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={clearSearch}
              />
            )}
            {isSearching && (
              <Loader2 className="size-4 shrink-0 text-primary animate-spin" />
            )}
            {/* Search places button */}
            <Button
              onClick={handleSearchPlaces}
              disabled={isSearchingPlaces}
              size="icon"
              variant="default"
              className="h-8 w-8 shrink-0"
              title="Search for places nearby"
            >
              {isSearchingPlaces ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {isOpen && query.trim() && (
            <CommandList className="max-h-60 overflow-y-auto">
              {isSearching ? (
                <CommandEmpty>
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Searching...
                    </span>
                  </div>
                </CommandEmpty>
              ) : results.length === 0 ? (
                <CommandEmpty>
                  <div className="flex flex-col items-center justify-center space-y-1 py-6">
                    <p className="text-sm font-medium">No locations found</p>
                    <p className="text-xs text-muted-foreground">
                      Try a different search term
                    </p>
                  </div>
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {results.map((location, index) => {
                    const iconKey = (location.maki || "default").toLowerCase();
                    const IconComponent = iconMap[iconKey] || MapPin;
                    
                    return (
                      <CommandItem
                        key={`${location.name}-${index}`}
                        onSelect={() => handleSelect(location)}
                        value={`${location.name} ${location.place_formatted || ""}`}
                        className="flex items-center py-3 px-3 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <div className="bg-primary/10 p-2 rounded-full shrink-0 flex items-center justify-center">
                            <IconComponent className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-medium truncate">
                              {location.name}
                            </span>
                            {location.place_formatted && location.place_formatted !== location.name && (
                              <span className="text-xs text-muted-foreground truncate">
                                {location.place_formatted}
                              </span>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          )}
        </Command>
      </section>

      {/* Search pulse animation */}
      {searchPulseActive && searchCenter && (
        <SearchPulse
          latitude={searchCenter.lat}
          longitude={searchCenter.lng}
          isActive={searchPulseActive}
        />
      )}
    </>
  );
}