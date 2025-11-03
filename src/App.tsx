import { TopBar } from './features/ui/TopBar';
import { MapView } from './features/map/MapView';
import { ToolsMenu } from './features/tools/ToolsMenu';
import { Welcome } from './features/ui/Welcome';
import { useGameStore } from './store/gameStore';

export default function App() {
  const selectedRegion = useGameStore((s) => s.selectedRegion);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-950">
      {selectedRegion ? (
        <>
          <TopBar />
          <div className="flex-1 relative">
            <MapView />
          </div>
          <ToolsMenu />
        </>
      ) : (
        <div className="flex-1">
          <Welcome />
        </div>
      )}
    </div>
  );
}
