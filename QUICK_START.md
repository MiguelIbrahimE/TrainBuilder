# TrainBuilder - Quick Start

## What Changed?

### Before (OLD):
- Downloaded OpenStreetMap tiles (slow, ~30 seconds)
- 450%+ CPU usage
- Could freeze/crash
- Realistic map tiles

### Now (NEW):
- Instant procedural city generation
- 40-50% CPU usage
- Smooth 60 FPS
- Stylized subway-map look (like subwaybuilder.com)

## Running the Game

```bash
# Start the game
docker-compose -f docker-compose.vnc.yml up

# Connect to VNC
# Host: localhost:5900
# Password: trainbuilder
```

## Controls

- **S** - Place Station mode
- **L** - Draw Line mode
- **V** - View/Pan mode
- **Right-click + drag** - Pan the map
- **Mouse wheel** - Zoom in/out
- **ESC** - Return to main menu

## What You'll See

### Main Menu
- New Game
- Continue (not implemented yet)
- Options (not implemented yet)
- Exit

### Country Selection
- Scroll through 25+ countries
- Select one to start

### Gameplay
When you select a country, you'll see:

1. **Districts/Cities** (colored circles)
   - **Dark blue/gray** = High population (city centers)
   - **Light blue/gray** = Medium population (suburbs)
   - **Very light** = Low population (rural areas)

2. **Road Network** (gray lines)
   - Connects nearby districts
   - Different thickness based on importance

3. **Background** (light blue-gray)
   - Represents water/empty space

### Building Your Network

1. Press **S** to enter Station mode
2. Click on districts to place stations ($50,000 each)
3. Press **L** to enter Line Drawing mode
4. Click on two stations to connect them
5. Trains will eventually run on your lines!

## Next Features to Add

- Passenger simulation (people traveling between stations)
- Revenue system (earn money from passengers)
- Transit-style line coloring (red line, blue line, etc.)
- Analytics dashboard (ridership, delays, wait times)
- Time progression and challenges

## Troubleshooting

### Game won't start
```bash
docker-compose -f docker-compose.vnc.yml down -v
docker-compose -f docker-compose.vnc.yml build --no-cache
docker-compose -f docker-compose.vnc.yml up
```

### High CPU usage
- Should be ~40-50% when running
- If it's 400%+, the old code is cached - rebuild without cache

### VNC won't connect
- Make sure port 5900 is not in use
- Try restarting Docker

### Can't see anything
- The map generates cities procedurally
- Try zooming out (mouse wheel) to see more
- Pan around with right-click drag

## Performance Stats

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| CPU Usage | 450% | 40% | **11x better** |
| Load Time | 30s | instant | **instant** |
| Crash Risk | High | Low | **stable** |
| FPS | Variable | 60 | **smooth** |
