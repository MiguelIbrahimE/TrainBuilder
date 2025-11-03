# Train Builder

A web-based transit network planning game where you design and build comprehensive train networks to optimize public transportation.

## Game Overview

Build train networks that convert car drivers (red) into train riders (blue). The game simulates how transit infrastructure affects commuter behavior based on population density and work availability.

### Features

- **Interactive Canvas**: Paint train tracks with adjustable brush sizes
- **Real-time Simulation**: See how your network affects transit mode shares
- **Multiple Visualizations**:
  - Transit mode view (default)
  - Population density overlay
  - Work zones overlay
- **Statistics Dashboard**: Track mode shares, population, and your transit score
- **Smart Simulation**: Tracks influence nearby cells based on distance and population

### Color Legend

- **Red**: Car drivers
- **Green**: Walkers
- **Blue**: Train riders
- **Purple**: Cyclists

**Goal**: Maximize blue (transit) and minimize red (cars) for the highest score!

## Quick Start

### Option 1: Docker (Recommended)

Run with Docker for the easiest setup:

```bash
# Development mode with hot-reloading
make dev
# or
docker-compose up dev
```

Open http://localhost:5173

For production:
```bash
make prod
# or
docker-compose up prod
```

Open http://localhost:8080

See [DOCKER.md](./DOCKER.md) for detailed Docker instructions.

### Option 2: Local Development

Requirements:
- Node.js 20+
- npm

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173

## Building for Production

```bash
# Build the app
npm run build

# Preview production build
npm run preview
```

## Development

### Project Structure

```
train-builder/
├── src/
│   ├── components/      # React components
│   │   ├── MapCanvas.tsx    # Main game canvas
│   │   ├── Toolbar.tsx      # Tool selection
│   │   ├── Legend.tsx       # Color legend
│   │   └── Statistics.tsx   # Stats panel
│   ├── lib/            # Utilities
│   │   ├── colors.ts        # Color blending
│   │   └── simulation.ts    # Transit simulation
│   ├── state/          # State management
│   │   └── store.ts         # Zustand store
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
└── documentation/      # Project docs
```

### Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Canvas**: HTML5 Canvas API

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Docker Commands (with Makefile)

```bash
make help        # Show all commands
make dev         # Run development server
make prod        # Run production server
make down        # Stop containers
make logs        # View logs
make clean       # Clean up containers
make rebuild     # Rebuild from scratch
```

## Game Controls

### Tools

- **Track**: Paint train tracks (click and drag)
- **Erase**: Remove tracks
- **Pan**: Navigate the map
- **Brush Size**: Adjust paint area (1-5 cells)

### View Modes

- **Transit**: Shows mode share blend
- **Population**: Shows population density
- **Work**: Shows job availability zones

## How to Play

1. Start with the **Track tool** selected
2. Paint train tracks near populated areas (brighter colors = more people)
3. Watch the colors change from red to blue near your tracks
4. Check the **Statistics panel** to track your progress
5. Switch to **Population** or **Work** views to plan strategically
6. Aim for the highest **Transit Score**!

### Tips

- Build tracks near high population areas for maximum impact
- Connect residential areas to work zones
- Tracks influence a 6-cell radius
- The transit score rewards train usage and penalizes car dependency

## License

MIT

## Contributing

Contributions welcome! Feel free to open issues or submit pull requests.
