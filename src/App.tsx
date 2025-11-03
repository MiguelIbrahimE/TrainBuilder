import { TopBar } from './features/ui/TopBar';
import { MapView } from './features/map/MapView';
import { ToolsMenu } from './features/tools/ToolsMenu';

export default function App() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-950">
      {/* Top bar with budget and stats */}
      <TopBar />

      {/* Main map view */}
      <div className="flex-1 relative">
        <MapView />
      </div>

      {/* Floating tools menu (bottom left) */}
      <ToolsMenu />
    </div>
  );
}
