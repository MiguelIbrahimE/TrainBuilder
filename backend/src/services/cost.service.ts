import type {
  CalculateStationCostRequest,
  CalculateStationCostResponse,
  CalculateTrackCostRequest,
  CalculateTrackCostResponse,
  Coordinates,
} from '../types';
import {
  STATION_BASE_COSTS,
  TRACK_COSTS,
  MAINTENANCE_COSTS,
  CROSSOVER_COSTS,
  FACILITY_COSTS,
  TRACK_SPEED_LIMITS,
} from '../types';
import { calculateRouteLength } from './geometry.service';

/**
 * Cost calculation service
 * Handles all financial calculations to offload from frontend
 * All costs in euros (cents for precision in DB, but euros here for readability)
 */

/**
 * Calculate station construction cost
 */
export function calculateStationCost(
  request: CalculateStationCostRequest
): CalculateStationCostResponse {
  const { platforms, stationType, facilities = {}, terrainModifier = 1.0 } = request;

  // Validate platforms range based on station type
  validatePlatformCount(platforms, stationType);

  // Base cost for station type
  const baseCost = STATION_BASE_COSTS[stationType];

  // Platform multiplier (more platforms = exponentially more expensive)
  const platformMultiplier = 1 + platforms / 10;
  const platformCost = baseCost * platformMultiplier;

  // Facilities cost (percentage of base cost)
  let facilitiesMultiplier = 1.0;
  if (facilities.parking) facilitiesMultiplier += FACILITY_COSTS.parking;
  if (facilities.shops) facilitiesMultiplier += FACILITY_COSTS.shops;
  if (facilities.bikeRental) facilitiesMultiplier += FACILITY_COSTS.bikeRental;
  const facilitiesCost = platformCost * (facilitiesMultiplier - 1);

  // Terrain modifier (0.8 for flat terrain, 2.0+ for mountains/urban)
  const terrainCost = platformCost * (terrainModifier - 1);

  // Total cost
  const totalCost = Math.round(
    platformCost * facilitiesMultiplier * terrainModifier
  );

  return {
    baseCost,
    platformCost: Math.round(platformCost),
    facilitiesCost: Math.round(facilitiesCost),
    terrainCost: Math.round(terrainCost),
    totalCost,
  };
}

/**
 * Calculate track construction cost
 */
export function calculateTrackCost(
  request: CalculateTrackCostRequest
): CalculateTrackCostResponse {
  const {
    trackType,
    waypoints,
    isDoubleTrack,
    terrainModifier = 1.0,
  } = request;

  // Calculate route length
  const lengthKm = calculateRouteLength(waypoints);

  if (lengthKm < 0.5) {
    throw new Error('Track too short. Minimum length: 0.5 km');
  }

  // Cost per km based on track type
  const costPerKm = TRACK_COSTS[trackType];

  // Base cost (single track)
  const baseCost = costPerKm * lengthKm;

  // Double track multiplier
  const doubleTrackMultiplier = isDoubleTrack ? 1.5 : 1.0;
  const doubleTrackCost = baseCost * (doubleTrackMultiplier - 1);

  // Terrain cost
  const terrainCost = baseCost * (terrainModifier - 1);

  // Total construction cost
  const totalCost = Math.round(
    baseCost * doubleTrackMultiplier * terrainModifier
  );

  // Annual maintenance cost
  const maintenanceCostPerYear = Math.round(
    MAINTENANCE_COSTS[trackType] * lengthKm * doubleTrackMultiplier
  );

  // Speed limit
  const speedLimit = TRACK_SPEED_LIMITS[trackType];

  return {
    lengthKm: Math.round(lengthKm * 100) / 100, // Round to 2 decimals
    costPerKm,
    baseCost: Math.round(baseCost),
    doubleTrackCost: Math.round(doubleTrackCost),
    terrainCost: Math.round(terrainCost),
    totalCost,
    maintenanceCostPerYear,
  };
}

/**
 * Calculate crossover cost
 */
export function calculateCrossoverCost(
  type: 'simple' | 'junction' | 'flying_junction',
  terrainModifier: number = 1.0
): number {
  const baseCost = CROSSOVER_COSTS[type];
  return Math.round(baseCost * terrainModifier);
}

/**
 * Calculate total network value
 */
export function calculateNetworkValue(
  stations: Array<{ cost: number }>,
  tracks: Array<{ cost: number }>,
  crossovers: Array<{ cost: number }>
): number {
  const stationValue = stations.reduce((sum, s) => sum + s.cost, 0);
  const trackValue = tracks.reduce((sum, t) => sum + t.cost, 0);
  const crossoverValue = crossovers.reduce((sum, c) => sum + c.cost, 0);

  return stationValue + trackValue + crossoverValue;
}

/**
 * Calculate annual maintenance costs for entire network
 */
export function calculateAnnualMaintenance(
  tracks: Array<{ maintenanceCost: number }>
): number {
  return tracks.reduce((sum, t) => sum + t.maintenanceCost, 0);
}

/**
 * Estimate terrain modifier based on coordinates (basic implementation)
 * In production, this would query elevation data
 */
export function estimateTerrainModifier(waypoints: Coordinates[]): number {
  // For MVP, use simple heuristics
  // Mountains: Alps, Pyrenees have lat ~45-47, lon 6-10
  // Urban areas: major cities

  // This is placeholder logic - should be replaced with real terrain/elevation data
  const avgLat = waypoints.reduce((sum, p) => sum + p.lat, 0) / waypoints.length;
  const avgLon = waypoints.reduce((sum, p) => sum + p.lon, 0) / waypoints.length;

  // Mountainous regions (rough approximation for European Alps)
  if (avgLat > 45 && avgLat < 48 && avgLon > 6 && avgLon < 11) {
    return 1.8; // Mountains are expensive
  }

  // Major urban centers (simplified)
  const urbanCenters = [
    { lat: 52.37, lon: 4.90, name: 'Amsterdam' },
    { lat: 51.92, lon: 4.47, name: 'Rotterdam' },
    { lat: 48.86, lon: 2.35, name: 'Paris' },
    { lat: 50.85, lon: 4.35, name: 'Brussels' },
    { lat: 51.51, lon: -0.13, name: 'London' },
  ];

  for (const city of urbanCenters) {
    const dist = Math.sqrt(
      Math.pow(avgLat - city.lat, 2) + Math.pow(avgLon - city.lon, 2)
    );
    if (dist < 0.2) {
      // Within ~20km of city center
      return 1.5; // Urban construction is expensive
    }
  }

  // Flat rural terrain (default)
  return 1.0;
}

/**
 * Calculate revenue estimate based on network connectivity
 * Simplified formula for MVP
 */
export function estimateAnnualRevenue(
  stations: Array<{ stationType: string; platforms: number }>,
  tracks: Array<{ lengthKm: number; trackType: string }>
): number {
  // Revenue factors:
  // - Number and size of stations
  // - Network connectivity
  // - Track quality (HST generates more revenue)

  let stationRevenue = 0;
  for (const station of stations) {
    const baseRevenue = {
      local: 500_000,
      regional: 2_000_000,
      intercity: 5_000_000,
      hub: 15_000_000,
    }[station.stationType] || 0;

    stationRevenue += baseRevenue * (1 + station.platforms / 10);
  }

  let trackRevenue = 0;
  for (const track of tracks) {
    const revenuePerKm = {
      hst: 100_000,
      ic: 50_000,
      non_electrified: 20_000,
    }[track.trackType] || 0;

    trackRevenue += revenuePerKm * track.lengthKm;
  }

  // Network effect bonus (more connections = disproportionally more revenue)
  const networkBonus = stations.length > 1 ? Math.pow(stations.length, 1.2) / 10 : 0;

  return Math.round((stationRevenue + trackRevenue) * (1 + networkBonus));
}

// Validation helpers
function validatePlatformCount(
  platforms: number,
  stationType: 'local' | 'regional' | 'intercity' | 'hub'
): void {
  if (platforms < 1 || platforms > 30) {
    throw new Error('Platform count must be between 1 and 30');
  }

  const ranges = {
    local: { min: 1, max: 4 },
    regional: { min: 5, max: 10 },
    intercity: { min: 11, max: 20 },
    hub: { min: 21, max: 30 },
  };

  const range = ranges[stationType];
  if (platforms < range.min || platforms > range.max) {
    throw new Error(
      `${stationType} stations must have ${range.min}-${range.max} platforms`
    );
  }
}
