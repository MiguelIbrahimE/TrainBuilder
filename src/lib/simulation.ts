import type { Grid } from '@/state/store'

// Compute effective mode shares for a cell given proximity to tracks.
export function computeModeShare(grid: Grid, x: number, y: number) {
  const c = grid.cells[y * grid.cols + x]
  if (!c) return { drivers: 0, walkers: 0, train: 0, bike: 0 }

  const proximity = distanceToTrack(grid, x, y)
  const transitBoost = Math.max(0, 1 - proximity / 6) // within ~6 cells fades out

  // Shift some car trips to train as access improves; bump walkers & bike slightly
  const b = c.base
  const shift = 0.35 * transitBoost * c.pop // heavier where population exists

  let train = b.train + shift
  let drivers = Math.max(0, b.drivers - shift * 0.8)
  let walkers = b.walkers + shift * 0.1
  let bike = b.bike + shift * 0.1

  const sum = train + drivers + walkers + bike
  return {
    drivers: drivers / sum,
    walkers: walkers / sum,
    train: train / sum,
    bike: bike / sum,
  }
}


function distanceToTrack(grid: Grid, x: number, y: number) {
  // Fast check: look within radius 6 for any track; use Manhattan distance
  const R = 6
  let best = Infinity
  for (let dy = -R; dy <= R; dy++) {
    const yy = y + dy
    if (yy < 0 || yy >= grid.rows) continue
    for (let dx = -R; dx <= R; dx++) {
      const xx = x + dx
      if (xx < 0 || xx >= grid.cols) continue
      const cell = grid.cells[yy * grid.cols + xx]
      if (cell?.track) {
        const d = Math.abs(dx) + Math.abs(dy)
        if (d < best) best = d
      }
    }
  }
  return best
}