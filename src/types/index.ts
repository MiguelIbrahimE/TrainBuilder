// Frontend types matching backend API

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

export type Tool =
  | 'select'
  | 'station'
  | 'track'
  | 'crossover'
  | 'delete'
  | 'pan';

export type MapView = 'default' | 'satellite' | 'terrain';

// Map Region Selection
export interface MapRegion {
  id: string;
  name: string;
  bounds: [[number, number], [number, number]]; // [[south, west], [north, east]]
  center: Coordinates;
  zoom: number;
}

// Predefined map regions
export const MAP_REGIONS: Record<string, MapRegion> = {
  belgium: {
    id: 'belgium',
    name: 'Belgium',
    bounds: [[49.5, 2.5], [51.5, 6.4]],
    center: { lat: 50.5, lon: 4.5 },
    zoom: 8,
  },
  netherlands: {
    id: 'netherlands',
    name: 'Netherlands',
    bounds: [[50.75, 3.36], [53.55, 7.23]],
    center: { lat: 52.37, lon: 4.9 },
    zoom: 8,
  },
  benelux: {
    id: 'benelux',
    name: 'Benelux',
    bounds: [[49.5, 2.5], [53.55, 7.23]],
    center: { lat: 51.5, lon: 4.9 },
    zoom: 7,
  },
  france: {
    id: 'france',
    name: 'France',
    bounds: [[41.3, -5.1], [51.1, 9.6]],
    center: { lat: 46.2, lon: 2.2 },
    zoom: 6,
  },
  germany: {
    id: 'germany',
    name: 'Germany',
    bounds: [[47.3, 5.9], [55.1, 15.0]],
    center: { lat: 51.2, lon: 10.4 },
    zoom: 6,
  },
} as const;

// UI State
export interface ToolSettings {
  stationType: Station['stationType'];
  platforms: number;
  trackType: Track['trackType'];
  isDoubleTrack: boolean;
  crossoverType: Crossover['crossoverType'];
  facilities: {
    parking: boolean;
    shops: boolean;
    bikeRental: boolean;
  };
}

// API Response types
export interface StationCostResponse {
  baseCost: number;
  platformCost: number;
  facilitiesCost: number;
  terrainCost: number;
  totalCost: number;
}

export interface TrackCostResponse {
  lengthKm: number;
  costPerKm: number;
  baseCost: number;
  doubleTrackCost: number;
  terrainCost: number;
  totalCost: number;
  maintenanceCostPerYear: number;
}

export interface NetworkStats {
  totalValue: number;
  annualMaintenance: number;
  estimatedRevenue: number;
  netIncome: number;
  stationCount: number;
  trackCount: number;
  crossoverCount: number;
  totalTrackLength: number;
}

// Constants
export const DEFAULT_MAP_CENTER: Coordinates = {
  lat: 51.9, // Center of Netherlands/Belgium region
  lon: 4.5,
};

export const DEFAULT_MAP_ZOOM = 8;

export const TRACK_COLORS = {
  hst: '#ff0000', // Red for high-speed
  ic: '#0066cc', // Blue for intercity
  non_electrified: '#666666', // Gray for non-electrified
} as const;

export const STATION_COLORS = {
  local: '#4CAF50',
  regional: '#2196F3',
  intercity: '#FF9800',
  hub: '#9C27B0',
} as const;
