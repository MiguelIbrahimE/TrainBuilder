import { useStore } from '@/state/store'
import { computeModeShare } from '@/lib/simulation'
import { useMemo } from 'react'

export function Statistics() {
  const grid = useStore((s) => s.grid)

  const stats = useMemo(() => {
    let totalPop = 0
    let totalDrivers = 0
    let totalWalkers = 0
    let totalTrain = 0
    let totalBike = 0
    let trackCells = 0

    for (let y = 0; y < grid.rows; y++) {
      for (let x = 0; x < grid.cols; x++) {
        const i = y * grid.cols + x
        const cell = grid.cells[i]
        const pop = cell.pop
        const shares = computeModeShare(grid, x, y)

        totalPop += pop
        totalDrivers += pop * shares.drivers
        totalWalkers += pop * shares.walkers
        totalTrain += pop * shares.train
        totalBike += pop * shares.bike

        if (cell.track) trackCells++
      }
    }

    const total = totalDrivers + totalWalkers + totalTrain + totalBike
    return {
      population: Math.round(totalPop * 100),
      drivers: Math.round((totalDrivers / total) * 100),
      walkers: Math.round((totalWalkers / total) * 100),
      train: Math.round((totalTrain / total) * 100),
      bike: Math.round((totalBike / total) * 100),
      trackCells,
      score: Math.round((totalTrain / total) * 100 - (totalDrivers / total) * 50),
    }
  }, [grid])

  return (
    <div className="space-y-3">
      <h2 className="font-medium text-lg">Statistics</h2>

      <div className="space-y-2 text-sm">
        <StatRow label="Population" value={`${stats.population}%`} />
        <StatRow label="Track Cells" value={stats.trackCells.toString()} />
      </div>

      <div className="space-y-2 text-sm">
        <h3 className="font-medium text-gray-300">Mode Share</h3>
        <ProgressBar label="Drivers" value={stats.drivers} color="#dc2626" />
        <ProgressBar label="Train" value={stats.train} color="#2563eb" />
        <ProgressBar label="Walkers" value={stats.walkers} color="#22c55e" />
        <ProgressBar label="Bike" value={stats.bike} color="#a855f7" />
      </div>

      <div className="pt-2 border-t border-white/10">
        <div className="text-center">
          <div className="text-xs text-gray-400">Transit Score</div>
          <div className={`text-2xl font-bold ${stats.score > 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {stats.score}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
