#pragma once

#include <SDL2/SDL.h>
#include <vector>
#include <string>

struct District {
    double lat;
    double lon;
    double radius; // in km
    int population;
    std::string name;

    // Color based on population density
    SDL_Color getColor() const;
};

struct Road {
    double lat1, lon1;
    double lat2, lon2;
    int importance; // 1=highway, 2=major, 3=minor
};

class CityRenderer {
public:
    CityRenderer(SDL_Renderer* renderer);
    ~CityRenderer();

    void generateCity(const std::string& countryCode,
                     double minLat, double maxLat,
                     double minLon, double maxLon);

    void render(double centerLat, double centerLon, int zoom);

    // Coordinate conversions
    struct ScreenPos { int x, y; };
    ScreenPos latLonToScreen(double lat, double lon, double centerLat, double centerLon, int zoom);
    struct LatLon { double lat, lon; };
    LatLon screenToLatLon(int x, int y, double centerLat, double centerLon, int zoom);

    const std::vector<District>& getDistricts() const { return districts; }

private:
    SDL_Renderer* renderer;
    std::vector<District> districts;
    std::vector<Road> roads;

    const int SCREEN_WIDTH = 1280;
    const int SCREEN_HEIGHT = 720;

    void generateDistricts(double minLat, double maxLat, double minLon, double maxLon);
    void generateRoads();
};
