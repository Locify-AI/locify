"use client";

import { useMapContext } from "@/context/map-context";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, X, Scan } from "lucide-react";
import { useState, useEffect } from "react";
import React from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { iconMap, LocationSuggestion } from "@/lib/mapbox/utils";

export default function MapSearch() {
  const { map, scanForPOIs, isScanning, userLocation, startTracking } = useMapContext();
  const [query, setQuery] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [results, setResults] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
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

  // Center map on user location (same logic as locate button)
  const centerOnUser = () => {
    if (!map) return;

    if (userLocation) {
      map.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 15,
        duration: 1500,
      });
    } else {
      startTracking();

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.flyTo({
              center: [longitude, latitude],
              zoom: 15,
              duration: 1500,
            });
          },
          (error) => {
            console.error("Error getting location:", error);
            alert(
              "Unable to get your location. Please enable location services."
            );
          }
        );
      }
    }
  };

  // Handle scan button click - center on user and scan for POIs
  const handleScan = async () => {
    centerOnUser();
    await scanForPOIs();
  };

  if (!map) return null;

  return (
    <>
      <section className="absolute top-4 left-1/2 sm:left-4 z-[1001] w-[90vw] sm:w-[500px] -translate-x-1/2 sm:translate-x-0 flex gap-2">
        <Command className="rounded-lg border bg-background/95 backdrop-blur-sm shadow-lg flex-1">
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
        <Button
          variant="outline"
          onClick={handleScan}
          disabled={isScanning}
          className="h-[42px] px-4 bg-background/95 backdrop-blur-sm shadow-lg border flex items-center gap-2"
          title="Scan for nearby places"
        >
          {isScanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <Scan className="h-4 w-4" />
              <span>Scan</span>
            </>
          )}
        </Button>
      </section>
    </>
  );
}