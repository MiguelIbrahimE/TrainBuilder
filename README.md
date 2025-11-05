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

### Main Menu
When you start the game, you'll see the main menu with options:
- **New Game**: Start a new railway network
- **Continue Game**: Load your last save (coming soon)
- **Options**: Configure game settings (coming soon)
- **Exit**: Quit the game

### Country Selection
1. Click "New Game" to see a list of 26 available countries
2. Scroll through the list with your mouse wheel
3. Click on any country to start building there
4. Each country has its own map bounds and starting position

### Building Your Network
1. **Place Stations**: Press 'S' and click on the map to place stations ($5,000 each)
2. **Draw Lines**: Press 'L', click one station, then click another to connect them
   - Cost is $1,000 per kilometer
3. **Watch Your Network**: Passengers will generate at stations
4. **Manage Economy**: Keep an eye on your budget in the top-left corner
5. **Return to Menu**: Press ESC to return to the main menu

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
- **Available Countries**: 26 countries including Netherlands, Belgium, UK, France, Germany, Italy, Spain, Japan, USA, and more
- **Map Filtering**: OSM tiles are rendered without pre-existing railway infrastructure

## License

Educational project - Feel free to use and modify!

## Credits

- Map tiles from OpenStreetMap contributors
- Built with SDL2 graphics library
