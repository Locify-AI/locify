"use client";

import { useEffect } from "react";
import { MapPin, Heart, X } from "lucide-react";
import { useMapContext, POI } from "@/context/map-context";

function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function PoiBottomSheet() {
  const {
    userLocation,
    pois,
    selectedPOI,
    setSelectedPOI,
    toggleFavorite,
    favorites,
  } = useMapContext();

  // Auto-select nearest POI when close & nothing manually selected
  useEffect(() => {
    if (!userLocation || !pois.length) return;
    if (selectedPOI) return;

    const { latitude, longitude } = userLocation;

    let nearest: { poi: POI; dist: number } | null = null;

    for (const poi of pois) {
      const dist = getDistanceMeters(latitude, longitude, poi.lat, poi.lon);
      if (!nearest || dist < nearest.dist) {
        nearest = { poi, dist };
      }
    }

    const PROXIMITY_THRESHOLD = 80; // meters

    if (nearest && nearest.dist <= PROXIMITY_THRESHOLD) {
      setSelectedPOI(nearest.poi);
    }
  }, [userLocation, pois, selectedPOI, setSelectedPOI]);

  const poi = selectedPOI;
  if (!poi) return null;

  const isFavorite = favorites.some((f: POI) => f.id === poi.id);
  const distanceLabel =
    typeof poi.distance === "number"
      ? `${Math.round(poi.distance)} m away`
      : "";

  const handleClose = () => setSelectedPOI(null);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/15 backdrop-blur-[1px] z-[40]"
        onClick={handleClose}
      />

      {/* Bottom sheet */}
      <div
        className="
          fixed inset-x-0 bottom-0 z-[50]
          max-h-[40vh]
          rounded-t-3xl
          bg-white
          border-t border-slate-200
          shadow-[0_-6px_20px_rgba(15,23,42,0.08)]
          px-5 pt-3 pb-4
          flex flex-col gap-2
          animate-in
          slide-in-from-bottom
          duration-250
        "
      >
        {/* Drag handle */}
        <div className="flex justify-center mb-1">
          <div className="h-1 w-10 rounded-full bg-slate-300" />
        </div>

        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-indigo-500" />
              <h2 className="text-sm font-semibold text-slate-900 line-clamp-2">
                {poi.name}
              </h2>
            </div>

            <div className="flex flex-wrap gap-1 text-[9px] text-slate-500">
              {poi.categories?.[0] && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-indigo-600 font-medium">
                  {poi.categories[0]}
                </span>
              )}
              {distanceLabel && (
                <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">
                  {distanceLabel}
                </span>
              )}
            </div>

            {poi.address && (
              <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-2">
                {poi.address}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => toggleFavorite(poi)}
              className={`
                inline-flex items-center justify-center
                h-7 w-7 rounded-full border
                transition
                ${
                  isFavorite
                    ? "bg-rose-500 text-white border-rose-400"
                    : "bg-white border-slate-200 text-rose-400 hover:bg-rose-50"
                }
              `}
            >
              <Heart
                className={`h-3.5 w-3.5 ${
                  isFavorite ? "fill-current" : ""
                }`}
              />
            </button>
            <button
              onClick={handleClose}
              className="
                inline-flex items-center justify-center
                h-7 w-7 rounded-full
                bg-slate-50 border border-slate-200
                text-slate-500
                hover:bg-slate-100
                transition
              "
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Subtle separator */}
        <div className="h-px w-full bg-slate-100 mt-1" />

        {/* Minimal info block (no narration, no buttons) */}
        <div className="text-[9px] text-slate-500 leading-relaxed">
          Explore this spot with Locify. As you move, we’ll surface the most
          relevant nearby stories right here.
        </div>
      </div>
    </>
  );
}
