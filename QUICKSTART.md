# Train Builder - Quick Start Guide

Get started in 2 minutes!

## The Absolute Fastest Way

```bash
# 1. Make sure Docker is running (check Docker Desktop icon)

# 2. Run this one command:
make docker-vnc

# 3. Connect with VNC:
#    - macOS: Press Cmd+K in Finder, enter: vnc://localhost:5900
#    - Password: trainbuilder
```

That's it! You're playing the game.

## What You'll See

1. A map centered on Amsterdam, Netherlands
2. A black UI panel in the top-left showing your budget
3. Real OpenStreetMap tiles loading

## How to Play (First 5 Minutes)

### Step 1: Place Your First Station
- Press `S` key (Station mode)
- Click anywhere on the map
- You just spent $5,000!

### Step 2: Place a Second Station
- Click somewhere else on the map
- Another $5,000 spent

### Step 3: Connect Them
- Press `L` key (Line mode)
- Click the first station (red square)
- Click the second station
- A blue line appears! This cost varies by distance ($1,000/km)

### Step 4: Watch It Work
- Press `V` key (View mode)
- Stations automatically generate passengers every 2 seconds
- (Trains will be visible in future updates)

### Other Controls
- **Right-click + Drag**: Pan the map
- **Mouse Wheel**: Zoom in/out
- **ESC**: Exit game

## Your Budget

- Starting money: **$100,000**
- Station cost: **$5,000** (one-time)
- Line cost: **$1,000/km** (one-time)
- Monthly maintenance: Auto-deducted every 30 seconds

## Locations to Try

Change the map location in `src/Game.cpp` lines 17-18:

| City | Latitude | Longitude |
|------|----------|-----------|
| Amsterdam | 52.3676 | 4.9041 |
| London | 51.5074 | -0.1278 |
| Paris | 48.8566 | 2.3522 |
| Tokyo | 35.6762 | 139.6503 |
| New York | 40.7128 | -74.0060 |

Then rebuild: `make docker-vnc`

## Common Issues

**Can't connect to VNC?**
- Make sure Docker container is running (check terminal)
- Port 5900 might be in use: `lsof -i :5900`

**Game is slow?**
- VNC has lower FPS (~30-40)
- Try X11 method: `make docker-x11` (requires XQuartz)
- Or build natively: `make run`

**No map tiles?**
- First load downloads tiles (needs internet)
- Tiles cache in `./tiles` directory
- Try zooming/panning to trigger downloads

**Want better performance?**
- See [DOCKER.md](DOCKER.md) for X11 setup
- Or build natively (see [README.md](README.md))

## Next Steps

1. **Read the full docs**: [README.md](README.md)
2. **Understand Docker setup**: [DOCKER.md](DOCKER.md)
3. **Build natively for speed**: `make run`
4. **Contribute features**: See Future Enhancements in README

## Command Cheat Sheet

```bash
make docker-vnc   # Run with VNC (easiest)
make docker-x11   # Run with X11 (faster)
make run          # Build and run natively (fastest)
make clean        # Clean build files
make docker-stop  # Stop Docker containers
make help         # Show all commands
```

---

**Questions?** Open an issue on GitHub or check the documentation!
