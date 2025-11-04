import type { Grid, RevenueCalculation, GameNetwork } from '@/types';

// Compute effective mode shares for a cell given proximity to tracks.
export function computeModeShare(grid: Grid, x: number, y: number) {
  const c = grid.cells[y * grid.cols + x];
  if (!c) return { drivers: 0, walkers: 0, train: 0, bike: 0 };

  const proximity = distanceToTrack(grid, x, y);
  const transitBoost = Math.max(0, 1 - proximity / 6); // within ~6 cells fades out

  // Shift some car trips to train as access improves; bump walkers & bike slightly
  const b = c.base;
  const shift = 0.35 * transitBoost * c.population; // heavier where population exists

  let train = b.train + shift;
  let drivers = Math.max(0, b.drivers - shift * 0.8);
  let walkers = b.walkers + shift * 0.1;
  let bike = b.bike + shift * 0.1;

  const sum = train + drivers + walkers + bike;
  return {
    drivers: drivers / sum,
    walkers: walkers / sum,
    train: train / sum,
    bike: bike / sum,
  };
}

function distanceToTrack(grid: Grid, x: number, y: number) {
  // Fast check: look within radius 6 for any track; use Manhattan distance
  const R = 6;
  let best = Infinity;
  for (let dy = -R; dy <= R; dy++) {
    const yy = y + dy;
    if (yy < 0 || yy >= grid.rows) continue;
    for (let dx = -R; dx <= R; dx++) {
      const xx = x + dx;
      if (xx < 0 || xx >= grid.cols) continue;
      const cell = grid.cells[yy * grid.cols + xx];
      if (cell?.hasTrack) {
        const d = Math.abs(dx) + Math.abs(dy);
        if (d < best) best = d;
      }
    }
  }
  return best;
}

// Calculate revenue based on network configuration
export function calculateNetworkRevenue(network: GameNetwork): RevenueCalculation {
  // Base revenue per passenger km based on track type
  const revenuePerPassengerKm = {
    hst: 0.15, // €0.15 per passenger-km for HST
    ic: 0.10,  // €0.10 per passenger-km for IC
    non_electrified: 0.06 // €0.06 per passenger-km for regional
  };

  // Calculate passenger volume based on station types and connections
  let totalPassengerKm = 0;
  
  // Each station generates passengers based on its type
  network.stations.forEach(station => {
    const stationMultiplier = {
      local: 1000,
      regional: 5000,
      intercity: 20000,
      hub: 50000
    };
    
    const basePassengers = stationMultiplier[station.stationType] * station.platforms;
    
    // Connected tracks increase passenger volume
    const connectedTracks = network.tracks.filter(track => 
      track.fromNodeId === station.id || track.toNodeId === station.id
    );
    
    connectedTracks.forEach(track => {
      totalPassengerKm += basePassengers * track.lengthKm * 0.1; // 10% of passengers travel full distance
    });
  });

  const passengerRevenue = network.tracks.reduce((total, track) => {
    const trackPassengerKm = totalPassengerKm * (track.lengthKm / getTotalTrackLength(network));
    return total + (trackPassengerKm * revenuePerPassengerKm[track.trackType]);
  }, 0);

  // Station services revenue
  const stationRevenue = network.stations.reduce((total, station) => {
    let revenue = 0;
    if (station.facilities?.parking) revenue += 50000;
    if (station.facilities?.shops) revenue += 100000;
    if (station.facilities?.bikeRental) revenue += 25000;
    return total + revenue;
  }, 0);

  // Simple cargo revenue based on track length
  const cargoRevenue = getTotalTrackLength(network) * 5000; // €5K per km for cargo

  return {
    passengerRevenue,
    cargoRevenue,
    stationRevenue,
    totalRevenue: passengerRevenue + cargoRevenue + stationRevenue
  };
}

// Calculate total maintenance costs
export function calculateMaintenanceCosts(network: GameNetwork): number {
  const trackMaintenance = network.tracks.reduce((total, track) => 
    total + track.maintenanceCost, 0
  );
  
  const stationMaintenance = network.stations.reduce((total, station) => 
    total + (station.cost * 0.01), // 1% of construction cost annually
    0
  );
  
  return trackMaintenance + stationMaintenance;
}

// Helper function to get total track length
function getTotalTrackLength(network: GameNetwork): number {
  return network.tracks.reduce((total, track) => total + track.lengthKm, 0);
}

// Update grid based on network (for simulation)
export function updateGridWithNetwork(grid: Grid, network: GameNetwork): Grid {
  const newCells = [...grid.cells];
  
  // Reset all track flags
  newCells.forEach(cell => {
    cell.hasTrack = false;
  });
  
  // Mark cells that have tracks (simplified - in reality, you'd do spatial intersection)
  network.tracks.forEach(track => {
    // Simple implementation - in real game, you'd need proper coordinate to grid cell conversion
    track.waypoints.forEach(waypoint => {
      const x = Math.floor((waypoint.lon + 180) / 360 * grid.cols);
      const y = Math.floor((90 - waypoint.lat) / 180 * grid.rows);
      
      if (x >= 0 && x < grid.cols && y >= 0 && y < grid.rows) {
        const index = y * grid.cols + x;
        newCells[index].hasTrack = true;
      }
    });
  });
  
  return {
    ...grid,
    cells: newCells
  };
}