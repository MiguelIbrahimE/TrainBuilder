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

// Initialize a new network for a region
router.post('/init', (req, res) => {
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
});

// Get full network
router.get('/:id', (req, res) => {
  const network = loadNetwork(req.params.id);
  if (!network) return res.status(404).json({ error: 'Network not found' });
  res.json(network);
});

// Add station and update budget
router.post('/:id/stations', (req, res) => {
  const network = loadNetwork(req.params.id);
  if (!network) return res.status(404).json({ error: 'Network not found' });
  const { name, location, platforms, stationType, facilities, terrainModifier } = req.body || {};
  try {
    const costResp = calculateStationCost({ platforms, stationType, facilities, terrainModifier });
    const station: Station = {
      id: uuidv4(),
      name,
      location,
      platforms,
      stationType,
      cost: costResp.totalCost,
      facilities,
    };
    if (network.budget < station.cost) return res.status(403).json({ error: 'INSUFFICIENT_BUDGET' });
    network.budget -= station.cost;
    network.stations.push(station);
    saveNetwork(network);
    res.status(201).json({ station, budget: network.budget });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Invalid station' });
  }
});

// Add track and update budget
router.post('/:id/tracks', (req, res) => {
  const network = loadNetwork(req.params.id);
  if (!network) return res.status(404).json({ error: 'Network not found' });
  const { trackType, fromNodeId, toNodeId, waypoints, isDoubleTrack, terrainModifier } = req.body || {};
  try {
    const costResp = calculateTrackCost({ trackType, waypoints, isDoubleTrack, terrainModifier });
    const track: Track = {
      id: uuidv4(),
      trackType,
      fromNodeId,
      toNodeId,
      waypoints,
      lengthKm: costResp.lengthKm,
      speedLimit: ({ hst: 300, ic: 200, non_electrified: 120 } as const)[trackType] || 120,
      isDoubleTrack,
      cost: costResp.totalCost,
      maintenanceCost: costResp.maintenanceCostPerYear,
    } as Track;
    if (network.budget < track.cost) return res.status(403).json({ error: 'INSUFFICIENT_BUDGET' });
    network.budget -= track.cost;
    network.tracks.push(track);
    saveNetwork(network);
    res.status(201).json({ track, budget: network.budget });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Invalid track' });
  }
});

export default router;


