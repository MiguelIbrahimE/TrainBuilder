# Database Schema Documentation

## Overview
PostgreSQL database with PostGIS extension for spatial data storage and querying.

## Database Design Principles

1. **Normalization**: 3NF for relational integrity
2. **Spatial Data**: PostGIS for geographic coordinates and geometries
3. **Audit Trail**: Created/updated timestamps on all tables
4. **Soft Deletes**: Keep deleted records with `deleted_at` timestamp
5. **Indexes**: Optimized for common queries

## Entity Relationship Diagram

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────┐
│  networks   │
└──────┬──────┘
       │ 1
       │
       ├─────────────┬──────────────┬──────────────┐
       │ N           │ N            │ N            │ N
┌──────▼──────┐ ┌───▼────────┐ ┌──▼──────────┐ ┌─▼─────────┐
│  stations   │ │   tracks   │ │ crossovers  │ │  trains   │
└─────────────┘ └────────────┘ └─────────────┘ └───────────┘
                      │ N
                      │
                ┌─────▼──────┐
                │track_nodes │ (connection points)
                └────────────┘
```

## Tables

### users
User accounts for the application.

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    username        VARCHAR(50) UNIQUE NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login      TIMESTAMP,
    deleted_at      TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

**Fields:**
- `id`: Primary key, UUID
- `email`: User's email address (unique, for login)
- `password_hash`: Bcrypt hashed password
- `username`: Display name
- `created_at`: Account creation timestamp
- `updated_at`: Last modification timestamp
- `last_login`: Last successful login
- `deleted_at`: Soft delete timestamp

---

### networks
Railway networks (save games) belonging to users.

```sql
CREATE TABLE networks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    budget          BIGINT NOT NULL DEFAULT 1000000000, -- in cents
    income          BIGINT DEFAULT 0,
    expenses        BIGINT DEFAULT 0,
    game_year       INTEGER DEFAULT 2024,
    game_month      INTEGER DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_played     TIMESTAMP,
    deleted_at      TIMESTAMP
);

CREATE INDEX idx_networks_user_id ON networks(user_id);
CREATE INDEX idx_networks_last_played ON networks(last_played DESC);
```

**Fields:**
- `id`: Primary key, UUID
- `user_id`: Foreign key to users table
- `name`: Network name (e.g., "European Rails")
- `budget`: Current available funds (in cents for precision)
- `income`: Monthly/yearly income
- `expenses`: Monthly/yearly expenses
- `game_year`: Current in-game year
- `game_month`: Current in-game month (1-12)
- `last_played`: Last time network was loaded

**Business Rules:**
- Starting budget: €1,000,000,000 (1 billion)
- Budget cannot go negative
- Max 10 networks per user (enforced in backend)

---

### stations
Railway stations on the network.

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE stations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network_id      UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    location        GEOMETRY(POINT, 4326) NOT NULL, -- lat/lon
    platforms       INTEGER NOT NULL CHECK (platforms >= 1 AND platforms <= 30),
    station_type    VARCHAR(20) NOT NULL CHECK (station_type IN ('local', 'regional', 'intercity', 'hub')),
    cost            BIGINT NOT NULL, -- construction cost in cents
    facilities      JSONB DEFAULT '{}', -- parking, shops, etc.
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

CREATE INDEX idx_stations_network_id ON stations(network_id);
CREATE INDEX idx_stations_location ON stations USING GIST(location);
CREATE INDEX idx_stations_type ON stations(station_type);
```

**Fields:**
- `id`: Primary key, UUID
- `network_id`: Foreign key to networks table
- `name`: Station name (e.g., "Amsterdam Centraal")
- `location`: PostGIS Point geometry (longitude, latitude)
- `platforms`: Number of platforms (1-30)
- `station_type`: Enum: local, regional, intercity, hub
- `cost`: Construction cost paid
- `facilities`: JSON object with additional features

**Station Types & Base Costs:**
- **Local**: 1-4 platforms, €5M base
- **Regional**: 5-10 platforms, €20M base
- **Intercity**: 11-20 platforms, €50M base
- **Hub**: 21-30 platforms, €150M base

**Cost Formula:**
```
Total Cost = Base Cost × (1 + platforms/10) × terrain_modifier
```

---

### tracks
Railway track segments connecting stations/crossovers.

```sql
CREATE TABLE tracks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network_id      UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    track_type      VARCHAR(20) NOT NULL CHECK (track_type IN ('hst', 'ic', 'non_electrified')),
    geometry        GEOMETRY(LINESTRING, 4326) NOT NULL, -- route geometry
    length_km       NUMERIC(10, 2) NOT NULL, -- calculated length
    speed_limit     INTEGER NOT NULL, -- km/h
    is_double_track BOOLEAN DEFAULT FALSE,
    cost            BIGINT NOT NULL, -- construction cost
    maintenance_cost BIGINT NOT NULL, -- annual cost
    from_node_id    UUID NOT NULL, -- station or crossover
    to_node_id      UUID NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

CREATE INDEX idx_tracks_network_id ON tracks(network_id);
CREATE INDEX idx_tracks_geometry ON tracks USING GIST(geometry);
CREATE INDEX idx_tracks_from_node ON tracks(from_node_id);
CREATE INDEX idx_tracks_to_node ON tracks(to_node_id);
```

**Fields:**
- `id`: Primary key, UUID
- `network_id`: Foreign key to networks table
- `track_type`: Enum: hst, ic, non_electrified
- `geometry`: PostGIS LineString (route path)
- `length_km`: Length in kilometers (auto-calculated from geometry)
- `speed_limit`: Maximum speed (km/h)
- `is_double_track`: Single or double track (affects capacity)
- `cost`: Construction cost paid
- `maintenance_cost`: Yearly maintenance cost
- `from_node_id`: Starting station/crossover UUID
- `to_node_id`: Ending station/crossover UUID

**Track Types:**

| Type            | Cost/km  | Speed Limit | Maintenance/km/year |
|-----------------|----------|-------------|---------------------|
| HST             | €10M     | 300 km/h    | €50k                |
| IC              | €5M      | 200 km/h    | €30k                |
| Non-Electrified | €2M      | 120 km/h    | €15k                |

**Business Rules:**
- Double track costs 1.5× single track
- Tunnels/bridges add 2-5× multiplier
- Minimum track length: 0.5 km
- Maximum grade: 3.5% (HST), 5% (IC/Non-electric)

---

### crossovers
Track junctions and switches.

```sql
CREATE TABLE crossovers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network_id      UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    name            VARCHAR(100),
    location        GEOMETRY(POINT, 4326) NOT NULL,
    crossover_type  VARCHAR(20) NOT NULL CHECK (crossover_type IN ('simple', 'junction', 'flying_junction')),
    cost            BIGINT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

CREATE INDEX idx_crossovers_network_id ON crossovers(network_id);
CREATE INDEX idx_crossovers_location ON crossovers USING GIST(location);
```

**Fields:**
- `id`: Primary key, UUID
- `network_id`: Foreign key to networks table
- `name`: Optional junction name
- `location`: PostGIS Point geometry
- `crossover_type`: simple (2-way), junction (3-4 way), flying_junction (grade-separated)
- `cost`: Construction cost

**Crossover Types & Costs:**
- **Simple**: €500k (2 tracks)
- **Junction**: €2M (3-4 tracks)
- **Flying Junction**: €10M (grade-separated, no conflicts)

---

### trains (Phase 4 - Future)
Train units operating on the network.

```sql
CREATE TABLE trains (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network_id      UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    train_type      VARCHAR(20) NOT NULL CHECK (train_type IN ('hst', 'intercity', 'regional', 'local', 'freight')),
    capacity        INTEGER NOT NULL, -- passengers or tons
    max_speed       INTEGER NOT NULL, -- km/h
    current_location GEOMETRY(POINT, 4326),
    current_track_id UUID REFERENCES tracks(id),
    status          VARCHAR(20) DEFAULT 'idle', -- idle, moving, stopped
    purchase_cost   BIGINT NOT NULL,
    operating_cost  BIGINT NOT NULL, -- per km
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

CREATE INDEX idx_trains_network_id ON trains(network_id);
CREATE INDEX idx_trains_location ON trains USING GIST(current_location);
```

---

### cities (Reference Data - Pre-seeded)
Cities and towns for map generation.

```sql
CREATE TABLE cities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    country         VARCHAR(50) NOT NULL,
    location        GEOMETRY(POINT, 4326) NOT NULL,
    population      INTEGER NOT NULL,
    city_type       VARCHAR(20) NOT NULL CHECK (city_type IN ('capital', 'major', 'city', 'town', 'village')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cities_location ON cities USING GIST(location);
CREATE INDEX idx_cities_country ON cities(country);
CREATE INDEX idx_cities_population ON cities(population DESC);
```

**Purpose:**
- Read-only reference data
- Used for map rendering
- Determines travel demand

---

## Spatial Queries

### Find Stations Near Point
```sql
SELECT id, name, ST_Distance(location, ST_SetSRID(ST_MakePoint(4.9041, 52.3676), 4326)) as distance_meters
FROM stations
WHERE network_id = $1
  AND ST_DWithin(location, ST_SetSRID(ST_MakePoint(4.9041, 52.3676), 4326), 50000) -- 50km radius
ORDER BY distance_meters;
```

### Calculate Track Length
```sql
SELECT id, ST_Length(geometry::geography) / 1000 as length_km
FROM tracks
WHERE network_id = $1;
```

### Find Connected Tracks
```sql
SELECT t1.id, t1.track_type
FROM tracks t1
WHERE (t1.from_node_id = $1 OR t1.to_node_id = $1)
  AND t1.network_id = $2;
```

## Indexes Strategy

### B-Tree Indexes
- Foreign keys (user_id, network_id)
- Lookup columns (email, username)
- Enums with limited cardinality (track_type, station_type)

### GIST Indexes (Spatial)
- All geometry columns
- Enables fast spatial queries
- Used by PostGIS operators (ST_DWithin, ST_Intersects)

## Database Migrations

Using **Prisma Migrate** or **node-pg-migrate**:

```bash
# Create new migration
npm run migrate:create add_stations_table

# Run pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down
```

## Backup Strategy

### Development
- Docker volume backups
- SQL dumps before major changes

### Production (Future)
- Automated daily backups
- Point-in-time recovery
- Backup retention: 30 days

## Performance Optimization

### Query Optimization
- Use EXPLAIN ANALYZE for slow queries
- Add indexes based on query patterns
- Avoid N+1 queries (use JOINs or batch queries)

### Connection Pooling
```javascript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Vacuum Schedule
```sql
-- Auto-vacuum enabled for all tables
-- Manual vacuum for geometry tables weekly
VACUUM ANALYZE tracks;
VACUUM ANALYZE stations;
```

## Data Integrity

### Constraints
- Foreign keys with CASCADE delete
- CHECK constraints for enums
- NOT NULL for required fields
- UNIQUE constraints for natural keys

### Transactions
- Wrap multi-table operations in transactions
- Use isolation level READ COMMITTED
- Handle deadlocks with retries

## Seed Data

Development seed includes:
- Test user account
- Sample network
- 50+ European cities
- Example stations and tracks

```bash
npm run db:seed
```
