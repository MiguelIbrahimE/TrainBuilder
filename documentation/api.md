# API Documentation

## Base URL
```
Development: http://localhost:3000/api
Production: https://trainbuilder.com/api
```

## Authentication

### JWT Token Authentication
All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are obtained through `/api/auth/login` endpoint.

---

## Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "trainmaster",
  "password": "securePassword123"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "trainmaster"
  },
  "token": "jwt_token_here"
}
```

**Errors:**
- `400` - Validation error (email invalid, password too weak)
- `409` - Email or username already exists

---

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "trainmaster"
  },
  "token": "jwt_token_here"
}
```

**Errors:**
- `400` - Missing credentials
- `401` - Invalid credentials

---

#### Get Current User
```http
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "trainmaster",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### Networks

#### List User's Networks
```http
GET /api/networks
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "networks": [
    {
      "id": "uuid",
      "name": "European Rails",
      "budget": 1000000000,
      "income": 50000000,
      "expenses": 20000000,
      "game_year": 2024,
      "game_month": 6,
      "last_played": "2024-01-15T14:30:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### Get Network Details
```http
GET /api/networks/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "European Rails",
  "budget": 1000000000,
  "income": 50000000,
  "expenses": 20000000,
  "game_year": 2024,
  "game_month": 6,
  "stations": [
    {
      "id": "uuid",
      "name": "Amsterdam Centraal",
      "location": { "lat": 52.3791, "lon": 4.9003 },
      "platforms": 15,
      "station_type": "hub",
      "cost": 150000000
    }
  ],
  "tracks": [
    {
      "id": "uuid",
      "track_type": "hst",
      "length_km": 120.5,
      "speed_limit": 300,
      "is_double_track": true,
      "from_node_id": "station_uuid_1",
      "to_node_id": "station_uuid_2",
      "cost": 1205000000
    }
  ],
  "crossovers": []
}
```

**Errors:**
- `404` - Network not found
- `403` - Network belongs to different user

---

#### Create Network
```http
POST /api/networks
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "My Railway Empire"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "My Railway Empire",
  "budget": 1000000000,
  "income": 0,
  "expenses": 0,
  "game_year": 2024,
  "game_month": 1,
  "created_at": "2024-01-15T14:30:00Z"
}
```

**Errors:**
- `400` - Validation error (name required, max length 100)
- `403` - User has reached max networks limit (10)

---

#### Update Network
```http
PUT /api/networks/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "European Rails Updated",
  "budget": 950000000
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "European Rails Updated",
  "budget": 950000000,
  "updated_at": "2024-01-15T15:00:00Z"
}
```

---

#### Delete Network
```http
DELETE /api/networks/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `204 No Content`

**Errors:**
- `404` - Network not found
- `403` - Network belongs to different user

---

### Stations

#### Create Station
```http
POST /api/stations
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "network_id": "uuid",
  "name": "Rotterdam Centraal",
  "location": {
    "lat": 51.9225,
    "lon": 4.4692
  },
  "platforms": 12,
  "station_type": "intercity",
  "facilities": {
    "parking": true,
    "shops": true,
    "bike_rental": false
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "network_id": "uuid",
  "name": "Rotterdam Centraal",
  "location": { "lat": 51.9225, "lon": 4.4692 },
  "platforms": 12,
  "station_type": "intercity",
  "cost": 60000000,
  "facilities": {
    "parking": true,
    "shops": true,
    "bike_rental": false
  },
  "created_at": "2024-01-15T14:30:00Z"
}
```

**Cost Calculation:**
- Base cost for intercity (11-20 platforms): €50M
- Platform multiplier: 12/10 = 1.2
- Facilities: +5% for parking, +5% for shops
- Total: €50M × 1.2 × 1.10 = €66M

**Errors:**
- `400` - Validation error (platforms out of range, invalid coordinates)
- `403` - Insufficient budget
- `404` - Network not found

---

#### List Stations
```http
GET /api/networks/:networkId/stations
```

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `station_type` (optional): Filter by type (local, regional, intercity, hub)
- `limit` (optional): Max results (default: 100)
- `offset` (optional): Pagination offset

**Response:** `200 OK`
```json
{
  "stations": [
    {
      "id": "uuid",
      "name": "Amsterdam Centraal",
      "location": { "lat": 52.3791, "lon": 4.9003 },
      "platforms": 15,
      "station_type": "hub",
      "cost": 150000000
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

---

#### Get Station
```http
GET /api/stations/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Amsterdam Centraal",
  "location": { "lat": 52.3791, "lon": 4.9003 },
  "platforms": 15,
  "station_type": "hub",
  "cost": 150000000,
  "facilities": {
    "parking": true,
    "shops": true,
    "bike_rental": true
  },
  "connected_tracks": [
    {
      "track_id": "uuid",
      "destination_station": "Rotterdam Centraal",
      "track_type": "hst"
    }
  ]
}
```

---

#### Delete Station
```http
DELETE /api/stations/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `204 No Content`

**Notes:**
- Soft delete (sets `deleted_at` timestamp)
- Connected tracks are also deleted
- Budget is NOT refunded

**Errors:**
- `404` - Station not found
- `403` - Station belongs to different network

---

### Tracks

#### Create Track
```http
POST /api/tracks
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "network_id": "uuid",
  "track_type": "hst",
  "from_node_id": "station_uuid_1",
  "to_node_id": "station_uuid_2",
  "is_double_track": true,
  "waypoints": [
    { "lat": 52.3791, "lon": 4.9003 },
    { "lat": 52.0907, "lon": 5.1214 },
    { "lat": 51.9225, "lon": 4.4692 }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "network_id": "uuid",
  "track_type": "hst",
  "length_km": 78.5,
  "speed_limit": 300,
  "is_double_track": true,
  "cost": 1177500000,
  "maintenance_cost": 3925000,
  "from_node_id": "station_uuid_1",
  "to_node_id": "station_uuid_2",
  "created_at": "2024-01-15T14:30:00Z"
}
```

**Cost Calculation:**
- Track type: HST = €10M/km
- Length: 78.5 km
- Double track multiplier: 1.5x
- Total: €10M × 78.5 × 1.5 = €1,177.5M

**Errors:**
- `400` - Invalid nodes, track too short/long
- `403` - Insufficient budget
- `409` - Track already exists between nodes

---

#### List Tracks
```http
GET /api/networks/:networkId/tracks
```

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `track_type` (optional): Filter by type (hst, ic, non_electrified)
- `from_node_id` (optional): Filter by starting node
- `to_node_id` (optional): Filter by ending node

**Response:** `200 OK`
```json
{
  "tracks": [
    {
      "id": "uuid",
      "track_type": "hst",
      "length_km": 78.5,
      "speed_limit": 300,
      "is_double_track": true,
      "from_node_id": "station_uuid_1",
      "to_node_id": "station_uuid_2",
      "cost": 1177500000
    }
  ],
  "total": 1
}
```

---

#### Delete Track
```http
DELETE /api/tracks/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `204 No Content`

**Notes:**
- Soft delete
- No budget refund
- Check for orphaned stations (warning only)

---

### Crossovers

#### Create Crossover
```http
POST /api/crossovers
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "network_id": "uuid",
  "name": "Utrecht Junction",
  "location": { "lat": 52.0907, "lon": 5.1214 },
  "crossover_type": "junction"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "network_id": "uuid",
  "name": "Utrecht Junction",
  "location": { "lat": 52.0907, "lon": 5.1214 },
  "crossover_type": "junction",
  "cost": 2000000,
  "created_at": "2024-01-15T14:30:00Z"
}
```

---

### Cities (Reference Data)

#### Get Cities
```http
GET /api/cities
```

**Query Parameters:**
- `country` (optional): Filter by country code (NL, BE, DE, etc.)
- `min_population` (optional): Minimum population
- `bbox` (optional): Bounding box (lat1,lon1,lat2,lon2)

**Response:** `200 OK`
```json
{
  "cities": [
    {
      "id": "uuid",
      "name": "Amsterdam",
      "country": "NL",
      "location": { "lat": 52.3676, "lon": 4.9041 },
      "population": 872680,
      "city_type": "capital"
    }
  ],
  "total": 1
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "INSUFFICIENT_BUDGET",
    "message": "Not enough budget to complete this action",
    "details": {
      "required": 100000000,
      "available": 50000000
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `INSUFFICIENT_BUDGET` | 403 | Not enough funds |
| `MAX_NETWORKS_REACHED` | 403 | User has max networks |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **Other endpoints**: 100 requests per minute per user
- Headers include rate limit info:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1634567890
  ```

---

## Websockets (Future - Phase 4)

Real-time updates for multiplayer or live train simulation.

```
ws://localhost:3000/ws?token=<jwt>
```

**Events:**
- `train:moved` - Train position update
- `network:updated` - Network data changed
- `station:created` - New station added
