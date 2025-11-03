# Frontend Architecture - Train Builder

## Overview

The frontend has been completely refactored from a pixel-based grid system to a real OpenStreetMap-based railway construction interface. Users can now build realistic railway networks on actual geographical maps.

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Leaflet + React Leaflet** - Interactive map rendering (OpenStreetMap)
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## Project Structure

```
src/
├── features/
│   ├── map/
│   │   └── MapView.tsx          # Main OpenStreetMap component
│   ├── tools/
│   │   └── ToolsMenu.tsx        # Bottom-left tools menu
│   ├── network/                 # Network visualization (future)
│   └── ui/
│       └── TopBar.tsx           # Budget and stats display
├── services/
│   └── api.ts                   # Backend API client
├── store/
│   └── gameStore.ts             # Zustand game state
├── types/
│   └── index.ts                 # TypeScript types
├── App.tsx                      # Main app component
└── index.css                    # Global styles + Leaflet CSS
```

## Key Components

### MapView (`features/map/MapView.tsx`)

**Responsibilities:**
- Renders OpenStreetMap using Leaflet
- Displays stations as custom markers
- Renders tracks as polylines
- Displays crossovers/junctions
- Handles map click events for tool interactions

**Features:**
- Real geographical data
- Custom styled markers for different station types
- Color-coded tracks (HST=red, IC=blue, Non-electric=gray)
- Interactive popups showing details
- Responsive to tool selection

### ToolsMenu (`features/tools/ToolsMenu.tsx`)

**Location:** Bottom-left floating button + panel

**Tools Available:**
1. **Select** (👆) - Select and inspect existing infrastructure
2. **Station** (🏢) - Place new stations
   - Configure: Type, Platforms (1-30), Facilities
3. **Track** (🛤️) - Draw tracks between stations
   - Configure: Type (HST/IC/Non-electric), Single/Double track
4. **Junction** (🔀) - Place crossovers/junctions
   - Configure: Type (Simple/Junction/Flying)
5. **Delete** (🗑️) - Remove infrastructure
6. **Pan** (🤚) - Pan around the map

**Tool Settings:**
- Each tool has context-specific settings
- Settings panel shows relevant options
- Real-time cost estimation (future)

### TopBar (`features/ui/TopBar.tsx`)

**Displays:**
- Network name
- Current budget (color-coded: green if healthy, red if low)
- Annual income (green)
- Annual expenses (red)
- Net income (green/red based on profitability)
- Game date (Year-Month)
- Save/Load buttons

**Actions:**
- Save network to localStorage
- Load saved network
- (Future) Export/Import, Settings

## State Management

### Game Store (`store/gameStore.ts`)

**State Structure:**
```typescript
{
  network: GameNetwork | null        // Current railway network
  currentTool: Tool                  // Active construction tool
  toolSettings: ToolSettings         // Tool-specific settings
  isToolMenuOpen: boolean           // Tools menu visibility
  selectedStationId: string | null  // Selected station
  selectedTrackId: string | null    // Selected track
  isDrawingTrack: boolean           // Track drawing mode
  trackDrawingPoints: Coordinates[] // Track waypoints
}
```

**Key Actions:**
- `setCurrentTool(tool)` - Switch active tool
- `addStation(station)` - Add new station
- `removeStation(id)` - Delete station + connected tracks
- `startDrawingTrack()` - Begin track drawing
- `finishDrawingTrack(track)` - Complete track
- `spendBudget(amount)` - Deduct from budget
- `saveToLocalStorage()` - Persist game
- `loadFromLocalStorage()` - Restore game

## API Integration

### API Client (`services/api.ts`)

**Endpoints Used:**

| Endpoint | Purpose | Input | Output |
|----------|---------|-------|--------|
| `POST /compute/distance` | Calculate distance between points | `{from, to}` | `{distanceKm, distanceMiles}` |
| `POST /compute/station-cost` | Calculate station cost | `{platforms, type, facilities}` | `{totalCost, breakdown}` |
| `POST /compute/track-cost` | Calculate track cost | `{trackType, waypoints, isDouble}` | `{totalCost, length, maintenance}` |
| `POST /compute/network-stats` | Get network statistics | `{stations, tracks}` | `{totalValue, revenue, expenses}` |

**Error Handling:**
- Custom `APIError` class
- User-friendly error messages
- Fallback for offline mode (localStorage only)

## User Workflows

### Building a Station

1. Click tools button (bottom-left)
2. Select "Station" tool
3. Configure: Type, Platforms, Facilities
4. Click on map where station should be placed
5. **Backend calculates cost** (offloaded computation)
6. If budget sufficient, station is placed
7. Budget is automatically deducted
8. Station appears on map with custom marker

### Drawing a Track

1. Select "Track" tool from menu
2. Configure: Track type, Single/Double
3. Click starting station/junction
4. Click intermediate waypoints (optional)
5. Click ending station/junction
6. **Backend calculates:**
   - Route length from waypoints
   - Construction cost
   - Annual maintenance
   - Terrain modifier
7. If budget sufficient, track is drawn
8. Track appears as colored polyline

### Saving/Loading

**Save:**
- Click "Save" button in top bar
- Network serialized to JSON
- Stored in browser localStorage
- Console confirmation message

**Load:**
- Click "Load" button
- Retrieves from localStorage
- Deserializes and restores state
- Map updates immediately

## Map Rendering

### OpenStreetMap Tiles

**Tile Provider:** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

**Attribution:** Required by OSM license

**Zoom Levels:**
- Min: 3 (World view)
- Max: 18 (Street detail)
- Default: 8 (Regional view)

**Default Center:** Netherlands/Belgium region (51.9°N, 4.5°E)

### Custom Markers

**Stations:**
- Circular colored markers
- Color based on type:
  - Local: Green
  - Regional: Blue
  - Intercity: Orange
  - Hub: Purple
- Size: 20×20px with white border
- Shows details on click

**Crossovers:**
- Small square markers (12×12px)
- Orange color
- Rounded corners

**Tracks:**
- Polylines connecting waypoints
- Width: 4px (single), 6px (double)
- Colors:
  - HST: Red (#ff0000)
  - IC: Blue (#0066cc)
  - Non-electric: Gray (#666666)

## Performance Optimizations

### Client-Side

**Lightweight:**
- Heavy computations offloaded to backend
- Minimal state in browser
- Only render visible map tiles
- Lazy load map markers

**RAM Usage:**
- < 100 MB typical
- Scales with network size
- No large arrays in memory
- Efficient Leaflet rendering

### API Calls

**Debounced:**
- Cost calculations on settings change
- Network stats refresh (30s interval)

**Batched:**
- Multiple cost calculations in single request (future)

### Map Rendering

**Leaflet Optimizations:**
- Canvas renderer for tracks (faster than SVG)
- Marker clustering for dense networks (future)
- Viewport-based rendering
- Tile caching

## Styling

### Dark Theme

**Colors:**
- Background: Gray-950 (#030712)
- Panels: Gray-900 (#111827)
- Text: White/Gray-100
- Accents: Blue-600, Green-400, Red-400

**Leaflet Customization:**
- Dark map background (#1a1a1a)
- Custom popup styles (dark gray)
- White text in popups
- Visible attribution

### Responsive Design

**Layout:**
- Flexbox for main structure
- Fixed top bar (auto height)
- Flex-1 map container (fills remaining)
- Floating tools menu (absolute positioning)

**Breakpoints:**
- Mobile: Tools menu collapses (future)
- Tablet: Same as desktop
- Desktop: Full layout

## Future Enhancements

### Phase 2
- Click-to-place station implementation
- Track drawing with waypoint support
- Cost preview before placing
- Undo/Redo functionality

### Phase 3
- Search for real cities
- Snap-to-city for stations
- Terrain-aware cost calculation
- Elevation profile viewer

### Phase 4
- Multiplayer support
- Real-time collaboration
- Shared networks
- Leaderboards

### Phase 5
- Train simulation
- Passenger demand visualization
- Revenue calculations
- Time progression

## Development Notes

### Adding New Tools

1. Add tool type to `types/index.ts`
2. Add icon + label to `ToolsMenu.tsx`
3. Add settings panel in `ToolsMenu.tsx`
4. Handle map clicks in `MapView.tsx` `MapEventHandler`
5. Add action to `gameStore.ts`

### Testing

**Manual:**
```bash
npm run dev
```
- Open http://localhost:5173
- Test each tool
- Verify API calls in Network tab
- Check localStorage persistence

**Unit Tests (Future):**
```bash
npm test
```

## Troubleshooting

### Map Not Loading

**Issue:** Blank gray area instead of map

**Solutions:**
- Check Leaflet CSS is imported
- Verify internet connection (OSM tiles)
- Check browser console for errors
- Clear browser cache

### Tools Not Working

**Issue:** Clicking on map does nothing

**Solution:**
- Check `currentTool` in DevTools
- Verify event handlers in `MapEventHandler`
- Check for JavaScript errors

### API Errors

**Issue:** Backend calls failing

**Solution:**
- Verify backend is running (port 3000)
- Check `.env` file has correct `VITE_API_URL`
- Check CORS settings in backend
- Review backend logs

### Performance Issues

**Issue:** Laggy map interaction

**Solution:**
- Reduce network size (fewer stations/tracks)
- Disable browser extensions
- Use Chrome/Firefox (better Leaflet performance)
- Check for memory leaks

## References

- [Leaflet Documentation](https://leafletjs.com/)
- [React Leaflet](https://react-leaflet.js.org/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Zustand](https://github.com/pmndrs/zustand)
