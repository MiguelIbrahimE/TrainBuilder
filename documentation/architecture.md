# Train Builder - System Architecture

## Overview
Train Builder is a full-stack railway construction simulator with a React frontend, Node.js backend, and PostgreSQL database.

## Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Map Rendering**: HTML5 Canvas (Phase 1), potentially Leaflet (Phase 2+)
- **Build Tool**: Vite
- **HTTP Client**: Fetch API / Axios

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express
- **Language**: TypeScript
- **Validation**: Zod
- **Authentication**: JWT (JSON Web Tokens)
- **ORM**: Prisma or raw SQL with pg

### Database
- **RDBMS**: PostgreSQL 15+
- **Extensions**: PostGIS (for spatial data)
- **Migrations**: Prisma Migrate or node-pg-migrate

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Web Server**: Nginx (production)
- **Reverse Proxy**: Nginx

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                         CLIENT                           │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │           React Frontend (Port 5173)              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │   UI     │  │  Canvas  │  │  Zustand │       │  │
│  │  │Components│  │   Map    │  │  Store   │       │  │
│  │  └──────────┘  └──────────┘  └──────────┘       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/REST API
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     API SERVER                           │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Express Backend (Port 3000)                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │   Auth   │  │    API   │  │  Game    │       │  │
│  │  │Middleware│  │  Routes  │  │  Logic   │       │  │
│  │  └──────────┘  └──────────┘  └──────────┘       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ SQL Queries
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      DATABASE                            │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │     PostgreSQL + PostGIS (Port 5432)              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │  Users   │  │ Networks │  │ Stations │       │  │
│  │  │  Table   │  │  Table   │  │  Table   │       │  │
│  │  └──────────┘  └──────────┘  └──────────┘       │  │
│  │  ┌──────────┐  ┌──────────┐                     │  │
│  │  │  Tracks  │  │Crossovers│                     │  │
│  │  │  Table   │  │  Table   │                     │  │
│  │  └──────────┘  └──────────┘                     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
TrainBuilder/
├── frontend/                 # React frontend (current src/)
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── features/        # Feature-based modules
│   │   │   ├── map/        # Map rendering
│   │   │   ├── tools/      # Construction tools
│   │   │   ├── network/    # Network management
│   │   │   └── economy/    # Budget & finances
│   │   ├── services/       # API clients
│   │   ├── store/          # Zustand state
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── public/
│   └── package.json
│
├── backend/                 # Express backend (NEW)
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models
│   │   ├── middleware/     # Auth, validation, etc.
│   │   ├── db/            # Database connection
│   │   └── types/         # TypeScript types
│   ├── prisma/            # Database schema & migrations
│   │   └── schema.prisma
│   ├── tests/
│   └── package.json
│
├── documentation/          # All documentation
│   ├── idea.md            # Project concept
│   ├── architecture.md    # This file
│   ├── api.md            # API documentation
│   ├── database.md       # Database schema
│   └── development.md    # Dev setup guide
│
├── docker-compose.yml     # Full stack orchestration
├── Dockerfile            # Frontend Dockerfile
└── README.md            # Main readme
```

## Data Flow

### User Creates a Station

1. **Frontend**: User clicks map location
2. **Frontend**: Opens station creation modal
3. **Frontend**: User selects platforms (1-30), type, etc.
4. **Frontend**: Calculates cost based on selections
5. **Frontend**: Sends POST request to `/api/stations`
6. **Backend**: Validates request (JWT auth, budget check)
7. **Backend**: Inserts station into database
8. **Backend**: Updates network budget
9. **Backend**: Returns created station with ID
10. **Frontend**: Updates local state
11. **Frontend**: Renders station on map

### User Draws Track

1. **Frontend**: User selects track tool and type (HST/IC/Non-electric)
2. **Frontend**: User clicks start point (station/crossover)
3. **Frontend**: User clicks end point (station/crossover)
4. **Frontend**: Calculates route geometry and distance
5. **Frontend**: Calculates cost (distance × track type rate)
6. **Frontend**: Sends POST request to `/api/tracks`
7. **Backend**: Validates connection points exist
8. **Backend**: Checks budget availability
9. **Backend**: Stores track geometry (PostGIS LineString)
10. **Backend**: Returns created track
11. **Frontend**: Renders track on canvas

## API Communication

### Request Flow
```
Frontend → API Gateway → Route Handler → Service Layer → Database
                ↓                              ↓
            Validation                  Business Logic
            Auth Check                  Data Processing
```

### Response Flow
```
Database → Service Layer → Route Handler → Frontend
              ↓                ↓
        Data Transform    Error Handling
```

## State Management

### Frontend State (Zustand)

**Game State**
- Current network ID
- Budget
- Income/expenses
- Current year/time

**UI State**
- Selected tool
- Active modal
- Map zoom/pan
- Tool settings (brush size, track type)

**Network State**
- Stations array
- Tracks array
- Crossovers array
- Cities data

**Sync Strategy**
- Server as source of truth
- Optimistic UI updates
- Background sync every 30s
- Manual save button

## Security

### Authentication
- JWT tokens stored in httpOnly cookies
- Access token (15 min expiry)
- Refresh token (7 days expiry)

### Authorization
- Users can only access their own networks
- Middleware checks network ownership

### Input Validation
- Zod schemas for all API inputs
- SQL injection prevention via parameterized queries
- XSS prevention via sanitization

## Performance Considerations

### Frontend
- Canvas rendering for map (faster than DOM)
- Throttle map pan/zoom events
- Lazy load station/track details
- Debounce autosave

### Backend
- Database indexes on foreign keys
- Spatial indexes (PostGIS GIST)
- Connection pooling
- Response caching for static data

### Database
- Indexes on frequently queried columns
- EXPLAIN ANALYZE for query optimization
- Regular VACUUM for PostGIS tables

## Deployment Architecture

### Development
```
localhost:5173 → Vite Dev Server
localhost:3000 → Express API
localhost:5432 → PostgreSQL
```

### Production
```
Port 80/443 → Nginx → Frontend (static files)
                  ↓→ Backend (reverse proxy to :3000)
```

## Monitoring & Logging

### Backend Logging
- Request/response logging (Morgan)
- Error logging with stack traces
- Database query logging (development only)

### Frontend Logging
- Console errors in development
- Sentry for production errors (optional)

## Scalability Considerations

### Phase 1 (MVP)
- Single server
- Single database
- No caching layer

### Future Scaling
- Horizontal scaling with load balancer
- Redis for session/cache
- Database read replicas
- CDN for static assets

## Development Workflow

1. Create feature branch
2. Update documentation if needed
3. Implement backend changes
4. Add tests
5. Implement frontend changes
6. Test full flow
7. Update documentation
8. Create PR

## Testing Strategy

### Backend
- Unit tests for services
- Integration tests for API endpoints
- Database tests with test database

### Frontend
- Component tests (React Testing Library)
- E2E tests for critical flows (Playwright)

### Manual Testing
- Docker Compose for full stack testing
- Seed data for consistent test scenarios
