import { useStore } from '@/state/store'

export function Toolbar() {
  const tool = useStore((s) => s.tool)
  const setTool = useStore((s) => s.setTool)
  const brush = useStore((s) => s.brush)
  const setBrush = useStore((s) => s.setBrush)
  const overlay = useStore((s) => s.overlay)
  const setOverlay = useStore((s) => s.setOverlay)

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        {(['track', 'erase', 'pan'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTool(t)}
            className={`px-3 py-1 rounded border capitalize ${
              tool === t ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <label className="text-gray-400">Brush</label>
        <input
          type="range"
          min={1}
          max={5}
          value={brush}
          onChange={(e) => setBrush(Number(e.target.value))}
          className="w-20"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-sm text-gray-400">View:</span>
        {(['transit', 'population', 'work'] as const).map((o) => (
          <button
            key={o}
            onClick={() => setOverlay(o)}
            className={`px-2 py-1 text-xs rounded border capitalize ${
              overlay === o ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}