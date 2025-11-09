# Maptourai - AI-Native Location-Based Tour Guide

maptourai is a real-time, AI-powered tour guide web app that transforms your phone into a smart narrator. As you move through a city, Locify automatically identifies nearby landmarks and plays immersive historical stories about them — right from your browser.

Built with Next.js, Mapbox, and FastAPI, it bridges modern web development and AI narration to deliver an intelligent, interactive travel experience.

## Overview
- Frontend: Next.js 16 (TypeScript, TailwindCSS, shadcn/ui, Mapbox)
- Backend: FastAPI (Python) deployed on Render
- Goal: Help tourists explore cities through storytelling — automatically triggered by their location.

## Features

### Core Web App (Frontend)
-  Interactive Map: Smooth Mapbox GL map with dynamic zoom, search, and live location tracking.
-  Search Bar: Quickly locate and navigate to any point on the map.
-  Nearby POIs (Points of Interest): Displays historical landmarks, museums, and attractions near you.
-  Dynamic POI Markers: Animated, aesthetic markers that reveal info on click or when nearby.
-  Bottom Sheet UI: Elegant, mobile-friendly popup showing POI info (name, category, address, distance).
-  User Location Tracking: Automatically centers on your current position and updates in real time.
-  Map Styles: Toggle between Standard, Satellite, and Navigation modes.
-  Favorites: Save interesting landmarks locally for later reference.

### AI Narration (Backend)

-  Location Discovery: FastAPI backend identifies landmarks near your coordinates.
-  Story Generation: AI (via Gemini, OpenAI, or Anthropic) produces 90-second immersive narrations.
-  Caching & Persistence: Locations and narrations are stored in SQLite for faster reloads.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Map Library**: Mapbox GL JS
- **UI Components**: shadcn/ui with Tailwind CSS
- **TypeScript**: Full type safety
- **AI Services** (planned):
  - Google Gemini API for AI narration
  - Foursquare API for POI data
  - ElevenLabs API for voice generation
  - D-ID API for avatar generation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Mapbox account and access token ([Get one here](https://account.mapbox.com/access-tokens/))

### Installation

1. Clone the repository:
```bash
git clone <https://github.com/Locify-AI/locify.git>
cd locify
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
NEXT_PUBLIC_BACKEND_URL=your_backend_url
```

4. Run the development server (locally):
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
locify/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main map page
│   └── globals.css        # Global styles
├── components/
│   ├── map/               # Map-related components
│   ├── poi-bottom-sheet.tsx # Sliding info panel
│   ├── poi-pulse-marker.tsx # Animated POI markers
│   └── ui/                # shadcn/ui components
├── context/
│   └── map-context.ts     # Map context for state management
├── hooks/
│   └── useNearbyPOIs.ts    # Finds nearby points dynamically
├── lib/
│   ├── mapbox/
│   └── mock-pois.ts        # Fallback POI data for testing
└── public/                # Static assets
```

How It Works

- User opens the app → browser requests location permission.
- Mapbox displays the user’s position.
- The app calls the backend (/api/discover-locations) to fetch nearby POIs.
- Markers appear dynamically on the map.
- When user approaches a POI:
    - A bottom sheet appears with details.
    - A voice narration plays


## Building for Production

```bash
npm run build
npm start
```

## License

MIT License © 2025 maptourai Team
## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
