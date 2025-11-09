"use client";

import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { useMapContext } from "@/context/map-context";

export default function ClearRouteButton() {
  const { selectedPOI, setSelectedPOI } = useMapContext();

  if (!selectedPOI) return null;

  return (
    <div className="absolute top-24 right-4 z-[1001]">
      <Button
        size="sm"
        variant="secondary"
        className="
          bg-black/80 text-white hover:bg-black
          flex items-center gap-1 px-3 py-1 rounded-md shadow-md
          transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:bg-black/40 focus:ring-offset-2 focus:ring-offset-black
          focus:delay-150   
        "
        onClick={() => setSelectedPOI(null)}
      >
        <XCircle className="h-3 w-3" />
        <span className="text-sm font-medium">Clear</span>
      </Button>
    </div>
  );
}
