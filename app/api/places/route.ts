// app/api/places/route.ts
// Proxies to the Python backend's POST /api/discover-locations endpoint
// and normalizes the response for the frontend.
import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = process.env.BACKEND_BASE_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const radius = Number(searchParams.get("radius") ?? "1000"); // meters

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (Number.isNaN(latNum) || Number.isNaN(lonNum)) {
    return NextResponse.json({ error: "Invalid lat/lon" }, { status: 400 });
  }

  try {
    // Call backend discovery (includes narrations)
    const res = await fetch(`${BACKEND_BASE}/api/discover-locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: latNum, longitude: lonNum, radius }),
      // Server-to-server call; no CORS issues expected
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "<unreadable>");
      console.error(`Backend /api/discover-locations error (${res.status}):`, text);
      return NextResponse.json(
        { error: "Backend error", status: res.status, details: text },
        { status: 502 }
      );
    }

    const data: unknown = await res.json();
    type BackendLocation = {
      id: number | string;
      name: string;
      latitude: number;
      longitude: number;
      category?: string | null;
      narration?: string | null;
      address?: string | null;
      audio_url?: string | null;
    };
    const isBackendLocationArray = (v: unknown): v is BackendLocation[] => {
      if (!Array.isArray(v)) return false;
      return v.every((item) =>
        item && typeof item === "object" &&
        ("id" in item) && ("name" in item) &&
        ("latitude" in item) && ("longitude" in item)
      );
    };

    const locations: BackendLocation[] =
      typeof data === "object" && data !== null && isBackendLocationArray((data as { locations?: unknown }).locations)
        ? ((data as { locations: BackendLocation[] }).locations)
        : [];

    // Normalize to POI shape expected by the frontend
    const pois = locations.map((loc) => ({
      id: String(loc.id),
      name: loc.name,
      lat: loc.latitude,
      lon: loc.longitude,
      distance: 0, // distance is computed client-side relative to user
      categories: loc.category ? [loc.category] : [],
      address: loc.address ?? undefined,
      icon: null as string | null,
      narration: loc.narration as string | undefined,
      audio_url: loc.audio_url as string | undefined,
    }));

    return NextResponse.json({ pois });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Unhandled error in /api/places → backend proxy:", message);
    return NextResponse.json(
      { error: "Server error", message },
      { status: 500 }
    );
  }
}
