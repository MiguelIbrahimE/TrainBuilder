#pragma once

#include <SDL2/SDL.h>
#include <memory>
#include <vector>
#include "MapRenderer.h"
#include "Station.h"
#include "TrainLine.h"
#include "Economy.h"
#include "Train.h"
#include "GameState.h"
#include "UI.h"

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

    // Event handlers
    void handleMouseClick(int x, int y, bool leftClick);
    void handleMouseDrag(int x, int y);
    void handleMouseRelease(int x, int y);
    void handleKeyPress(SDL_Keycode key);

    // State-specific handlers
    void handleMainMenuClick(int x, int y);
    void handleCountrySelectClick(int x, int y);
    void handleGameplayClick(int x, int y, bool leftClick);

    // State-specific rendering
    void renderMainMenu();
    void renderCountrySelect();
    void renderGameplay();

    // Game initialization
    void startNewGame(const Country& country);

    SDL_Window* window;
    SDL_Renderer* renderer;
    bool running;

    std::unique_ptr<MapRenderer> mapRenderer;
    std::unique_ptr<Economy> economy;
    std::unique_ptr<GameStateManager> gameState;
    std::unique_ptr<UIRenderer> uiRenderer;

    std::vector<Station> stations;
    std::vector<TrainLine> trainLines;
    std::vector<Train> trains;

    // UI elements
    std::vector<Button> mainMenuButtons;
    std::vector<Button> countrySelectButtons;
    int countryScrollOffset;

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
