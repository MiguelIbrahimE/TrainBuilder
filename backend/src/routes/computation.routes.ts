import { Router, Request, Response } from 'express';
import * as geometryService from '../services/geometry.service';
import * as costService from '../services/cost.service';
import type {
  CalculateStationCostRequest,
  CalculateTrackCostRequest,
  CalculateDistanceRequest,
  Coordinates,
} from '../types';

const router = Router();

/**
 * Calculate distance between two points
 * POST /api/compute/distance
 */
router.post('/distance', (req: Request, res: Response) => {
  try {
    const { from, to } = req.body as CalculateDistanceRequest;

    if (!from || !to || !from.lat || !from.lon || !to.lat || !to.lon) {
      return res.status(400).json({
        error: 'Invalid coordinates. Required: { from: {lat, lon}, to: {lat, lon} }',
      });
    }

    const distanceKm = geometryService.calculateDistance(from, to);
    const distanceMiles = distanceKm * 0.621371;

    res.json({
      distanceKm: Math.round(distanceKm * 100) / 100,
      distanceMiles: Math.round(distanceMiles * 100) / 100,
    });
  } catch (error) {
    console.error('Distance calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate distance' });
  }
});

/**
 * Calculate route length from waypoints
 * POST /api/compute/route-length
 */
router.post('/route-length', (req: Request, res: Response) => {
  try {
    const { waypoints } = req.body as { waypoints: Coordinates[] };

    if (!Array.isArray(waypoints) || waypoints.length < 2) {
      return res.status(400).json({
        error: 'Waypoints must be an array of at least 2 coordinates',
      });
    }

    const lengthKm = geometryService.calculateRouteLength(waypoints);

    res.json({
      lengthKm: Math.round(lengthKm * 100) / 100,
      waypoints: waypoints.length,
    });
  } catch (error) {
    console.error('Route length calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate route length' });
  }
});

/**
 * Calculate station construction cost
 * POST /api/compute/station-cost
 */
router.post('/station-cost', (req: Request, res: Response) => {
  try {
    const request = req.body as CalculateStationCostRequest;

    if (!request.platforms || !request.stationType) {
      return res.status(400).json({
        error: 'Required: platforms (number), stationType (local|regional|intercity|hub)',
      });
    }

    const result = costService.calculateStationCost(request);
    res.json(result);
  } catch (error: any) {
    console.error('Station cost calculation error:', error);
    res.status(400).json({ error: error.message || 'Failed to calculate station cost' });
  }
});

/**
 * Calculate track construction cost
 * POST /api/compute/track-cost
 */
router.post('/track-cost', (req: Request, res: Response) => {
  try {
    const request = req.body as CalculateTrackCostRequest;

    if (!request.trackType || !request.waypoints || !Array.isArray(request.waypoints)) {
      return res.status(400).json({
        error: 'Required: trackType (hst|ic|non_electrified), waypoints (array)',
      });
    }

    const result = costService.calculateTrackCost(request);
    res.json(result);
  } catch (error: any) {
    console.error('Track cost calculation error:', error);
    res.status(400).json({ error: error.message || 'Failed to calculate track cost' });
  }
});

/**
 * Calculate crossover cost
 * POST /api/compute/crossover-cost
 */
router.post('/crossover-cost', (req: Request, res: Response) => {
  try {
    const { type, terrainModifier = 1.0 } = req.body;

    if (!type || !['simple', 'junction', 'flying_junction'].includes(type)) {
      return res.status(400).json({
        error: 'Required: type (simple|junction|flying_junction)',
      });
    }

    const cost = costService.calculateCrossoverCost(type, terrainModifier);

    res.json({ type, cost, terrainModifier });
  } catch (error) {
    console.error('Crossover cost calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate crossover cost' });
  }
});

/**
 * Estimate terrain modifier for route
 * POST /api/compute/terrain-modifier
 */
router.post('/terrain-modifier', (req: Request, res: Response) => {
  try {
    const { waypoints } = req.body as { waypoints: Coordinates[] };

    if (!Array.isArray(waypoints) || waypoints.length === 0) {
      return res.status(400).json({
        error: 'Waypoints required as array of coordinates',
      });
    }

    const terrainModifier = costService.estimateTerrainModifier(waypoints);

    let terrain = 'flat';
    if (terrainModifier > 1.6) terrain = 'mountainous';
    else if (terrainModifier > 1.3) terrain = 'urban';
    else if (terrainModifier > 1.1) terrain = 'hilly';

    res.json({ terrainModifier, terrain });
  } catch (error) {
    console.error('Terrain modifier estimation error:', error);
    res.status(500).json({ error: 'Failed to estimate terrain modifier' });
  }
});

/**
 * Calculate network statistics
 * POST /api/compute/network-stats
 */
router.post('/network-stats', (req: Request, res: Response) => {
  try {
    const { stations, tracks, crossovers } = req.body;

    if (!Array.isArray(stations) || !Array.isArray(tracks)) {
      return res.status(400).json({
        error: 'Required: stations (array), tracks (array), crossovers (array, optional)',
      });
    }

    const totalValue = costService.calculateNetworkValue(
      stations,
      tracks,
      crossovers || []
    );

    const annualMaintenance = costService.calculateAnnualMaintenance(tracks);
    const estimatedRevenue = costService.estimateAnnualRevenue(stations, tracks);
    const netIncome = estimatedRevenue - annualMaintenance;

    res.json({
      totalValue,
      annualMaintenance,
      estimatedRevenue,
      netIncome,
      stationCount: stations.length,
      trackCount: tracks.length,
      crossoverCount: (crossovers || []).length,
      totalTrackLength: tracks.reduce((sum: number, t: any) => sum + t.lengthKm, 0),
    });
  } catch (error) {
    console.error('Network stats calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate network stats' });
  }
});

export default router;
