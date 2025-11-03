import { MAP_REGIONS, type MapRegion } from '../../types';
import { useGameStore } from '../../store/gameStore';
import { useMemo, useState } from 'react';

export function Welcome() {
  const setSelectedRegion = useGameStore((s) => s.setSelectedRegion);
  const [query, setQuery] = useState('');

  const regions = useMemo(() => {
    const list = Object.values(MAP_REGIONS);
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((r) => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
  }, [query]);

  const selectRegion = (region: MapRegion) => {
    setSelectedRegion(region);
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-gray-950 text-white">
      <div className="max-w-3xl w-full px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Welcome to Train Builder</h1>
        <p className="text-gray-300 mb-8">Choose a map to start building your railway network.</p>

        <div className="mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search maps (e.g., Belgium, Netherlands, Germany)"
            className="w-full rounded-md bg-gray-900 border border-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => selectRegion(region)}
              className="rounded-lg bg-gray-900 border border-gray-800 p-4 text-left hover:border-blue-600 hover:bg-gray-850 transition"
            >
              <div className="text-lg font-semibold mb-1">{region.name}</div>
              <div className="text-xs text-gray-400">Center: {region.center.lat.toFixed(2)}, {region.center.lon.toFixed(2)}</div>
              <div className="text-xs text-gray-500">Zoom: {region.zoom}</div>
            </button>
          ))}
        </div>

        <div className="mt-6 text-gray-400 text-sm">
          Tip: Start with Belgium or Netherlands.
        </div>
      </div>
    </div>
  );
}


