# Train Builder - Economic Simulator

A real-time train network building and economic management game using OpenStreetMap data.

## Features

- **Real-world maps**: Uses OpenStreetMap tiles for authentic geography
- **Station building**: Place train stations anywhere on the map
- **Network creation**: Connect stations with railway lines
- **Economic simulation**: Manage your budget, build costs, and revenue
- **Real-time trains**: Watch trains run on your network
- **Passenger flow**: Stations generate passengers who travel on your network

## Controls

### Mouse Controls
- **Right-click + Drag**: Pan the map
- **Mouse Wheel**: Zoom in/out
- **Left-click**: Place station or draw line (depending on mode)

### Keyboard Controls
- **S**: Switch to Station Placement mode
- **L**: Switch to Line Drawing mode
- **V**: Switch to View mode (pan and zoom only)
- **ESC**: Exit game

## How to Play

1. **Start in View Mode**: Pan and zoom to find your area
2. **Place Stations**: Press 'S' and click on the map to place stations ($5,000 each)
3. **Draw Lines**: Press 'L', click one station, then click another to connect them
   - Cost is $1,000 per kilometer
4. **Watch Your Network**: Passengers will generate at stations
5. **Manage Economy**: Keep an eye on your budget in the top-left corner

## Quick Start with Docker (Recommended)

### Option 1: VNC Method (Easiest - No X11 Setup Required)

This method runs the game in a container with VNC server, accessible from any VNC client:

```bash
# Build and run with VNC
docker-compose -f docker-compose.vnc.yml up --build
```

Then connect to the game:
1. Open a VNC client (macOS has built-in Screen Sharing, or download RealVNC Viewer)
2. Connect to: `localhost:5900`
3. Password: `trainbuilder`
4. Play the game!

To stop: Press `Ctrl+C` in the terminal

### Option 2: X11 Method (Better Performance)

**macOS Setup:**
1. Install XQuartz:
   ```bash
   brew install --cask xquartz
   ```

2. Configure XQuartz:
   - Open XQuartz (Applications > Utilities > XQuartz)
   - Go to XQuartz > Preferences > Security
   - Check "Allow connections from network clients"
   - Restart XQuartz

3. Run the game:
   ```bash
   ./run-docker.sh
   ```

**Linux Setup:**
```bash
./run-docker.sh
```

## Building from Source (Without Docker)

### Prerequisites

You need the following libraries installed:

**On macOS (using Homebrew):**
```bash
brew install sdl2 sdl2_image sdl2_ttf curl cmake
```

**On Ubuntu/Debian:**
```bash
sudo apt-get install libsdl2-dev libsdl2-image-dev libsdl2-ttf-dev libcurl4-openssl-dev cmake build-essential
```

**On Windows:**
- Install vcpkg and run:
```bash
vcpkg install sdl2 sdl2-image sdl2-ttf curl
```

### Compilation

```bash
# Create build directory
mkdir build
cd build

# Generate build files
cmake ..

# Compile
make

# Run the game
./TrainBuilder
```

## Game Mechanics

### Economy
- **Starting money**: $100,000
- **Station build cost**: $5,000
- **Station maintenance**: $100/month
- **Line build cost**: $1,000/km
- **Line maintenance**: $10/km/month
- **Revenue**: $0.50 per passenger per km traveled

### Stations
- Generate 5 passengers every 2 seconds
- Can be connected to multiple lines
- Passengers accumulate if no trains service them

### Trains
- Default speed: 80 km/h
- Automatically shuttle between connected stations
- Will be implemented in future updates to pick up/drop off passengers

## Future Enhancements

- [ ] Train purchasing and deployment
- [ ] Passenger destination logic
- [ ] Multiple train types (local, express, freight)
- [ ] City population data integration
- [ ] Save/load game functionality
- [ ] More detailed economic statistics
- [ ] Sound effects and music
- [ ] Tunnel and bridge costs
- [ ] Terrain-based cost modifiers

## Technical Details

- **Language**: C++17
- **Graphics**: SDL2
- **Map Data**: OpenStreetMap (tile.openstreetmap.org)
- **Coordinate System**: WGS84 (lat/lon)
- **Default Location**: Amsterdam, Netherlands (52.3676°N, 4.9041°E)

## License

Educational project - Feel free to use and modify!

## Credits

- Map tiles from OpenStreetMap contributors
- Built with SDL2 graphics library
