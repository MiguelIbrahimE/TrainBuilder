import { MapView } from './features/map/MapView';
import { ToolsMenu } from './features/tools/ToolsMenu';
import { BottomBar } from './features/ui/BottomBar';
import { Welcome } from './features/ui/Welcome';
import { useGameStore } from './store/gameStore';
import { useEffect } from 'react';

export default function App() {
  const { selectedRegion, loadFromLocalStorage } = useGameStore();

  // Load saved game on startup
  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-950">
      {selectedRegion ? (
        <>
          <div className="flex-1 relative">
            <MapView />
          </div>
          <ToolsMenu />
          <BottomBar />
        </>
      ) : (
        <div className="flex-1">
          <Welcome />
        </div>
      )}
    </div>
  );
}