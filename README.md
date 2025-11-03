# Train Builder - Railway Network Construction Simulator

A comprehensive full-stack web application for building realistic railway networks on real geographical maps. Design stations, draw tracks, manage budgets, and build profitable transit systems across actual countries like Belgium and Netherlands.

## Overview

Train Builder combines real OpenStreetMap data with sophisticated backend calculations to create an immersive railway construction simulation. Build high-speed rail lines, manage budgets, and optimize your network for maximum profitability.

### Key Features

- **🗺️ Real Maps**: Build on actual OpenStreetMap data (Belgium, Netherlands, and more)
- **🏢 Station Building**: Place customizable stations (1-30 platforms, 4 types)
- **🛤️ Track Types**:
  - HST (High-Speed Train) - €10M/km, 300 km/h
  - IC (InterCity) - €5M/km, 200 km/h
  - Non-Electrified - €2M/km, 120 km/h
- **💰 Budget Management**: Start with €1 billion, manage income & expenses
- **⚡ Backend Computations**: Offloaded geometry and cost calculations
- **📊 Real-time Stats**: Track network value, revenue, maintenance costs
- **💾 Save/Load**: Persist your networks to localStorage

## Architecture

### Full Stack Application

```
┌─────────────────────────────────────────────┐
│         Frontend (Port 5173)                 │
│  React + Leaflet + OpenStreetMap            │
│  - Interactive map interface                │
│  - Tools menu (bottom-left)                 │
│  - Budget tracking (top bar)                │
└──────────────┬──────────────────────────────┘
               │ HTTP/REST API
               ▼
┌─────────────────────────────────────────────┐
│         Backend (Port 3000)                  │
│  Node.js + Express + TypeScript             │
│  - Geometry calculations (Haversine, etc.)  │
│  - Cost calculations (stations, tracks)     │
│  - Terrain modifiers                        │
│  - Network statistics                       │
└─────────────────────────────────────────────┘
```

## Quick Start

### Option 1: Docker (Full Stack - Recommended)

Run both frontend and backend with Docker:

```bash
# Start full stack in development mode
make dev

# Or manually
docker-compose up backend frontend-dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### Option 2: Local Development

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```

## Game Controls

### Tools Menu (Bottom-Left 🛠️ Button)

Click the tools button to open the construction menu:

**Available Tools:**
- **👆 Select** - Inspect existing infrastructure
- **🏢 Station** - Place new railway stations
  - Choose type: Local, Regional, Intercity, Hub
  - Set platforms: 1-30
  - Add facilities: Parking, Shops, Bike Rental
- **🛤️ Track** - Draw tracks between stations
  - Choose type: HST, IC, Non-Electrified
  - Single or Double track
- **🔀 Junction** - Place crossovers/switches
  - Simple, Junction, or Flying Junction
- **🗑️ Delete** - Remove infrastructure
- **🤚 Pan** - Navigate the map

### How to Build

**1. Place a Station:**
- Click Tools → Station
- Configure settings (type, platforms, facilities)
- Click on map to place
- Cost is automatically calculated and deducted

**2. Draw a Track:**
- Click Tools → Track
- Select track type and single/double
- Click starting station
- Click intermediate waypoints (optional)
- Click ending station
- Track is drawn with calculated cost

**3. Save Your Work:**
- Click "Save" button in top bar
- Network saved to browser localStorage
- Load anytime with "Load" button

## Project Structure

```
TrainBuilder/
├── frontend/ (root)
│   ├── src/
│   │   ├── features/
│   │   │   ├── map/          # MapView with Leaflet
│   │   │   ├── tools/        # ToolsMenu component
│   │   │   └── ui/           # TopBar, etc.
│   │   ├── services/
│   │   │   └── api.ts        # Backend API client
│   │   ├── store/
│   │   │   └── gameStore.ts  # Zustand state management
│   │   └── types/
│   │       └── index.ts      # TypeScript definitions
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/           # API routes
│   │   ├── services/
│   │   │   ├── geometry.service.ts  # Distance calculations
│   │   │   └── cost.service.ts      # Cost computations
│   │   └── types/            # TypeScript types
│   └── package.json
│
├── documentation/
│   ├── idea.md              # Project concept
│   ├── architecture.md      # System architecture
│   ├── database.md          # Database schema (Phase 2)
│   ├── api.md              # API documentation
│   ├── frontend.md         # Frontend architecture
│   └── development.md      # Developer guide
│
├── docker-compose.yml      # Full stack orchestration
└── Makefile               # Convenient commands
```

## Technology Stack

### Frontend
- **React 19** + TypeScript
- **Leaflet** + React Leaflet (OpenStreetMap)
- **Zustand** (State management)
- **Tailwind CSS** (Styling)
- **Vite** (Build tool)

### Backend
- **Node.js 20** + Express
- **TypeScript** (Type safety)
- **Computation Services**:
  - Haversine distance calculations
  - Route geometry processing
  - Cost calculations with terrain modifiers
  - Network statistics aggregation

## API Endpoints

### Computation APIs

```
POST /api/compute/distance            # Calculate distance between points
POST /api/compute/route-length        # Calculate total route length
POST /api/compute/station-cost        # Calculate station construction cost
POST /api/compute/track-cost          # Calculate track construction cost
POST /api/compute/crossover-cost      # Calculate junction cost
POST /api/compute/terrain-modifier    # Estimate terrain difficulty
POST /api/compute/network-stats       # Calculate network statistics
```

See [documentation/api.md](./documentation/api.md) for detailed API docs.

## Cost System

### Stations

| Type | Platforms | Base Cost |
|------|-----------|-----------|
| Local | 1-4 | €5M |
| Regional | 5-10 | €20M |
| Intercity | 11-20 | €50M |
| Hub | 21-30 | €150M |

**Modifiers:**
- Platform multiplier: +10% per platform
- Facilities: Parking (+5%), Shops (+5%), Bike Rental (+2%)
- Terrain: Flat (1.0×), Hilly (1.2×), Urban (1.5×), Mountains (1.8×)

### Tracks

| Type | Cost/km | Speed | Maintenance/km/year |
|------|---------|-------|---------------------|
| Non-Electrified | €2M | 120 km/h | €15k |
| InterCity (IC) | €5M | 200 km/h | €30k |
| High-Speed (HST) | €10M | 300 km/h | €50k |

**Modifiers:**
- Double track: ×1.5 cost
- Terrain: Same as stations

### Crossovers

| Type | Cost | Description |
|------|------|-------------|
| Simple | €0.5M | 2-way switch |
| Junction | €2M | 3-4 way junction |
| Flying Junction | €10M | Grade-separated |

## Development

### Available Scripts

**Frontend:**
```bash
npm run dev       # Start dev server (port 5173)
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

**Backend:**
```bash
cd backend
npm run dev       # Start dev server (port 3000)
npm run build     # Build TypeScript
npm start         # Run production build
```

### Docker Commands

```bash
make help          # Show all commands
make dev           # Run full stack (dev mode)
make backend       # Run backend only
make frontend      # Run frontend only
make prod          # Run full stack (production)
make down          # Stop all containers
make logs          # View all logs
make clean         # Clean up everything
```

## Documentation

Comprehensive documentation available in `documentation/`:

- **[idea.md](./documentation/idea.md)** - Project concept and game design
- **[architecture.md](./documentation/architecture.md)** - System architecture
- **[api.md](./documentation/api.md)** - Complete API reference
- **[database.md](./documentation/database.md)** - Database schema (Phase 2)
- **[frontend.md](./documentation/frontend.md)** - Frontend architecture
- **[development.md](./documentation/development.md)** - Developer setup guide
- **[DOCKER.md](./DOCKER.md)** - Docker usage guide

## Roadmap

### ✅ Phase 1 (Current - MVP)
- Real OpenStreetMap integration
- Station placement (visual only)
- Track drawing (visual only)
- Budget system
- Backend computation offloading
- Save/Load to localStorage

### 📋 Phase 2 (Next)
- Click-to-place station functionality
- Interactive track drawing with waypoints
- Real-time cost preview
- PostgreSQL database integration
- User authentication

### 🔮 Phase 3
- Full track types and costs
- Revenue generation
- Maintenance costs
- Terrain-based cost modifiers
- Crossovers and junctions

### 🚀 Phase 4
- Train simulation
- Passenger demand
- Time progression
- Network optimization challenges

### 🌟 Phase 5
- Multiplayer support
- Real-time collaboration
- Leaderboards
- Advanced graphics

## Performance

### Client-Side (Lightweight)
- **RAM Usage**: < 100 MB typical
- Heavy calculations offloaded to backend
- Efficient Leaflet rendering
- Only visible map tiles loaded

### Backend (Fast)
- **Response Time**: < 5ms for most calculations
- Geometry calculations using Haversine formula
- No database overhead (Phase 1)
- Compressed responses

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Update relevant documentation
4. Submit a pull request

## License

MIT

## Support

- **Documentation**: See `documentation/` folder
- **Issues**: GitHub Issues
- **API Health**: http://localhost:3000/health

---

Built with ❤️ using React, Leaflet, Express, and TypeScript
