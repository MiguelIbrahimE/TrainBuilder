/**
 * LEGACY COMPONENT - DEPRECATED
 * This file is no longer used. The game now uses MapView with Leaflet.
 * Keeping this file empty to prevent build errors.
 */

export function MapCanvas() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center text-gray-500">
        <div className="text-4xl mb-4">🚄</div>
        <h2 className="text-xl font-bold mb-2">Legacy View Deprecated</h2>
        <p>This grid-based simulation is no longer available.</p>
        <p className="mt-2">Use the main railway construction map instead.</p>
      </div>
    </div>
  );
}