import { useGameStore } from '../../store/gameStore';
import { MAP_REGIONS } from '../../types';

export function MapSelection() {
  const { setSelectedRegion } = useGameStore();

  const regions = Object.values(MAP_REGIONS);

  const handleSelectRegion = (region: typeof regions[0]) => {
    setSelectedRegion(region);
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-950">
      <div className="max-w-4xl w-full px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Train Builder</h1>
          <p className="text-xl text-gray-400">Select a region to begin building your railway network</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => handleSelectRegion(region)}
              className="group relative bg-gray-900 hover:bg-gray-800 rounded-lg p-8 border-2 border-gray-700 hover:border-blue-500 transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">{region.name}</h3>
                <p className="text-gray-400 text-sm">
                  {region.center.lat.toFixed(2)}°N, {Math.abs(region.center.lon).toFixed(2)}°
                  {region.center.lon >= 0 ? 'E' : 'W'}
                </p>
              </div>

              <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Choose your starting region. You'll build railway infrastructure on a clean map.</p>
        </div>
      </div>
    </div>
  );
}
