# Locify(maptourai) - AI-Native Location-Based Tour Guide

Our app is live on vercel: [maptourai](https://maptourai-git-feat-avatar-muhammad-shahzaib-hassans-projects.vercel.app)

This project was initially developed under the name **Locify** and is now referred to as **maptourai**. File paths and source code may still use `locify`; both names describe the same application. maptourai provides real-time, proximity-based historical storytelling layered onto an interactive map.

Developers Discord Handle: @wwsoup, @nursultansagyntay, @shahzaib4248, and @hailemariam_16209

## Core Features

- Interactive map with Mapbox GL JS (standard, satellite, navigation styles)
- Global location search and map recentering
- Live user location tracking (custom arrow marker with accuracy visualization)
- Points of Interest (POIs) fetched once per session and cached client-side
- Proximity detection (e.g., within 50m) triggering narration display
- AI narration pipeline (backend: discovery + narration generation) ready for text-to-speech
- Planned extensions: avatar narration, multilingual output, voice synthesis, offline caching

## Tech Stack Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend Framework | Next.js 16 (App Router, React Server Components) | High-performance UI, routing, edge readiness |
| Mapping | Mapbox GL JS | Vector map rendering, custom markers, camera control |
| Styling/UI | Tailwind CSS, shadcn/ui | Design system + accessible components |
| State / Context | Custom React context (`map-context.tsx`) | Shared map, user location, POIs, narration state |
| Geolocation & Orientation | Browser Geolocation + DeviceOrientation APIs | Live position + heading for user arrow |
| Backend (separate repo) | FastAPI (Uvicorn), SQLite, SQLAlchemy | POI discovery + narration generation APIs |
| MCP / Agents | Dedalus Labs (AsyncDedalus, agent runner) | Orchestrated multi-step discovery + research |
| Data Sources | Foursquare (via MCP), Brave Search (via MCP) | Location metadata + historical context |
| LLM Models | OpenAI GPT-4.1, Anthropic Claude Sonnet | Structured extraction + narrative generation |
|Additional Integrations | ElevenLabs, D-ID, Gemini | Voice synthesis, talking avatar, alternative narration models |

The backend (deployed separately) exposes endpoint of interest (POI)nts consumed by the Next.js API routes (`/api/places` and `/api/narration`). Those proxy calls allow environment isolation and optional server-side caching.

## Getting Started (Frontend)

### Prerequisites

- Node.js 18+ and npm
- Mapbox account and access token ([Get one here](https://account.mapbox.com/access-tokens/))

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd locify/locify
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the `locify/` directory:
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables (Frontend)

Create `locify/.env.local` with at least:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# Optional / planned
BACKEND_BASE_URL=https://locify-backend.onrender.com
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
NEXT_PUBLIC_DID_API_KEY=your_did_api_key_here
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

The frontend does not directly embed secret model keys for OpenAI/Anthropic; those remain backend-side.

## Project Structure

```
locify/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main map page
│   └── globals.css        # Global styles
├── components/
│   ├── map/               # Map-related components
│   │   ├── map-controls.tsx
│   │   ├── map-search.tsx
│   │   └── map-styles.tsx
│   └── ui/                # shadcn/ui components
├── context/
│   └── map-context.ts     # Map context for state management
├── lib/
│   ├── mapbox/
│   │   └── provider.tsx   # Map provider component
│   └── utils.ts           # Utility functions
└── public/                # Static assets
```

## Usage & Interaction Model

### Map Controls
| Control | Description |
|---------|-------------|
| Search bar | Geocodes user input and recenters the map |
| Zoom buttons | Incremental zoom adjustment |
| Compass / locate | Starts geolocation tracking; centers map on user; enables heading rotation marker |
| Style toggles | Switches base map style (standard, satellite, navigation) |

### Marker Semantics
| Marker | Meaning |
|--------|---------|
| White arrow with translucent blue circle | User position + heading + approximate accuracy |
| Red pulsing circle | Point of interest (historical / cultural site) |

### Data Flow (High Level)
1. User initiates tracking (or first location fix occurs).
2. Frontend calls `/api/places` (Next.js route) once → proxies to backend discovery → caches POIs in React context.
3. User movement updates distance calculations client-side (no extra discovery requests).
4. When distance < threshold (e.g., 50m), narration overlay fetches or reuses location narration.
5. (Planned) Narration text is transformed to synthesized voice and/or avatar performance.

### Performance Considerations
- Single discovery request per session (or per new city region) limits external API usage.
- Distance calculations use haversine formula on the client (fast for small arrays of POIs).
- Narration fetches are cached per POI to avoid repeated network calls.

## Development Notes

### Adding / Extending Features
| Feature | Files / Areas to Modify | Notes |
|---------|-------------------------|-------|
| New map control | `components/map/map-controls.tsx` | Keep consistent keyboard accessibility |
| Additional POI attributes | Backend models + `/api/places` normalizer + `useNearbyPOIs.ts` | Ensure type updates propagate to context |
| Alternate narration trigger radius | `components/map/poi-narration.tsx` | Adjust threshold constant; consider user setting |
| Avatar integration | New component (e.g., `components/avatar/`) + narration pipeline | Will subscribe to active narration context state |
| Voice synthesis | Add API route bridging to ElevenLabs or TTS provider | Stream audio for low latency |
| Offline caching | Service Worker + IndexedDB for POIs + narrations | Must handle version invalidation |

### Code Quality
- TypeScript strictness enforced in hooks and API routes.
- Context provides a single source of truth for POIs and narration state.
- Avoid expensive re-renders: POIs stored once; distances derived.

## Building for Production

```bash
npm run build
npm start
```

## License

MIT

## Contributing

Pull requests are welcome. Please include:
- Clear description of change and rationale
- Tests or manual verification steps (where practical)
- Updates to README if you alter public behavior

## License

MIT

## Naming Note

The codebase root and many imports use `locify`. The official product name going forward is `maptourai`. Both refer to the same system; future refactors may consolidate naming for clarity.
