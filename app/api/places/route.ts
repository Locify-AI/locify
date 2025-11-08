// app/api/places/route.ts
import { NextRequest, NextResponse } from "next/server";

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY || "";
const BASE_URL = "https://api.foursquare.com/v3/places/search";

// You can tweak this list.
const CATEGORIES = [
  "16000", // Landmarks and outdoors
  "13018", // Museums
  "11046", // Historic sites
].join(",");

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const radius = searchParams.get("radius") ?? "1000"; // meters

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  try {
    // Basic numeric validation for lat/lon to avoid malformed queries
    const latNum = Number(lat);
    const lonNum = Number(lon);
    if (Number.isNaN(latNum) || Number.isNaN(lonNum)) {
      return NextResponse.json({ error: "Invalid lat/lon" }, { status: 400 });
    }

    const url = `${BASE_URL}?ll=${latNum},${lonNum}&radius=${radius}&categories=${CATEGORIES}&limit=30&sort=POPULARITY`;

    const res = await fetch(url, {
      headers: {
        Authorization: FOURSQUARE_API_KEY,
        accept: "application/json",
      },
    });

    // If the remote API returns an HTTP error, capture status and body for debugging
    if (!res.ok) {
      let bodyText = "";
      try {
        bodyText = await res.text();
      } catch (e) {
        bodyText = `<failed to read body: ${String(e)}>`;
      }
      console.error(`Foursquare API error (status=${res.status}):`, bodyText);
      return NextResponse.json(
        { error: "Foursquare error", status: res.status, details: bodyText },
        { status: 502 }
      );
    }

    let data: any;
    try {
      data = await res.json();
    } catch (e) {
      console.error("Failed to parse JSON from Foursquare response:", e);
      const text = await res.text().catch(() => "<unreadable>");
      return NextResponse.json(
        { error: "Invalid JSON from Foursquare", details: String(e), body: text },
        { status: 502 }
      );
    }

    // Normalize minimal fields for frontend
    const pois = (data.results || []).map((p: any) => ({
      id: p.fsq_id,
      name: p.name,
      lat: p.geocodes?.main?.latitude,
      lon: p.geocodes?.main?.longitude,
      distance: p.distance,
      categories: (p.categories || []).map((c: any) => c.name),
      address: p.location?.formatted_address,
      icon:
        p.categories?.[0]?.icon
          ? `${p.categories[0].icon.prefix}64${p.categories[0].icon.suffix}`
          : null,
    }));

    return NextResponse.json({ pois });
  } catch (err: any) {
    // Log full error for server-side debugging and return a more descriptive message in dev
    console.error("Unhandled error in /api/places:", err);
    return NextResponse.json({ error: "Server error", message: err?.message || String(err) }, { status: 500 });
  }
}
