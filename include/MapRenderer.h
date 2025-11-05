#pragma once

#include <SDL2/SDL.h>
#include <string>
#include <map>
#include <memory>

struct MapCoordinate {
    double lat;
    double lon;
};

struct ScreenCoordinate {
    int x;
    int y;
};

class MapRenderer {
public:
    MapRenderer(SDL_Renderer* renderer);
    ~MapRenderer();

    bool init(double centerLat, double centerLon, int zoom);
    void render(double centerLat, double centerLon, int zoom);

    // Coordinate conversions
    ScreenCoordinate latLonToScreen(double lat, double lon, double centerLat, double centerLon, int zoom);
    MapCoordinate screenToLatLon(int x, int y, double centerLat, double centerLon, int zoom);

    // Tile management
    SDL_Texture* getTile(int zoom, int x, int y);
    void downloadTile(int zoom, int x, int y);

private:
    SDL_Renderer* renderer;
    std::map<std::string, SDL_Texture*> tileCache;

    const int TILE_SIZE = 256;
    const int SCREEN_WIDTH = 1280;
    const int SCREEN_HEIGHT = 720;

    // Helper functions
    void latLonToTile(double lat, double lon, int zoom, int& tileX, int& tileY);
    std::string getTilePath(int zoom, int x, int y);
    std::string getTileURL(int zoom, int x, int y);
};
