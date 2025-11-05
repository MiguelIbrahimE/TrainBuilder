#include "MapRenderer.h"
#include <SDL2/SDL_image.h>
#include <cmath>
#include <iostream>
#include <curl/curl.h>
#include <sys/stat.h>
#include <fstream>

MapRenderer::MapRenderer(SDL_Renderer* renderer)
    : renderer(renderer)
    , currentCountry("default")
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

    // Create data directory
    system("mkdir -p data");

    return true;
}

void MapRenderer::setCountry(const std::string& countryName) {
    currentCountry = countryName;
    // Create country-specific directory
    std::string cmd = "mkdir -p data/" + currentCountry;
    system(cmd.c_str());

    // Clear tile cache when switching countries
    for (auto& pair : tileCache) {
        if (pair.second) {
            SDL_DestroyTexture(pair.second);
        }
    }
    tileCache.clear();
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
    return "data/" + currentCountry + "/" + std::to_string(zoom) + "_" +
           std::to_string(x) + "_" + std::to_string(y) + ".png";
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

bool MapRenderer::tileExists(int zoom, int x, int y) {
    std::string path = getTilePath(zoom, x, y);
    struct stat buffer;
    return (stat(path.c_str(), &buffer) == 0);
}

bool MapRenderer::downloadTile(int zoom, int x, int y) {
    std::string url = getTileURL(zoom, x, y);
    std::string path = getTilePath(zoom, x, y);

    CURL* curl = curl_easy_init();
    if (!curl) {
        return false;
    }

    std::string readBuffer;
    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);
    curl_easy_setopt(curl, CURLOPT_USERAGENT, "TrainBuilder/1.0");
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L);

    CURLcode res = curl_easy_perform(curl);
    bool success = false;

    if (res == CURLE_OK) {
        // Save to file
        std::ofstream outFile(path, std::ios::binary);
        if (outFile) {
            outFile.write(readBuffer.c_str(), readBuffer.size());
            outFile.close();
            success = true;
        }
    } else {
        std::cerr << "Failed to download tile " << zoom << "/" << x << "/" << y
                  << ": " << curl_easy_strerror(res) << std::endl;
    }

    curl_easy_cleanup(curl);
    return success;
}

bool MapRenderer::preloadCountryTiles(const std::string& countryCode,
                                      double minLat, double maxLat,
                                      double minLon, double maxLon,
                                      int minZoom, int maxZoom,
                                      std::function<void(const TileDownloadProgress&)> progressCallback) {
    std::cout << "Pre-downloading tiles for " << countryCode << std::endl;
    std::cout << "Zoom levels: " << minZoom << " to " << maxZoom << std::endl;

    // Calculate total number of tiles
    int totalTiles = 0;
    for (int zoom = minZoom; zoom <= maxZoom; zoom++) {
        int minTileX, minTileY, maxTileX, maxTileY;
        latLonToTile(maxLat, minLon, zoom, minTileX, minTileY);
        latLonToTile(minLat, maxLon, zoom, maxTileX, maxTileY);

        int tilesX = maxTileX - minTileX + 1;
        int tilesY = maxTileY - minTileY + 1;
        totalTiles += tilesX * tilesY;
    }

    std::cout << "Total tiles to download: " << totalTiles << std::endl;

    int downloadedTiles = 0;
    TileDownloadProgress progress{totalTiles, 0, false};

    // Download tiles for each zoom level
    for (int zoom = minZoom; zoom <= maxZoom; zoom++) {
        int minTileX, minTileY, maxTileX, maxTileY;
        latLonToTile(maxLat, minLon, zoom, minTileX, minTileY);
        latLonToTile(minLat, maxLon, zoom, maxTileX, maxTileY);

        std::cout << "Zoom " << zoom << ": tiles " << minTileX << "-" << maxTileX
                  << ", " << minTileY << "-" << maxTileY << std::endl;

        for (int y = minTileY; y <= maxTileY; y++) {
            for (int x = minTileX; x <= maxTileX; x++) {
                // Skip if tile already exists
                if (!tileExists(zoom, x, y)) {
                    downloadTile(zoom, x, y);
                    // Add small delay to respect OSM tile usage policy
                    SDL_Delay(100);
                }

                downloadedTiles++;
                progress.downloadedTiles = downloadedTiles;

                if (progressCallback) {
                    progressCallback(progress);
                }

                // Print progress every 10 tiles
                if (downloadedTiles % 10 == 0) {
                    std::cout << "Progress: " << downloadedTiles << "/" << totalTiles
                              << " (" << (100 * downloadedTiles / totalTiles) << "%)" << std::endl;
                }
            }
        }
    }

    progress.isComplete = true;
    if (progressCallback) {
        progressCallback(progress);
    }

    std::cout << "Tile pre-loading complete!" << std::endl;
    return true;
}

SDL_Texture* MapRenderer::getTile(int zoom, int x, int y) {
    std::string key = std::to_string(zoom) + "_" + std::to_string(x) + "_" + std::to_string(y);

    // Check cache first
    auto it = tileCache.find(key);
    if (it != tileCache.end()) {
        return it->second;
    }

    std::string path = getTilePath(zoom, x, y);

    // NEVER download during rendering - only load existing files
    // Check if file exists
    if (!tileExists(zoom, x, y)) {
        // Return nullptr if tile doesn't exist - no download during render!
        return nullptr;
    }

    // Load texture from disk
    SDL_Surface* surface = IMG_Load(path.c_str());
    if (!surface) {
        // Silently fail - don't spam console during render
        return nullptr;
    }

    SDL_Texture* texture = SDL_CreateTextureFromSurface(renderer, surface);
    SDL_FreeSurface(surface);

    if (texture) {
        tileCache[key] = texture;
    }

    return texture;
}
