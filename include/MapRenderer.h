#pragma once

#include <SDL2/SDL.h>
#include <string>
#include <map>
#include <memory>
#include <functional>

struct MapCoordinate {
    double lat;
    double lon;
};

struct ScreenCoordinate {
    int x;
    int y;
};

struct TileDownloadProgress {
    int totalTiles;
    int downloadedTiles;
    bool isComplete;
};

class MapRenderer {
public:
    MapRenderer(SDL_Renderer* renderer);
    ~MapRenderer();

    bool init(double centerLat, double centerLon, int zoom);
    void setCountry(const std::string& countryName);
    void render(double centerLat, double centerLon, int zoom);

    // Pre-download tiles for a country
    bool preloadCountryTiles(const std::string& countryCode,
                            double minLat, double maxLat,
                            double minLon, double maxLon,
                            int minZoom, int maxZoom,
                            std::function<void(const TileDownloadProgress&)> progressCallback = nullptr);

    // Coordinate conversions
    ScreenCoordinate latLonToScreen(double lat, double lon, double centerLat, double centerLon, int zoom);
    MapCoordinate screenToLatLon(int x, int y, double centerLat, double centerLon, int zoom);

    // Tile management
    SDL_Texture* getTile(int zoom, int x, int y);

private:
    SDL_Renderer* renderer;
    std::map<std::string, SDL_Texture*> tileCache;
    std::string currentCountry;

    const int TILE_SIZE = 256;
    const int SCREEN_WIDTH = 1280;
    const int SCREEN_HEIGHT = 720;

    // Helper functions
    void latLonToTile(double lat, double lon, int zoom, int& tileX, int& tileY);
    std::string getTilePath(int zoom, int x, int y);
    std::string getTileURL(int zoom, int x, int y);
    bool downloadTile(int zoom, int x, int y);
    bool tileExists(int zoom, int x, int y);
};
