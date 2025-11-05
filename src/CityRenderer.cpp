#include "CityRenderer.h"
#include <cmath>
#include <random>
#include <algorithm>

SDL_Color District::getColor() const {
    // Color based on population density (darker = more dense)
    int density = std::min(255, population / 1000);
    return {
        static_cast<Uint8>(200 - density/2),
        static_cast<Uint8>(200 - density/2),
        static_cast<Uint8>(220 - density/3),
        255
    };
}

CityRenderer::CityRenderer(SDL_Renderer* renderer)
    : renderer(renderer)
{}

CityRenderer::~CityRenderer() {
    districts.clear();
    roads.clear();
}

void CityRenderer::generateCity(const std::string& countryCode,
                                double minLat, double maxLat,
                                double minLon, double maxLon) {
    districts.clear();
    roads.clear();

    generateDistricts(minLat, maxLat, minLon, maxLon);
    generateRoads();
}

void CityRenderer::generateDistricts(double minLat, double maxLat,
                                     double minLon, double maxLon) {
    std::random_device rd;
    std::mt19937 gen(rd());

    // Calculate area dimensions
    double latRange = maxLat - minLat;
    double lonRange = maxLon - minLon;

    // Generate major city centers (high population)
    int numMajorCities = std::max(3, (int)(latRange * lonRange * 2));
    for (int i = 0; i < numMajorCities; i++) {
        std::uniform_real_distribution<> latDist(minLat + latRange * 0.1, maxLat - latRange * 0.1);
        std::uniform_real_distribution<> lonDist(minLon + lonRange * 0.1, maxLon - lonRange * 0.1);
        std::uniform_int_distribution<> popDist(50000, 500000);

        District d;
        d.lat = latDist(gen);
        d.lon = lonDist(gen);
        d.radius = 5.0 + (latRange * 20); // Adjust radius based on country size
        d.population = popDist(gen);
        d.name = "City " + std::to_string(i + 1);
        districts.push_back(d);
    }

    // Generate suburban areas (medium population)
    int numSuburbs = numMajorCities * 2;
    for (int i = 0; i < numSuburbs; i++) {
        std::uniform_real_distribution<> latDist(minLat, maxLat);
        std::uniform_real_distribution<> lonDist(minLon, maxLon);
        std::uniform_int_distribution<> popDist(10000, 80000);

        District d;
        d.lat = latDist(gen);
        d.lon = lonDist(gen);
        d.radius = 3.0 + (latRange * 10);
        d.population = popDist(gen);
        d.name = "Suburb " + std::to_string(i + 1);
        districts.push_back(d);
    }

    // Generate rural areas (low population)
    int numRural = numMajorCities * 3;
    for (int i = 0; i < numRural; i++) {
        std::uniform_real_distribution<> latDist(minLat, maxLat);
        std::uniform_real_distribution<> lonDist(minLon, maxLon);
        std::uniform_int_distribution<> popDist(1000, 15000);

        District d;
        d.lat = latDist(gen);
        d.lon = lonDist(gen);
        d.radius = 2.0 + (latRange * 5);
        d.population = popDist(gen);
        d.name = "Town " + std::to_string(i + 1);
        districts.push_back(d);
    }
}

void CityRenderer::generateRoads() {
    // Generate connecting roads between nearby districts
    for (size_t i = 0; i < districts.size(); i++) {
        for (size_t j = i + 1; j < districts.size(); j++) {
            double dist = sqrt(
                pow(districts[i].lat - districts[j].lat, 2) +
                pow(districts[i].lon - districts[j].lon, 2)
            );

            // Connect nearby districts with roads
            if (dist < 0.5) { // Adjust threshold based on scale
                Road r;
                r.lat1 = districts[i].lat;
                r.lon1 = districts[i].lon;
                r.lat2 = districts[j].lat;
                r.lon2 = districts[j].lon;

                // Importance based on combined population
                int totalPop = districts[i].population + districts[j].population;
                r.importance = (totalPop > 400000) ? 1 : (totalPop > 100000) ? 2 : 3;

                roads.push_back(r);
            }
        }
    }
}

CityRenderer::ScreenPos CityRenderer::latLonToScreen(double lat, double lon,
                                                     double centerLat, double centerLon, int zoom) {
    // Simple mercator-like projection
    double scale = pow(2.0, zoom) * 100000;

    int x = SCREEN_WIDTH/2 + (int)((lon - centerLon) * scale);
    int y = SCREEN_HEIGHT/2 - (int)((lat - centerLat) * scale);

    return {x, y};
}

CityRenderer::LatLon CityRenderer::screenToLatLon(int x, int y,
                                                  double centerLat, double centerLon, int zoom) {
    double scale = pow(2.0, zoom) * 100000;

    double lon = centerLon + (x - SCREEN_WIDTH/2) / scale;
    double lat = centerLat - (y - SCREEN_HEIGHT/2) / scale;

    return {lat, lon};
}

void CityRenderer::render(double centerLat, double centerLon, int zoom) {
    // Draw background (water/land)
    SDL_SetRenderDrawColor(renderer, 220, 230, 240, 255); // Light blue-gray
    SDL_RenderClear(renderer);

    // Draw roads first (underneath districts)
    for (const auto& road : roads) {
        auto pos1 = latLonToScreen(road.lat1, road.lon1, centerLat, centerLon, zoom);
        auto pos2 = latLonToScreen(road.lat2, road.lon2, centerLat, centerLon, zoom);

        // Color and thickness based on importance
        if (road.importance == 1) {
            SDL_SetRenderDrawColor(renderer, 100, 100, 100, 255);
        } else if (road.importance == 2) {
            SDL_SetRenderDrawColor(renderer, 140, 140, 140, 255);
        } else {
            SDL_SetRenderDrawColor(renderer, 180, 180, 180, 255);
        }

        SDL_RenderDrawLine(renderer, pos1.x, pos1.y, pos2.x, pos2.y);
    }

    // Draw districts as circles (optimized - use SDL_Rect or scanline fill)
    for (const auto& district : districts) {
        auto center = latLonToScreen(district.lat, district.lon, centerLat, centerLon, zoom);

        // Skip if off-screen
        if (center.x < -200 || center.x > SCREEN_WIDTH + 200 ||
            center.y < -200 || center.y > SCREEN_HEIGHT + 200) {
            continue;
        }

        // Calculate radius in pixels based on zoom and actual radius
        int pixelRadius = (int)(district.radius * pow(2.0, zoom) * 2000);
        pixelRadius = std::max(5, std::min(100, pixelRadius)); // Clamp size

        // Draw filled circle using scanline algorithm (much faster)
        SDL_Color color = district.getColor();
        SDL_SetRenderDrawColor(renderer, color.r, color.g, color.b, color.a);

        for (int y = -pixelRadius; y <= pixelRadius; y++) {
            int width = (int)sqrt(pixelRadius * pixelRadius - y * y);
            SDL_RenderDrawLine(renderer,
                              center.x - width, center.y + y,
                              center.x + width, center.y + y);
        }

        // Draw district border (simplified)
        SDL_SetRenderDrawColor(renderer, 80, 80, 100, 255);
        int segments = 24; // Reduced from 32 for performance
        for (int i = 0; i < segments; i++) {
            double angle1 = (2 * M_PI * i) / segments;
            double angle2 = (2 * M_PI * (i + 1)) / segments;

            int x1 = center.x + (int)(pixelRadius * cos(angle1));
            int y1 = center.y + (int)(pixelRadius * sin(angle1));
            int x2 = center.x + (int)(pixelRadius * cos(angle2));
            int y2 = center.y + (int)(pixelRadius * sin(angle2));

            SDL_RenderDrawLine(renderer, x1, y1, x2, y2);
        }
    }
}
