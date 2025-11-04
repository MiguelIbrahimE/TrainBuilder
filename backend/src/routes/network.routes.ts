import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { GameNetwork, Station, Track } from '../types';
import { calculateStationCost, calculateTrackCost } from '../services/cost.service';

const router = Router();
const dataDir = path.join(__dirname, '..', '..', 'data', 'networks');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function networkPath(id: string) {
  ensureDir(dataDir);
  return path.join(dataDir, `${id}.json`);
}

function loadNetwork(id: string): GameNetwork | null {
  const p = networkPath(id);
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, 'utf-8');
  return JSON.parse(raw) as GameNetwork;
}

function saveNetwork(network: GameNetwork) {
  const p = networkPath(network.id);
  fs.writeFileSync(p, JSON.stringify(network, null, 2));
}

// Validation functions
const validateCoordinates = (coords: any): boolean => {
  return (
    coords &&
    typeof coords.lat === 'number' && 
    typeof coords.lon === 'number' &&
    coords.lat >= -90 && coords.lat <= 90 &&
    coords.lon >= -180 && coords.lon <= 180
  );
};

const validateWaypoints = (waypoints: any[]): boolean => {
  return Array.isArray(waypoints) && waypoints.length >= 2 && 
         waypoints.every(validateCoordinates);
};

// Initialize a new network for a region
router.post('/init', (req, res) => {
  try {
    const { name = 'My Railway Network', regionId } = req.body || {};
    const id = uuidv4();
    const network: GameNetwork = {
      id,
      name,
      budget: 1_000_000_000,
      income: 0,
      expenses: 0,
      gameYear: 2024,
      gameMonth: 1,
      stations: [],
      tracks: [],
      crossovers: [],
    };
    saveNetwork(network);
    res.status(201).json({ network, regionId });
  } catch (error) {
    console.error('Error initializing network:', error);
    res.status(500).json({ error: 'Failed to initialize network' });
  }
});

// Get full network
router.get('/:id', (req, res) => {
  try {
    const network = loadNetwork(req.params.id);
    if (!network) return res.status(404).json({ error: 'Network not found' });
    res.json(network);
  } catch (error) {
    console.error('Error loading network:', error);
    res.status(500).json({ error: 'Failed to load network' });
  }
});

// Add station and update budget
router.post('/:id/stations', (req, res) => {
  try {
    const network = loadNetwork(req.params.id);
    if (!network) return res.status(404).json({ error: 'Network not found' });
    
    const { name, location, platforms, stationType, facilities = {}, terrainModifier = 1.0 } = req.body || {};
    
    // Validation
    if (!name || !location || !platforms || !stationType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!validateCoordinates(location)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    if (platforms < 1 || platforms > 30) {
      return res.status(400).json({ error: 'Platforms must be between 1 and 30' });
    }

    const costResp = calculateStationCost({ 
      platforms, 
      stationType, 
      facilities, 
      terrainModifier 
    });
    
    const station: Station = {
      id: uuidv4(),
      name,
      location,
      platforms,
      stationType,
      cost: costResp.totalCost,
      facilities,
    };

    if (network.budget < station.cost) {
      return res.status(403).json({ 
        error: 'INSUFFICIENT_BUDGET',
        required: station.cost,
        available: network.budget 
      });
    }

    network.budget -= station.cost;
    network.stations.push(station);
    saveNetwork(network);
    
    res.status(201).json({ station, budget: network.budget });
  } catch (e: any) {
    console.error('Error adding station:', e);
    res.status(400).json({ error: e.message || 'Invalid station data' });
  }
});

// Add track and update budget
router.post('/:id/tracks', (req, res) => {
  try {
    const network = loadNetwork(req.params.id);
    if (!network) return res.status(404).json({ error: 'Network not found' });
    
    const { trackType, fromNodeId, toNodeId, waypoints, isDoubleTrack, terrainModifier = 1.0 } = req.body || {};
    
    // Validation
    if (!trackType || !fromNodeId || !toNodeId || !waypoints) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!validateWaypoints(waypoints)) {
      return res.status(400).json({ error: 'Invalid waypoints' });
    }

    // Verify stations exist
    const fromStation = network.stations.find(s => s.id === fromNodeId);
    const toStation = network.stations.find(s => s.id === toNodeId);
    
    if (!fromStation || !toStation) {
      return res.status(400).json({ error: 'Invalid station references' });
    }

    const costResp = calculateTrackCost({ 
      trackType, 
      waypoints, 
      isDoubleTrack, 
      terrainModifier 
    });

    const track: Track = {
      id: uuidv4(),
      trackType,
      fromNodeId,
      toNodeId,
      waypoints,
      lengthKm: costResp.lengthKm,
      speedLimit: (({ hst: 300, ic: 200, non_electrified: 120 } as const)[trackType as 'hst' | 'ic' | 'non_electrified']) || 120,
      isDoubleTrack: !!isDoubleTrack,
      cost: costResp.totalCost,
      maintenanceCost: costResp.maintenanceCostPerYear,
    };

    if (network.budget < track.cost) {
      return res.status(403).json({ 
        error: 'INSUFFICIENT_BUDGET',
        required: track.cost,
        available: network.budget 
      });
    }

    network.budget -= track.cost;
    network.tracks.push(track);
    saveNetwork(network);
    
    res.status(201).json({ track, budget: network.budget });
  } catch (e: any) {
    console.error('Error adding track:', e);
    res.status(400).json({ error: e.message || 'Invalid track data' });
  }
});

// Delete station
router.delete('/:id/stations/:stationId', (req, res) => {
  try {
    const network = loadNetwork(req.params.id);
    if (!network) return res.status(404).json({ error: 'Network not found' });
    
    const stationId = req.params.stationId;
    const station = network.stations.find(s => s.id === stationId);
    
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Refund 50% of station cost
    const refund = Math.floor(station.cost * 0.5);
    network.budget += refund;

    // Remove station and connected tracks
    network.stations = network.stations.filter(s => s.id !== stationId);
    network.tracks = network.tracks.filter(t => 
      t.fromNodeId !== stationId && t.toNodeId !== stationId
    );

    saveNetwork(network);
    res.json({ budget: network.budget, refund });
  } catch (error) {
    console.error('Error deleting station:', error);
    res.status(500).json({ error: 'Failed to delete station' });
  }
});

// Delete track
router.delete('/:id/tracks/:trackId', (req, res) => {
  try {
    const network = loadNetwork(req.params.id);
    if (!network) return res.status(404).json({ error: 'Network not found' });
    
    const trackId = req.params.trackId;
    const track = network.tracks.find(t => t.id === trackId);
    
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Refund 30% of track cost
    const refund = Math.floor(track.cost * 0.3);
    network.budget += refund;

    network.tracks = network.tracks.filter(t => t.id !== trackId);
    saveNetwork(network);
    
    res.json({ budget: network.budget, refund });
  } catch (error) {
    console.error('Error deleting track:', error);
    res.status(500).json({ error: 'Failed to delete track' });
  }
});

export default router;