import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Tool } from '../../types';

const TOOLS: Array<{ id: Tool; icon: string; label: string }> = [
  { id: 'select', icon: '👆', label: 'Select' },
  { id: 'station', icon: '🏢', label: 'Station' },
  { id: 'track', icon: '🛤️', label: 'Track' },
  { id: 'crossover', icon: '🔀', label: 'Junction' },
  { id: 'delete', icon: '🗑️', label: 'Delete' },
  { id: 'pan', icon: '🤚', label: 'Pan' },
];

export function ToolsMenu() {
  const { currentTool, setCurrentTool, isToolMenuOpen, toggleToolMenu, toolSettings, setToolSettings } = useGameStore();

  return (
    <>
      {/* Floating tools button (bottom left) */}
      <button
        onClick={toggleToolMenu}
        className="fixed bottom-6 left-6 z-[1000] bg-gray-900 text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-colors border-2 border-white/20"
        aria-label="Toggle tools menu"
      >
        <span className="text-2xl">{isToolMenuOpen ? '✕' : '🛠️'}</span>
      </button>

      {/* Tools menu panel */}
      {isToolMenuOpen && (
        <div className="fixed bottom-24 left-6 z-[1000] bg-gray-900 border-2 border-white/20 rounded-lg shadow-2xl p-4 w-80">
          <h3 className="text-white font-bold mb-3 text-lg">Build Tools</h3>

          {/* Tool buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setCurrentTool(tool.id)}
                className={`p-3 rounded-lg transition-all ${
                  currentTool === tool.id
                    ? 'bg-blue-600 text-white border-2 border-blue-400'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                }`}
              >
                <div className="text-2xl mb-1">{tool.icon}</div>
                <div className="text-xs">{tool.label}</div>
              </button>
            ))}
          </div>

          {/* Tool-specific settings */}
          {currentTool === 'station' && (
            <div className="border-t border-gray-700 pt-3 space-y-3">
              <h4 className="text-white font-semibold text-sm">Station Settings</h4>

              <div>
                <label className="text-gray-400 text-xs block mb-1">Type</label>
                <select
                  value={toolSettings.stationType}
                  onChange={(e) => setToolSettings({ stationType: e.target.value as any })}
                  className="w-full bg-gray-800 text-white p-2 rounded border border-gray-700"
                >
                  <option value="local">Local (1-4 platforms)</option>
                  <option value="regional">Regional (5-10 platforms)</option>
                  <option value="intercity">Intercity (11-20 platforms)</option>
                  <option value="hub">Hub (21-30 platforms)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-xs block mb-1">
                  Platforms: {toolSettings.platforms}
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={toolSettings.platforms}
                  onChange={(e) => setToolSettings({ platforms: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-400 text-xs block">Facilities</label>
                <label className="flex items-center text-white text-sm">
                  <input
                    type="checkbox"
                    checked={toolSettings.facilities.parking}
                    onChange={(e) =>
                      setToolSettings({
                        facilities: { ...toolSettings.facilities, parking: e.target.checked },
                      })
                    }
                    className="mr-2"
                  />
                  Parking (+5%)
                </label>
                <label className="flex items-center text-white text-sm">
                  <input
                    type="checkbox"
                    checked={toolSettings.facilities.shops}
                    onChange={(e) =>
                      setToolSettings({
                        facilities: { ...toolSettings.facilities, shops: e.target.checked },
                      })
                    }
                    className="mr-2"
                  />
                  Shops (+5%)
                </label>
                <label className="flex items-center text-white text-sm">
                  <input
                    type="checkbox"
                    checked={toolSettings.facilities.bikeRental}
                    onChange={(e) =>
                      setToolSettings({
                        facilities: { ...toolSettings.facilities, bikeRental: e.target.checked },
                      })
                    }
                    className="mr-2"
                  />
                  Bike Rental (+2%)
                </label>
              </div>
            </div>
          )}

          {currentTool === 'track' && (
            <div className="border-t border-gray-700 pt-3 space-y-3">
              <h4 className="text-white font-semibold text-sm">Track Settings</h4>

              <div>
                <label className="text-gray-400 text-xs block mb-1">Type</label>
                <select
                  value={toolSettings.trackType}
                  onChange={(e) => setToolSettings({ trackType: e.target.value as any })}
                  className="w-full bg-gray-800 text-white p-2 rounded border border-gray-700"
                >
                  <option value="non_electrified">Non-Electrified (€2M/km, 120 km/h)</option>
                  <option value="ic">InterCity (€5M/km, 200 km/h)</option>
                  <option value="hst">High-Speed (€10M/km, 300 km/h)</option>
                </select>
              </div>

              <label className="flex items-center text-white text-sm">
                <input
                  type="checkbox"
                  checked={toolSettings.isDoubleTrack}
                  onChange={(e) => setToolSettings({ isDoubleTrack: e.target.checked })}
                  className="mr-2"
                />
                Double Track (×1.5 cost)
              </label>
            </div>
          )}

          {currentTool === 'crossover' && (
            <div className="border-t border-gray-700 pt-3 space-y-3">
              <h4 className="text-white font-semibold text-sm">Junction Settings</h4>

              <div>
                <label className="text-gray-400 text-xs block mb-1">Type</label>
                <select
                  value={toolSettings.crossoverType}
                  onChange={(e) => setToolSettings({ crossoverType: e.target.value as any })}
                  className="w-full bg-gray-800 text-white p-2 rounded border border-gray-700"
                >
                  <option value="simple">Simple (€0.5M)</option>
                  <option value="junction">Junction (€2M)</option>
                  <option value="flying_junction">Flying Junction (€10M)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
