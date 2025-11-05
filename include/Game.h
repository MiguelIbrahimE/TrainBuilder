#pragma once

#include <SDL2/SDL.h>
#include <memory>
#include <vector>
#include "MapRenderer.h"
#include "Station.h"
#include "TrainLine.h"
#include "Economy.h"
#include "Train.h"

class Game {
public:
    Game();
    ~Game();

    bool init();
    void run();
    void cleanup();

private:
    void handleEvents();
    void update(float deltaTime);
    void render();

    void handleMouseClick(int x, int y, bool leftClick);
    void handleMouseDrag(int x, int y);
    void handleMouseRelease(int x, int y);

    SDL_Window* window;
    SDL_Renderer* renderer;
    bool running;

    std::unique_ptr<MapRenderer> mapRenderer;
    std::unique_ptr<Economy> economy;

    std::vector<Station> stations;
    std::vector<TrainLine> trainLines;
    std::vector<Train> trains;

    // UI state
    enum class Mode {
        VIEW,
        PLACE_STATION,
        DRAW_LINE
    };

    Mode currentMode;
    Station* selectedStation;
    bool isDragging;
    int dragStartX, dragStartY;

    // Map state
    double mapCenterLat;
    double mapCenterLon;
    int zoomLevel;
};
