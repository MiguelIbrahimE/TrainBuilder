import { Legend } from './components/Legend'
import { MapCanvas } from './components/MapCanvas'
import { Toolbar } from './components/Toolbar'
import { Statistics } from './components/Statistics'

export default function App() {
  return (
    <div className="h-full w-full text-gray-100">
      <header className="flex items-center justify-between p-3 border-b border-white/10">
        <h1 className="text-xl font-semibold">Train Builder</h1>
        <Toolbar />
      </header>
      <main className="grid grid-cols-[1fr_320px] h-[calc(100%-56px)]">
        <section className="relative">
          <MapCanvas />
        </section>
        <aside className="border-l border-white/10 p-3 space-y-4 bg-black/30 overflow-y-auto">
          <Statistics />
          <div className="border-t border-white/10 pt-4">
            <Legend />
          </div>
          <div className="text-sm text-gray-400 pt-2">
            <p className="font-medium mb-2">How to Play:</p>
            <p>Paint train tracks to shift car drivers (red) to train riders (blue). Build near populated areas for maximum impact!</p>
          </div>
        </aside>
      </main>
    </div>
  )
}