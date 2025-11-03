import { create } from 'zustand'

export type Cell = {
  track: boolean
  pop: number // 0-1 population density
  work: number // 0-1 job availability
  base: { drivers: number; walkers: number; train: number; bike: number } // sums ~1
}


export type Tool = 'track' | 'erase' | 'pan'
export type Overlay = 'transit' | 'population' | 'work'


const COLS = Number(getComputedStyle(document.documentElement).getPropertyValue('--grid-cols') || 80)
const ROWS = Number(getComputedStyle(document.documentElement).getPropertyValue('--grid-rows') || 50)


function seededRandom(seed: number) {
return () => (seed = (seed * 9301 + 49297) % 233280) / 233280
}


function generateGrid(cols = COLS, rows = ROWS) {
  const rand = seededRandom(42)
  const cells: Cell[] = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const n = rand()
      const pop = Math.max(0, Math.min(1, (rand() + rand() + rand()) / 3))

      // Work zones concentrated in central business district
      const distToCenter = Math.hypot(x - cols / 2, y - rows / 2) / Math.hypot(cols / 2, rows / 2)
      const work = Math.max(0, Math.min(1, 0.8 * (1 - distToCenter) + 0.2 * rand()))

      // base preferences — cars dominate farther from center to start
      const drivers = 0.4 + 0.3 * distToCenter + 0.1 * (n - 0.5)
      const walkers = 0.15 + 0.1 * (0.5 - distToCenter) + 0.05 * (rand() - 0.5)
      const train = 0.25 + 0.05 * (0.5 - distToCenter)
      const bike = 0.2 + 0.05 * (rand() - 0.5)
      const sum = drivers + walkers + train + bike
      cells.push({
        track: false,
        pop,
        work,
        base: {
          drivers: drivers / sum,
          walkers: walkers / sum,
          train: train / sum,
          bike: bike / sum
        }
      })
    }
  }
  return { cols, rows, cells }
}


export type Grid = ReturnType<typeof generateGrid>

type StoreState = {
  grid: Grid
  tool: Tool
  brush: number
  overlay: Overlay
  setTool: (t: Tool) => void
  setBrush: (b: number) => void
  setOverlay: (o: Overlay) => void
  toggleTrackAt: (x: number, y: number, on?: boolean) => void
}

export const useStore = create<StoreState>((set) => ({
  grid: generateGrid(),
  tool: 'track',
  brush: 1,
  overlay: 'transit',
  setTool: (t) => set({ tool: t }),
  setBrush: (b) => set({ brush: b }),
  setOverlay: (o) => set({ overlay: o }),
  toggleTrackAt: (x, y, on) => set((state) => {
    const i = y * state.grid.cols + x
    const c = state.grid.cells[i]
    if (!c) return {}
    const newCells = [...state.grid.cells]
    newCells[i] = { ...c, track: on ?? !c.track }
    return { grid: { ...state.grid, cells: newCells } }
  }),
}))