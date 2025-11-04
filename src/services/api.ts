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
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // Handle specific error cases
        if (response.status === 403 && error.error === 'INSUFFICIENT_BUDGET') {
          throw new APIError(
            `Insufficient budget! Need €${error.required?.toLocaleString()} but only have €${error.available?.toLocaleString()}`,
            response.status,
            error
          );
        }

        throw new APIError(
          error.error || `API Error: ${response.statusText}`,
          response.status,
          error
        );
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof APIError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError || new Error('API request failed after retries');
}

export const api = {
  // Network persistence APIs
  initNetwork: async (name: string, regionId: string) => {
    return fetchAPI<{ network: any; regionId: string }>(`/network/init`, {
      method: 'POST',
      body: JSON.stringify({ name, regionId }),
    });
  },

  getNetwork: async (id: string) => {
    return fetchAPI<any>(`/network/${id}`, { method: 'GET' });
  },

  addStationToNetwork: async (networkId: string, stationData: any) => {
    try {
      return await fetchAPI<{ station: any; budget: number }>(`/network/${networkId}/stations`, {
        method: 'POST',
        body: JSON.stringify(stationData),
      });
    } catch (error) {
      if (error instanceof APIError) {
        throw error; // Re-throw API errors with user-friendly messages
      }
      throw new Error('Failed to add station. Please try again.');
    }
  },

  addTrackToNetwork: async (networkId: string, trackData: any) => {
    try {
      return await fetchAPI<{ track: any; budget: number }>(`/network/${networkId}/tracks`, {
        method: 'POST',
        body: JSON.stringify(trackData),
      });
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new Error('Failed to add track. Please try again.');
    }
  },

  // Delete methods
  removeStation: async (networkId: string, stationId: string) => {
    return fetchAPI<{ budget: number; refund: number }>(`/network/${networkId}/stations/${stationId}`, {
      method: 'DELETE',
    });
  },

  removeTrack: async (networkId: string, trackId: string) => {
    return fetchAPI<{ budget: number; refund: number }>(`/network/${networkId}/tracks/${trackId}`, {
      method: 'DELETE',
    });
  },

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