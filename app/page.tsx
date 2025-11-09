"use client";

import { useRef } from "react";

import MapProvider from "@/lib/mapbox/provider";
import MapStyles from "@/components/map/map-styles";
import MapControls from "@/components/map/map-controls";
import MapSearch from "@/components/map/map-search";
import UserLocationMarker from "@/components/map/user-location-marker";
import PoiMarkers from "@/components/map/PoiMarkers";
import PoiDebugPanel from "@/components/map/poi-debug-panel";
import PoiNarration from "@/components/map/poi-narration";
import PoiBottomSheet from "@/components/map/poi-bottom-sheet";

export default function Home() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="w-screen h-screen">
      {/* Map container */}
      <div
        id="map-container"
        ref={mapContainerRef}
        className="absolute inset-0 h-full w-full"
      />

      {/* Mapbox + Locify UI */}
      <MapProvider
        mapContainerRef={mapContainerRef}
        initialViewState={{
          longitude: -74.6551,
          latitude: 40.3431,
          zoom: 15,
        }}
      >
        <MapSearch />
        <MapControls />
        <MapStyles />
        <UserLocationMarker />
        <PoiMarkers />
        <PoiNarration />

        <PoiBottomSheet />
    </div>
  );
}
