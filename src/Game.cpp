#include "Game.h"
#include <iostream>
#include <cmath>

const int SCREEN_WIDTH = 1280;
const int SCREEN_HEIGHT = 720;

Game::Game()
    : window(nullptr)
    , renderer(nullptr)
    , running(false)
    , currentMode(Mode::VIEW)
    , selectedStation(nullptr)
    , isDragging(false)
    , mapCenterLat(52.3676)  // Amsterdam, Netherlands as default
    , mapCenterLon(4.9041)
    , zoomLevel(10)
{}

Game::~Game() {
    cleanup();
}

bool Game::init() {
    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        std::cerr << "SDL could not initialize! SDL_Error: " << SDL_GetError() << std::endl;
        return false;
    }

    window = SDL_CreateWindow(
        "Train Builder - Economic Simulator",
        SDL_WINDOWPOS_CENTERED,
        SDL_WINDOWPOS_CENTERED,
        SCREEN_WIDTH,
        SCREEN_HEIGHT,
        SDL_WINDOW_SHOWN
    );

    if (!window) {
        std::cerr << "Window could not be created! SDL_Error: " << SDL_GetError() << std::endl;
        return false;
    }

    renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);
    if (!renderer) {
        std::cerr << "Renderer could not be created! SDL_Error: " << SDL_GetError() << std::endl;
        return false;
    }

    // Initialize subsystems
    mapRenderer = std::make_unique<MapRenderer>(renderer);
    if (!mapRenderer->init(mapCenterLat, mapCenterLon, zoomLevel)) {
        std::cerr << "Failed to initialize map renderer!" << std::endl;
        return false;
    }

    economy = std::make_unique<Economy>();

    running = true;
    return true;
}

void Game::run() {
    Uint32 lastTime = SDL_GetTicks();

    while (running) {
        Uint32 currentTime = SDL_GetTicks();
        float deltaTime = (currentTime - lastTime) / 1000.0f;
        lastTime = currentTime;

        handleEvents();
        update(deltaTime);
        render();
    }
}

void Game::handleEvents() {
    SDL_Event event;
    while (SDL_PollEvent(&event)) {
        switch (event.type) {
            case SDL_QUIT:
                running = false;
                break;

            case SDL_MOUSEBUTTONDOWN:
                if (event.button.button == SDL_BUTTON_LEFT) {
                    handleMouseClick(event.button.x, event.button.y, true);
                } else if (event.button.button == SDL_BUTTON_RIGHT) {
                    handleMouseClick(event.button.x, event.button.y, false);
                }
                break;

            case SDL_MOUSEMOTION:
                if (event.motion.state & SDL_BUTTON_LMASK) {
                    handleMouseDrag(event.motion.x, event.motion.y);
                }
                break;

            case SDL_MOUSEBUTTONUP:
                handleMouseRelease(event.button.x, event.button.y);
                break;

            case SDL_MOUSEWHEEL:
                if (event.wheel.y > 0) {
                    zoomLevel = std::min(zoomLevel + 1, 18);
                } else if (event.wheel.y < 0) {
                    zoomLevel = std::max(zoomLevel - 1, 1);
                }
                break;

            case SDL_KEYDOWN:
                switch (event.key.keysym.sym) {
                    case SDLK_s:
                        currentMode = Mode::PLACE_STATION;
                        std::cout << "Mode: Place Station" << std::endl;
                        break;
                    case SDLK_l:
                        currentMode = Mode::DRAW_LINE;
                        std::cout << "Mode: Draw Line" << std::endl;
                        break;
                    case SDLK_v:
                        currentMode = Mode::VIEW;
                        selectedStation = nullptr;
                        std::cout << "Mode: View" << std::endl;
                        break;
                    case SDLK_ESCAPE:
                        running = false;
                        break;
                }
                break;
        }
    }
}

void Game::handleMouseClick(int x, int y, bool leftClick) {
    if (!leftClick) {
        isDragging = true;
        dragStartX = x;
        dragStartY = y;
        return;
    }

    auto coord = mapRenderer->screenToLatLon(x, y, mapCenterLat, mapCenterLon, zoomLevel);

    switch (currentMode) {
        case Mode::PLACE_STATION: {
            if (economy->canBuildStation()) {
                int id = stations.size();
                stations.emplace_back(id, coord.lat, coord.lon, "Station " + std::to_string(id + 1));
                economy->spendMoney(economy->getStationBuildCost());
                std::cout << "Placed station at (" << coord.lat << ", " << coord.lon << ")" << std::endl;
                std::cout << "Money: $" << economy->getMoney() << std::endl;
            } else {
                std::cout << "Not enough money to build station!" << std::endl;
            }
            break;
        }

        case Mode::DRAW_LINE: {
            // Find clicked station
            Station* clickedStation = nullptr;
            for (auto& station : stations) {
                auto screenPos = mapRenderer->latLonToScreen(
                    station.getLat(), station.getLon(),
                    mapCenterLat, mapCenterLon, zoomLevel
                );
                int dx = screenPos.x - x;
                int dy = screenPos.y - y;
                if (dx * dx + dy * dy < 100) { // 10 pixel radius
                    clickedStation = &station;
                    break;
                }
            }

            if (clickedStation) {
                if (!selectedStation) {
                    selectedStation = clickedStation;
                    std::cout << "Selected station: " << selectedStation->getName() << std::endl;
                } else if (selectedStation != clickedStation) {
                    // Create line between stations
                    int lineId = trainLines.size();
                    trainLines.emplace_back(lineId, selectedStation->getId(), clickedStation->getId());

                    // Calculate distance
                    double lat1 = selectedStation->getLat() * M_PI / 180.0;
                    double lat2 = clickedStation->getLat() * M_PI / 180.0;
                    double lon1 = selectedStation->getLon() * M_PI / 180.0;
                    double lon2 = clickedStation->getLon() * M_PI / 180.0;

                    double dLat = lat2 - lat1;
                    double dLon = lon2 - lon1;
                    double a = sin(dLat/2) * sin(dLat/2) +
                              cos(lat1) * cos(lat2) *
                              sin(dLon/2) * sin(dLon/2);
                    double c = 2 * atan2(sqrt(a), sqrt(1-a));
                    double distance = 6371.0 * c; // Earth radius in km

                    trainLines.back().setLength(distance);

                    double cost = distance * economy->getLineBuildCostPerKm();
                    if (economy->spendMoney(cost)) {
                        selectedStation->addConnectedLine(lineId);
                        clickedStation->addConnectedLine(lineId);

                        std::cout << "Built line between " << selectedStation->getName()
                                  << " and " << clickedStation->getName()
                                  << " (" << distance << " km, $" << cost << ")" << std::endl;
                        std::cout << "Money: $" << economy->getMoney() << std::endl;
                    } else {
                        trainLines.pop_back();
                        std::cout << "Not enough money to build line!" << std::endl;
                    }

                    selectedStation = nullptr;
                } else {
                    selectedStation = nullptr;
                }
            }
            break;
        }

        case Mode::VIEW:
            break;
    }
}

void Game::handleMouseDrag(int x, int y) {
    if (isDragging) {
        // Pan the map
        int dx = x - dragStartX;
        int dy = y - dragStartY;

        // Convert pixel movement to lat/lon delta
        double scale = 156543.03392 * cos(mapCenterLat * M_PI / 180.0) / pow(2, zoomLevel);
        double lonDelta = -dx * scale / 111320.0;
        double latDelta = dy * scale / 110540.0;

        mapCenterLon += lonDelta;
        mapCenterLat += latDelta;

        dragStartX = x;
        dragStartY = y;
    }
}

void Game::handleMouseRelease(int x, int y) {
    isDragging = false;
}

void Game::update(float deltaTime) {
    // Update economy
    economy->update(deltaTime);

    // Update trains
    for (auto& train : trains) {
        if (train.getLineId() < trainLines.size()) {
            double lineLength = trainLines[train.getLineId()].getLength();
            train.update(deltaTime, lineLength);
        }
    }

    // Generate passengers at stations
    for (auto& station : stations) {
        // Simple passenger generation (1 passenger every few seconds)
        static float passengerTimer = 0;
        passengerTimer += deltaTime;
        if (passengerTimer >= 2.0f) {
            station.addPassengers(5);
            passengerTimer = 0;
        }
    }
}

void Game::render() {
    SDL_SetRenderDrawColor(renderer, 50, 50, 50, 255);
    SDL_RenderClear(renderer);

    // Render map
    mapRenderer->render(mapCenterLat, mapCenterLon, zoomLevel);

    // Render train lines
    SDL_SetRenderDrawColor(renderer, 100, 100, 255, 255);
    for (const auto& line : trainLines) {
        if (line.getStation1() < stations.size() && line.getStation2() < stations.size()) {
            const auto& s1 = stations[line.getStation1()];
            const auto& s2 = stations[line.getStation2()];

            auto pos1 = mapRenderer->latLonToScreen(s1.getLat(), s1.getLon(), mapCenterLat, mapCenterLon, zoomLevel);
            auto pos2 = mapRenderer->latLonToScreen(s2.getLat(), s2.getLon(), mapCenterLat, mapCenterLon, zoomLevel);

            SDL_RenderDrawLine(renderer, pos1.x, pos1.y, pos2.x, pos2.y);
        }
    }

    // Render stations
    for (const auto& station : stations) {
        auto pos = mapRenderer->latLonToScreen(station.getLat(), station.getLon(), mapCenterLat, mapCenterLon, zoomLevel);

        SDL_Rect rect = { pos.x - 5, pos.y - 5, 10, 10 };
        if (&station == selectedStation) {
            SDL_SetRenderDrawColor(renderer, 255, 255, 0, 255);
        } else {
            SDL_SetRenderDrawColor(renderer, 255, 0, 0, 255);
        }
        SDL_RenderFillRect(renderer, &rect);
    }

    // Render UI (simple text display would require SDL_ttf, for now just shapes)
    // Show money in top-left
    SDL_SetRenderDrawColor(renderer, 0, 0, 0, 200);
    SDL_Rect uiRect = { 10, 10, 250, 100 };
    SDL_RenderFillRect(renderer, &uiRect);

    SDL_RenderPresent(renderer);
}

void Game::cleanup() {
    if (renderer) {
        SDL_DestroyRenderer(renderer);
        renderer = nullptr;
    }

    if (window) {
        SDL_DestroyWindow(window);
        window = nullptr;
    }

    SDL_Quit();
}
