// Core data types for Train Builder backend

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Station {
  id: string;
  name: string;
  location: Coordinates;
  platforms: number;
  stationType: 'local' | 'regional' | 'intercity' | 'hub';
  cost: number;
  facilities?: {
    parking?: boolean;
    shops?: boolean;
    bikeRental?: boolean;
  };
}

export interface Track {
  id: string;
  trackType: 'hst' | 'ic' | 'non_electrified';
  fromNodeId: string;
  toNodeId: string;
  waypoints: Coordinates[];
  lengthKm: number;
  speedLimit: number;
  isDoubleTrack: boolean;
  cost: number;
  maintenanceCost: number;
}

export interface Crossover {
  id: string;
  name?: string;
  location: Coordinates;
  crossoverType: 'simple' | 'junction' | 'flying_junction';
  cost: number;
}

export interface GameNetwork {
  id: string;
  name: string;
  budget: number;
  income: number;
  expenses: number;
  gameYear: number;
  gameMonth: number;
  stations: Station[];
  tracks: Track[];
  crossovers: Crossover[];
}

// Request/Response types
export interface CalculateStationCostRequest {
  platforms: number;
  stationType: Station['stationType'];
  facilities?: Station['facilities'];
  terrainModifier?: number; // 0.8 - 2.0
}

export interface CalculateStationCostResponse {
  baseCost: number;
  platformCost: number;
  facilitiesCost: number;
  terrainCost: number;
  totalCost: number;
}

export interface CalculateTrackCostRequest {
  trackType: Track['trackType'];
  waypoints: Coordinates[];
  isDoubleTrack: boolean;
  terrainModifier?: number;
}

export interface CalculateTrackCostResponse {
  lengthKm: number;
  costPerKm: number;
  baseCost: number;
  doubleTrackCost: number;
  terrainCost: number;
  totalCost: number;
  maintenanceCostPerYear: number;
}

export interface CalculateDistanceRequest {
  from: Coordinates;
  to: Coordinates;
}

export interface CalculateDistanceResponse {
  distanceKm: number;
  distanceMiles: number;
}

export interface ValidateRouteRequest {
  waypoints: Coordinates[];
  trackType: Track['trackType'];
}

export interface ValidateRouteResponse {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  maxGrade?: number;
}

export interface SaveNetworkRequest {
  network: GameNetwork;
}

export interface SaveNetworkResponse {
  success: boolean;
  networkId: string;
}

export interface LoadNetworkRequest {
  networkId: string;
}

export interface LoadNetworkResponse {
  network: GameNetwork | null;
}

// Constants
export const TRACK_COSTS = {
  hst: 10000000, // €10M per km
  ic: 5000000, // €5M per km
  non_electrified: 2000000, // €2M per km
} as const;

export const TRACK_SPEED_LIMITS = {
  hst: 300,
  ic: 200,
  non_electrified: 120,
} as const;

export const MAINTENANCE_COSTS = {
  hst: 50_000, // €50k per km per year
  ic: 30_000,
  non_electrified: 15_000,
} as const;

export const STATION_BASE_COSTS = {
  local: 5_000_000, // €5M (1-4 platforms)
  regional: 20_000_000, // €20M (5-10 platforms)
  intercity: 50_000_000, // €50M (11-20 platforms)
  hub: 150_000_000, // €150M (21-30 platforms)
} as const;

export const CROSSOVER_COSTS = {
  simple: 500_000, // €500k
  junction: 2_000_000, // €2M
  flying_junction: 10_000_000, // €10M
} as const;

export const FACILITY_COSTS = {
  parking: 0.05, // +5%
  shops: 0.05, // +5%
  bikeRental: 0.02, // +2%
} as const;
