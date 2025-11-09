"use client";

import { useEffect } from "react";
import mapboxgl, { LngLatLike } from "mapbox-gl";
import { useMapContext } from "@/context/map-context";

export default function RouteLayer() {
  const { map, userLocation, selectedPOI } = useMapContext();

  useEffect(() => {
  if (!map) return;

  // 🧹 When there's no selectedPOI, remove any existing route layers/sources
  if (!selectedPOI) {
    if (map.getLayer("route-line")) map.removeLayer("route-line");
    if (map.getLayer("route-arrows")) map.removeLayer("route-arrows");
    if (map.getSource("route")) map.removeSource("route");
    return;
  }

  if (!userLocation) return;

  const drawRoute = async () => {
    const start: [number, number] = [
      userLocation.longitude,
      userLocation.latitude,
    ];
    const end: [number, number] = [selectedPOI.lon, selectedPOI.lat];

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.join(
      ","
    )};${end.join(",")}?geometries=geojson&overview=full&access_token=${
      mapboxgl.accessToken
    }`;

    const res = await fetch(url);
    const data = await res.json();
    if (!data.routes || !data.routes[0]) return;

    const route = data.routes[0].geometry as GeoJSON.LineString;

    // Remove any old route layers/sources
    if (map.getLayer("route-line")) map.removeLayer("route-line");
    if (map.getLayer("route-arrows")) map.removeLayer("route-arrows");
    if (map.getSource("route")) map.removeSource("route");

    map.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: route,
        properties: {},
      },
    });

    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#2563eb",
        "line-width": 6,
        "line-opacity": 0.9,
      },
    });

    map.addLayer({
      id: "route-arrows",
      type: "symbol",
      source: "route",
      layout: {
        "symbol-placement": "line",
        "text-size": 24,
        "symbol-spacing": 40,
        "text-keep-upright": false,
      },
      paint: {
        "text-color": "#2563eb",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
    });

    const bounds = new mapboxgl.LngLatBounds();
    route.coordinates.forEach((coord) => bounds.extend(coord as LngLatLike));
    map.fitBounds(bounds, { padding: 80 });
  };

  drawRoute();
}, [map, userLocation, selectedPOI]);

  return null;
}
