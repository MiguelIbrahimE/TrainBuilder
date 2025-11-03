/**
 * API Client for Train Builder Backend
 * Handles all communication with computation backend
 */

import type {
  Coordinates,
  StationCostResponse,
  TrackCostResponse,
  NetworkStats,
  Station,
  Track,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new APIError(
      error.error || `API Error: ${response.statusText}`,
      response.status,
      error
    );
  }

  return response.json();
}

export const api = {
  /**
   * Calculate distance between two points
   */
  calculateDistance: async (from: Coordinates, to: Coordinates) => {
    return fetchAPI<{ distanceKm: number; distanceMiles: number }>(
      '/compute/distance',
      {
        method: 'POST',
        body: JSON.stringify({ from, to }),
      }
    );
  },

  /**
   * Calculate route length from waypoints
   */
  calculateRouteLength: async (waypoints: Coordinates[]) => {
    return fetchAPI<{ lengthKm: number; waypoints: number }>(
      '/compute/route-length',
      {
        method: 'POST',
        body: JSON.stringify({ waypoints }),
      }
    );
  },

  /**
   * Calculate station construction cost
   */
  calculateStationCost: async (params: {
    platforms: number;
    stationType: Station['stationType'];
    facilities?: Station['facilities'];
    terrainModifier?: number;
  }) => {
    return fetchAPI<StationCostResponse>('/compute/station-cost', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Calculate track construction cost
   */
  calculateTrackCost: async (params: {
    trackType: Track['trackType'];
    waypoints: Coordinates[];
    isDoubleTrack: boolean;
    terrainModifier?: number;
  }) => {
    return fetchAPI<TrackCostResponse>('/compute/track-cost', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Calculate crossover cost
   */
  calculateCrossoverCost: async (params: {
    type: 'simple' | 'junction' | 'flying_junction';
    terrainModifier?: number;
  }) => {
    return fetchAPI<{ type: string; cost: number; terrainModifier: number }>(
      '/compute/crossover-cost',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  },

  /**
   * Estimate terrain modifier for route
   */
  estimateTerrainModifier: async (waypoints: Coordinates[]) => {
    return fetchAPI<{ terrainModifier: number; terrain: string }>(
      '/compute/terrain-modifier',
      {
        method: 'POST',
        body: JSON.stringify({ waypoints }),
      }
    );
  },

  /**
   * Calculate network statistics
   */
  calculateNetworkStats: async (params: {
    stations: Array<{ cost: number; stationType: string; platforms: number }>;
    tracks: Array<{ lengthKm: number; trackType: string; maintenanceCost: number }>;
    crossovers?: Array<{ cost: number }>;
  }) => {
    return fetchAPI<NetworkStats>('/compute/network-stats', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Health check
   */
  healthCheck: async () => {
    return fetchAPI<{
      status: string;
      timestamp: string;
      uptime: number;
      environment: string;
    }>('/health', {
      method: 'GET',
    });
  },
};

export { APIError };
