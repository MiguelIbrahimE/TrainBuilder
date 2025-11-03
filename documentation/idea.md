# Train Builder - Railway Network Construction Simulator

## Overview
Train Builder is a comprehensive railway network construction and management game where players build realistic train infrastructure across a country map. Players design, construct, and manage a profitable railway network with different track types, stations, and crossovers.

## Core Gameplay

### Construction Phase
Players can build:
- **Railway Stations**: Customizable size (1-30 platforms)
- **Track Types**:
  - HST (High-Speed Train) - Expensive, 300+ km/h
  - IC (InterCity) - Medium cost, 160-200 km/h
  - Non-Electrified - Cheapest, 80-120 km/h
- **Crossovers/Junctions**: Connect multiple track segments
- **Signals & Switches**: Traffic control infrastructure

### Management Phase
- Budget management and construction costs
- Train operations and scheduling
- Revenue from passenger and cargo transport
- Network efficiency optimization
- Maintenance costs

## Game Mechanics

### Economy System
- Starting budget
- Construction costs based on:
  - Track type and length
  - Station size and facilities
  - Terrain difficulty
  - Urban vs rural placement
- Revenue generation:
  - Passenger tickets
  - Cargo transport
  - Station services
- Operating expenses:
  - Track maintenance
  - Staff salaries
  - Energy costs (electrified lines)

### Map & Geography
- Country-scale map with cities and towns
- Terrain affects construction costs (mountains, rivers, urban areas)
- Pre-placed population centers
- Distance-based travel demand

### Tools Menu (Bottom Left)
Opens popup with construction options:

**1. Stations**
- Platform count: 1-30
- Station type: Local, Regional, Intercity, Hub
- Facilities: Parking, shops, connections
- Cost scales with size

**2. Tracks**
- HST: €10M/km - Fast, requires dedicated line
- IC: €5M/km - Standard electrified
- Non-Electrified: €2M/km - Basic, cheaper maintenance
- Double/single track options
- Tunnels and bridges (extra cost)

**3. Infrastructure**
- Crossovers: Track switching
- Signals: Traffic management
- Depots: Train maintenance
- Substations: Power supply (electric lines)

## Technical Architecture

### Frontend
- **Framework**: React + TypeScript
- **Styling**: Tailwind CSS
- **Map Rendering**: Canvas API or Leaflet/MapLibre GL
- **State Management**: Zustand
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js
- **Framework**: Express or Fastify
- **Language**: TypeScript
- **API**: REST or GraphQL

### Database
- **Primary DB**: PostgreSQL (relational data)
  - User accounts
  - Save games
  - Network configurations
  - Financial records
- **Spatial Data**: PostGIS extension
  - Track geometries
  - Station locations
  - Map boundaries
- **Cache**: Redis (optional)
  - Session management
  - Real-time game state

### Data Models

**Networks**
- id, user_id, name, budget, created_at

**Stations**
- id, network_id, name, lat, lon, platforms, type, cost

**Tracks**
- id, network_id, type, geometry (LineString), length, cost, speed_limit

**Crossovers**
- id, network_id, location, connected_tracks[]

**Trains** (future)
- id, network_id, type, capacity, speed, current_location

## UI Layout

```
┌─────────────────────────────────────────────┐
│  Budget: $1.2B  │  Income: +$50M/yr  │ Year: 2024
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│              MAP VIEW                       │
│         (Canvas/Leaflet)                    │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│ [🛠️] Tools  [📊] Stats  [💰] Finances  [⏸️] │
└─────────────────────────────────────────────┘

Tools Popup (when [🛠️] clicked):
┌─────────────────────┐
│ Build               │
├─────────────────────┤
│ 🏢 Stations         │
│ 🛤️  Tracks           │
│ 🔀 Crossovers       │
│ 🚦 Signals          │
└─────────────────────┘
```

## Phased Development

### Phase 1: Foundation (MVP)
- Basic map with canvas rendering
- Station placement (fixed size)
- Single track type
- Simple budget system
- Save/load to localStorage

### Phase 2: Backend Integration
- PostgreSQL database setup
- User authentication
- API for save/load
- Network persistence

### Phase 3: Full Construction
- All track types with pricing
- Variable station sizes
- Crossovers and junctions
- Terrain-based costs

### Phase 4: Operations
- Train scheduling
- Passenger/cargo simulation
- Revenue generation
- Maintenance system

### Phase 5: Polish
- Better graphics
- Sound effects
- Tutorial
- Multiplayer (optional)

## Technology Considerations

### Docker Setup
- Frontend container (Vite dev/Nginx prod)
- Backend container (Node.js)
- PostgreSQL container with PostGIS
- Redis container (optional)
- Docker Compose for orchestration

### API Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/networks/:id
POST   /api/networks
PUT    /api/networks/:id
POST   /api/stations
DELETE /api/stations/:id
POST   /api/tracks
DELETE /api/tracks/:id
GET    /api/maps/cities
```

## Next Steps

1. Decide on map source (real country vs fictional)
2. Choose initial features for MVP
3. Set up backend architecture
4. Design database schema
5. Refactor frontend for new game mechanics
