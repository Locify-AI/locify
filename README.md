# Locify - AI-Native Location-Based Tour Guide

A real-time location-based tour guide application that provides immersive audio storytelling about historical sites and landmarks. Built with Next.js, Mapbox, and AI-powered services.

## Features

- 🗺️ **Interactive Map**: Explore locations with Mapbox GL JS
- 🔍 **Location Search**: Search and navigate to any location worldwide
- 🎨 **Map Styles**: Switch between Standard, Satellite, and Navigation styles
- 📍 **User Location**: Get directions to your current location
- 🔊 **AI Narration**: Real-time location-based storytelling (coming soon)
- 🎭 **AI Avatar**: Interactive talking head avatar (coming soon)
- 🌍 **Multilingual Support**: 100+ language support (coming soon)

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
git clone <your-repo-url>
cd locify/locify
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Required
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# Optional (for future AI features)
NEXT_PUBLIC_FOURSQUARE_API_KEY=your_foursquare_api_key_here
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
NEXT_PUBLIC_DID_API_KEY=your_did_api_key_here
```

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

## Usage

### Map Controls

- **Search**: Use the search bar to find and navigate to locations
- **Zoom**: Use the + and - buttons to zoom in/out
- **Locate**: Click the compass icon to center the map on your location
- **Styles**: Switch between map styles using the style buttons

### Keyboard Shortcuts

- Press `Enter` in the search bar to search for a location

## Development

### Adding New Features

The app is structured to support future AI features:

1. **Location Narration**: Add AI-powered narration when users approach POIs
2. **Avatar Integration**: Integrate D-ID API for talking head avatars
3. **Voice Generation**: Use ElevenLabs for natural voice narration
4. **POI Discovery**: Use Foursquare API to discover nearby points of interest

## Building for Production

```bash
npm run build
npm start
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.