# Docker Setup Guide

This guide explains how to run Train Builder using Docker.

## Why Docker?

- No need to install SDL2, CMake, or other dependencies
- Consistent environment across different systems
- Easy to set up and run

## Two Methods Available

### Method 1: VNC (Recommended for Beginners)

**Pros:**
- Easiest setup
- No X11 configuration needed
- Works on any OS
- Can connect from web browser

**Cons:**
- Slightly lower performance
- Requires VNC client

**Setup:**

1. Make sure Docker is running:
   ```bash
   docker --version
   ```

2. Start the game with VNC:
   ```bash
   docker-compose -f docker-compose.vnc.yml up --build
   ```

3. Connect with VNC:
   - **macOS**:
     - Open Finder
     - Press `Cmd+K`
     - Enter: `vnc://localhost:5900`
     - Password: `trainbuilder`

   - **Windows/Linux**:
     - Download [RealVNC Viewer](https://www.realvnc.com/en/connect/download/viewer/)
     - Connect to `localhost:5900`
     - Password: `trainbuilder`

4. Play the game!

5. To stop:
   - Close the VNC window
   - Press `Ctrl+C` in the terminal

### Method 2: X11 (Better Performance)

**Pros:**
- Better performance
- Native rendering
- Lower latency

**Cons:**
- Requires XQuartz on macOS
- More complex setup

**macOS Setup:**

1. Install XQuartz:
   ```bash
   brew install --cask xquartz
   ```

2. Open XQuartz and configure:
   - Launch XQuartz from Applications > Utilities
   - Go to XQuartz > Preferences > Security tab
   - Enable: "Allow connections from network clients"
   - Quit and restart XQuartz

3. Run the game:
   ```bash
   ./run-docker.sh
   ```

**Linux Setup:**

1. Just run:
   ```bash
   ./run-docker.sh
   ```

## Troubleshooting

### VNC Connection Refused
- Make sure the Docker container is running
- Check that port 5900 is not already in use:
  ```bash
  lsof -i :5900
  ```

### X11 "Cannot open display"
- Make sure XQuartz is running
- Check that you've enabled "Allow connections from network clients"
- Try restarting XQuartz
- Run `xhost` to verify your IP is allowed

### Game runs but no map tiles appear
- The game downloads tiles on first use
- Check your internet connection
- Tiles are cached in `./tiles` directory
- Try zooming in/out or panning the map

### Docker build fails
- Make sure you have enough disk space
- Try cleaning Docker cache:
  ```bash
  docker system prune -a
  ```

### Slow performance in VNC
- This is normal for VNC
- Try the X11 method instead for better performance
- Or build natively without Docker

## Advanced Usage

### Using custom map location

Edit `src/Game.cpp` line 17-18 to change the default location:

```cpp
, mapCenterLat(52.3676)  // Your latitude
, mapCenterLon(4.9041)   // Your longitude
```

Then rebuild:
```bash
docker-compose -f docker-compose.vnc.yml up --build
```

### Persisting game data

Map tiles are automatically persisted in the `./tiles` directory. This means:
- Tiles are only downloaded once
- Faster startup after first run
- Can be shared between native and Docker builds

### Viewing logs

```bash
# Follow logs in real-time
docker-compose -f docker-compose.vnc.yml logs -f

# View container status
docker ps

# Access container shell (while running)
docker exec -it trainbuilder-game-vnc /bin/bash
```

### Stopping the game

```bash
# Stop containers
docker-compose -f docker-compose.vnc.yml down

# Stop and remove volumes
docker-compose -f docker-compose.vnc.yml down -v
```

## File Structure

```
TrainBuilder/
├── Dockerfile              # X11 version
├── Dockerfile.vnc          # VNC version (easier)
├── docker-compose.yml      # X11 compose file
├── docker-compose.vnc.yml  # VNC compose file
├── run-docker.sh           # Helper script for X11
└── tiles/                  # Downloaded map tiles (auto-created)
```

## Performance Comparison

| Method | Startup Time | FPS | Ease of Setup |
|--------|-------------|-----|---------------|
| Native | Fast | 60+ | Medium |
| Docker X11 | Medium | 50-60 | Hard (macOS) |
| Docker VNC | Medium | 30-40 | Easy |

## Next Steps

Once the game is running, check out the main [README.md](README.md) for:
- Game controls
- How to play
- Game mechanics
- Building from source
