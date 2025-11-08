// components/map/poi-debug-panel.tsx
"use client";

import { useMapContext } from "@/context/map-context";

export default function PoiDebugPanel() {
  const { selectedPOI } = useMapContext();

  if (!selectedPOI) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-white/90 shadow-lg p-3 text-xs rounded-lg max-w-xs">
      <div className="font-semibold">{selectedPOI.name}</div>
      <div className="text-slate-600">{selectedPOI.address}</div>
      <div className="text-slate-500">
        {Math.round(selectedPOI.distance)}m away
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {selectedPOI.categories.map((c) => (
          <span
            key={c}
            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
