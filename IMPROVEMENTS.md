# TrainBuilder Improvements

## Performance Fixes (Nov 5, 2025)

### Problem
- Game was downloading OpenStreetMap tiles during render loop (blocking)
- Caused freezing/hanging with 450%+ CPU usage
- Slow startup times (tile downloads)

### Solution: New CityRenderer System

#### 1. Replaced MapRenderer with CityRenderer
- **No more downloads!** Instant city generation
- Procedural city/district generation based on real country bounds
- Stylized rendering similar to subwaybuilder.com

#### 2. Features
- **Population-based districts**: Major cities, suburbs, and rural areas
- **Color-coded by density**: Darker areas = higher population
- **Road network**: Connects nearby districts
- **Fast rendering**: Optimized scanline circle fill algorithm

#### 3. Performance Optimizations
- Frame rate limiting to 60 FPS
- Culling off-screen districts
- Scanline rendering instead of pixel-by-pixel
- Reduced circle segments for borders

#### 4. Results
- **CPU usage**: 450% → 51% ✅
- **Load time**: 10-30 seconds → instant ✅
- **Smooth gameplay**: 60 FPS ✅

## Architecture

### Old System
```
MapRenderer → Download OSM tiles → Cache → Render
                   ↓ (SLOW, BLOCKING)
```

### New System
```
CityRenderer → Generate procedural city → Render
                   ↓ (INSTANT)
```

## Files Changed
- `src/CityRenderer.cpp` - New stylized city renderer
- `include/CityRenderer.h` - City renderer interface
- `src/Game.cpp` - Updated to use CityRenderer
- `include/Game.h` - Replaced MapRenderer with CityRenderer
- `CMakeLists.txt` - Updated build configuration

## Next Steps (Subway Builder Features)

1. **Passenger Simulation**
   - Generate passengers at districts
   - Pathfinding between stations
   - Wait times and delays tracking

2. **Transit-Style Lines**
   - Straight/diagonal line snapping
   - Multiple colored lines
   - Transfer stations

3. **Analytics Dashboard**
   - Ridership statistics
   - Revenue tracking
   - Network efficiency metrics

4. **Game Balance**
   - Construction costs based on distance
   - Revenue based on passengers carried
   - Time progression and challenges

## Running the Game

```bash
# Start the game with VNC
docker-compose -f docker-compose.vnc.yml up

# Connect to VNC
# Host: localhost:5900
# Password: trainbuilder
```

## Controls
- **S** - Place Station mode
- **L** - Draw Line mode
- **V** - View mode
- **Right-click + drag** - Pan map
- **Mouse wheel** - Zoom in/out
- **ESC** - Return to menu
