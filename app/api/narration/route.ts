// app/api/narration/route.ts
// Proxies to the Python backend's GET /api/locations/{id} to fetch narration.
import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = process.env.BACKEND_BASE_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const poiId = searchParams.get("poi_id");
  // 'name' is optional for now; narration comes from backend by ID

  if (!poiId) {
    return NextResponse.json(
      { error: "Missing poi_id" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${BACKEND_BASE}/api/locations/${encodeURIComponent(poiId)}`);
    if (!res.ok) {
      const text = await res.text().catch(() => "<unreadable>");
      console.error(`Backend /api/locations/${poiId} error (${res.status}):`, text);
      return NextResponse.json(
        { error: "Backend error", status: res.status, details: text },
        { status: 502 }
      );
    }

    const data: unknown = await res.json();
    // Expect shape: { id, name, latitude, longitude, ..., narration }
    const narration = (data as { narration?: string | null })?.narration ?? null;

    if (!narration) {
      return NextResponse.json({ narration: "" });
    }

    return NextResponse.json({ narration, poi_id: poiId, source: "backend" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Unhandled error in /api/narration → backend proxy:", message);
    return NextResponse.json(
      { error: "Server error", message },
      { status: 500 }
    );
  }
}

