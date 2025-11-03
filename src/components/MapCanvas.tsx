import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/state/store'
import { computeModeShare } from '@/lib/simulation'
import { blend } from '@/lib/colors'

const CELL = 16
const COLS = 80
const ROWS = 50
const W = COLS * CELL
const H = ROWS * CELL

export function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDown, setDown] = useState(false)
  const grid = useStore((s) => s.grid)
  const tool = useStore((s) => s.tool)
  const brush = useStore((s) => s.brush)
  const overlay = useStore((s) => s.overlay)
  const toggleTrackAt = useStore((s) => s.toggleTrackAt)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = W
    canvas.height = H

    // draw loop
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      for (let y = 0; y < grid.rows; y++) {
        for (let x = 0; x < grid.cols; x++) {
          const i = y * grid.cols + x
          const cell = grid.cells[i]

          let color: string
          let alpha: number

          if (overlay === 'transit') {
            const w = computeModeShare(grid, x, y)
            color = blend(w)
            alpha = Math.max(0.1, cell.pop) // stronger color where population is higher
          } else if (overlay === 'population') {
            const intensity = Math.floor(cell.pop * 255)
            color = `rgb(${intensity}, ${intensity}, 255)`
            alpha = 0.8
          } else { // work overlay
            const intensity = Math.floor(cell.work * 255)
            color = `rgb(255, ${intensity}, ${intensity})`
            alpha = 0.8
          }

          ctx.globalAlpha = alpha
          ctx.fillStyle = color
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL)
          ctx.globalAlpha = 1
          if (cell.track) {
            ctx.fillStyle = '#e5e7eb' // light rail overlay
            ctx.fillRect(x * CELL + CELL * 0.25, y * CELL + CELL * 0.25, CELL * 0.5, CELL * 0.5)
          }
        }
      }

      // grid lines (subtle)
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath(); ctx.moveTo(x * CELL + 0.5, 0); ctx.lineTo(x * CELL + 0.5, H); ctx.stroke()
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * CELL + 0.5); ctx.lineTo(W, y * CELL + 0.5); ctx.stroke()
      }
    }

    draw()
  }, [grid, overlay])

  function paintAt(ev: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (tool === 'pan') return
    const rect = (ev.target as HTMLCanvasElement).getBoundingClientRect()
    const x = Math.floor((ev.clientX - rect.left) / CELL)
    const y = Math.floor((ev.clientY - rect.top) / CELL)

    for (let dy = -brush + 1; dy < brush; dy++) {
      for (let dx = -brush + 1; dx < brush; dx++) {
        const xx = x + dx
        const yy = y + dy
        if (xx < 0 || yy < 0 || xx >= COLS || yy >= ROWS) continue
        toggleTrackAt(xx, yy, tool === 'track' ? true : false)
      }
    }
  }

  return (
    <div className="w-full h-full overflow-auto">
      <canvas
        ref={canvasRef}
        className="block"
        style={{ width: COLS * CELL, height: ROWS * CELL, imageRendering: 'pixelated', cursor: tool === 'pan' ? 'grab' : 'crosshair' }}
        onMouseDown={(e) => { setDown(true); paintAt(e) }}
        onMouseMove={(e) => { if (isDown) paintAt(e) }}
        onMouseUp={() => setDown(false)}
        onMouseLeave={() => setDown(false)}
      />
    </div>
  )
}