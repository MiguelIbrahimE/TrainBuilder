#include "MapRenderer.h"
#include <SDL2/SDL_image.h>
#include <cmath>
#include <iostream>
#include <curl/curl.h>
#include <sys/stat.h>
#include <fstream>

MapRenderer::MapRenderer(SDL_Renderer* renderer)
    : renderer(renderer)
{}

MapRenderer::~MapRenderer() {
    // Clean up tile cache
    for (auto& pair : tileCache) {
        if (pair.second) {
            SDL_DestroyTexture(pair.second);
        }
    }
    tileCache.clear();
}

bool MapRenderer::init(double centerLat, double centerLon, int zoom) {
    // Initialize SDL_image for PNG support
    int imgFlags = IMG_INIT_PNG;
    if (!(IMG_Init(imgFlags) & imgFlags)) {
        std::cerr << "SDL_image could not initialize! SDL_image Error: " << IMG_GetError() << std::endl;
        return false;
    }

    // Create tiles directory
    system("mkdir -p tiles");

    return true;
}

void MapRenderer::render(double centerLat, double centerLon, int zoom) {
    int centerTileX, centerTileY;
    latLonToTile(centerLat, centerLon, zoom, centerTileX, centerTileY);

    // Calculate how many tiles we need to cover the screen
    int tilesX = (SCREEN_WIDTH / TILE_SIZE) + 2;
    int tilesY = (SCREEN_HEIGHT / TILE_SIZE) + 2;

    // Calculate offset within the center tile
    double n = pow(2.0, zoom);
    double exactX = (centerLon + 180.0) / 360.0 * n;
    double latRad = centerLat * M_PI / 180.0;
    double exactY = (1.0 - log(tan(latRad) + 1.0 / cos(latRad)) / M_PI) / 2.0 * n;

    int pixelOffsetX = (int)((exactX - centerTileX) * TILE_SIZE);
    int pixelOffsetY = (int)((exactY - centerTileY) * TILE_SIZE);

    // Render tiles
    for (int dy = -tilesY/2; dy <= tilesY/2; dy++) {
        for (int dx = -tilesX/2; dx <= tilesX/2; dx++) {
            int tileX = centerTileX + dx;
            int tileY = centerTileY + dy;

            // Wrap tile X coordinate
            int maxTile = pow(2, zoom);
            tileX = (tileX % maxTile + maxTile) % maxTile;

            if (tileY < 0 || tileY >= maxTile) continue;

            SDL_Texture* tile = getTile(zoom, tileX, tileY);
            if (tile) {
                SDL_Rect destRect;
                destRect.x = SCREEN_WIDTH/2 + dx * TILE_SIZE - pixelOffsetX;
                destRect.y = SCREEN_HEIGHT/2 + dy * TILE_SIZE - pixelOffsetY;
                destRect.w = TILE_SIZE;
                destRect.h = TILE_SIZE;

                SDL_RenderCopy(renderer, tile, nullptr, &destRect);
            }
        }
    }
}

ScreenCoordinate MapRenderer::latLonToScreen(double lat, double lon, double centerLat, double centerLon, int zoom) {
    double n = pow(2.0, zoom);

    // Convert lat/lon to tile coordinates (floating point)
    double x1 = (lon + 180.0) / 360.0 * n;
    double latRad1 = lat * M_PI / 180.0;
    double y1 = (1.0 - log(tan(latRad1) + 1.0 / cos(latRad1)) / M_PI) / 2.0 * n;

    double x2 = (centerLon + 180.0) / 360.0 * n;
    double latRad2 = centerLat * M_PI / 180.0;
    double y2 = (1.0 - log(tan(latRad2) + 1.0 / cos(latRad2)) / M_PI) / 2.0 * n;

    ScreenCoordinate result;
    result.x = SCREEN_WIDTH/2 + (int)((x1 - x2) * TILE_SIZE);
    result.y = SCREEN_HEIGHT/2 + (int)((y1 - y2) * TILE_SIZE);

    return result;
}

MapCoordinate MapRenderer::screenToLatLon(int x, int y, double centerLat, double centerLon, int zoom) {
    double n = pow(2.0, zoom);

    // Convert center to tile coordinates
    double centerX = (centerLon + 180.0) / 360.0 * n;
    double latRad = centerLat * M_PI / 180.0;
    double centerY = (1.0 - log(tan(latRad) + 1.0 / cos(latRad)) / M_PI) / 2.0 * n;

    // Convert screen offset to tile offset
    double dx = (x - SCREEN_WIDTH/2) / (double)TILE_SIZE;
    double dy = (y - SCREEN_HEIGHT/2) / (double)TILE_SIZE;

    double tileX = centerX + dx;
    double tileY = centerY + dy;

    // Convert back to lat/lon
    MapCoordinate result;
    result.lon = tileX / n * 360.0 - 180.0;

    double yTile = tileY / n;
    result.lat = atan(sinh(M_PI * (1 - 2 * yTile))) * 180.0 / M_PI;

    return result;
}

void MapRenderer::latLonToTile(double lat, double lon, int zoom, int& tileX, int& tileY) {
    double n = pow(2.0, zoom);
    tileX = (int)((lon + 180.0) / 360.0 * n);

    double latRad = lat * M_PI / 180.0;
    tileY = (int)((1.0 - log(tan(latRad) + 1.0 / cos(latRad)) / M_PI) / 2.0 * n);
}

std::string MapRenderer::getTilePath(int zoom, int x, int y) {
    return "tiles/" + std::to_string(zoom) + "_" + std::to_string(x) + "_" + std::to_string(y) + ".png";
}

std::string MapRenderer::getTileURL(int zoom, int x, int y) {
    // Using OpenStreetMap tile server
    return "https://tile.openstreetmap.org/" + std::to_string(zoom) + "/" +
           std::to_string(x) + "/" + std::to_string(y) + ".png";
}

// Callback for CURL to write data
static size_t WriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    ((std::string*)userp)->append((char*)contents, size * nmemb);
    return size * nmemb;
}

void MapRenderer::downloadTile(int zoom, int x, int y) {
    std::string url = getTileURL(zoom, x, y);
    std::string path = getTilePath(zoom, x, y);

    CURL* curl = curl_easy_init();
    if (curl) {
        std::string readBuffer;
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);
        curl_easy_setopt(curl, CURLOPT_USERAGENT, "TrainBuilder/1.0");
        curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);

        CURLcode res = curl_easy_perform(curl);
        if (res == CURLE_OK) {
            // Save to file
            std::ofstream outFile(path, std::ios::binary);
            outFile.write(readBuffer.c_str(), readBuffer.size());
            outFile.close();
        } else {
            std::cerr << "Failed to download tile: " << curl_easy_strerror(res) << std::endl;
        }

        curl_easy_cleanup(curl);
    }
}

SDL_Texture* MapRenderer::getTile(int zoom, int x, int y) {
    std::string key = std::to_string(zoom) + "_" + std::to_string(x) + "_" + std::to_string(y);

    // Check cache first
    auto it = tileCache.find(key);
    if (it != tileCache.end()) {
        return it->second;
    }

    std::string path = getTilePath(zoom, x, y);

    // Check if file exists
    struct stat buffer;
    if (stat(path.c_str(), &buffer) != 0) {
        // Download tile
        downloadTile(zoom, x, y);
    }

    // Load texture
    SDL_Surface* surface = IMG_Load(path.c_str());
    if (!surface) {
        std::cerr << "Failed to load tile: " << path << " - " << IMG_GetError() << std::endl;
        return nullptr;
    }

    SDL_Texture* texture = SDL_CreateTextureFromSurface(renderer, surface);
    SDL_FreeSurface(surface);

    if (texture) {
        tileCache[key] = texture;
    }

    return texture;
}
