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
    , mapCenterLat(52.3676)
    , mapCenterLon(4.9041)
    , zoomLevel(10)
    , countryScrollOffset(0)
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

    renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);
    if (!renderer) {
        std::cerr << "Renderer could not be created! SDL_Error: " << SDL_GetError() << std::endl;
        return false;
    }

    // Software vsync fallback (VSync doesn't work in Xvfb)
    SDL_SetHint(SDL_HINT_RENDER_VSYNC, "1");

    // Initialize subsystems
    gameState = std::make_unique<GameStateManager>();
    uiRenderer = std::make_unique<UIRenderer>(renderer);

    if (!uiRenderer->init()) {
        std::cerr << "Failed to initialize UI renderer!" << std::endl;
        return false;
    }

    // Create main menu buttons
    mainMenuButtons.push_back(Button(440, 300, 400, 60, "New Game", [this]() {
        gameState->setState(GameStateType::COUNTRY_SELECT);
    }));
    mainMenuButtons.push_back(Button(440, 380, 400, 60, "Continue Game", [this]() {
        // TODO: Load last save
        std::cout << "Continue not implemented yet" << std::endl;
    }));
    mainMenuButtons.push_back(Button(440, 460, 400, 60, "Options", [this]() {
        gameState->setState(GameStateType::OPTIONS);
    }));
    mainMenuButtons.push_back(Button(440, 540, 400, 60, "Exit", [this]() {
        running = false;
    }));

    // Create country selection buttons
    const auto& countries = gameState->getAvailableCountries();
    int yPos = 140;
    for (const auto& country : countries) {
        countrySelectButtons.push_back(Button(340, yPos, 600, 50, country.name, [this, country]() {
            startNewGame(country);
        }));
        yPos += 60;
    }

    running = true;
    return true;
}

void Game::startNewGame(const Country& country) {
    std::cout << "Starting new game in " << country.name << std::endl;

    // Select country
    gameState->selectCountry(country);

    // Initialize map renderer (uses pre-downloaded tiles!)
    mapRenderer = std::make_unique<MapRenderer>(renderer);
    if (!mapRenderer->init(country.centerLat, country.centerLon, country.defaultZoom)) {
        std::cerr << "Failed to initialize map renderer!" << std::endl;
        return;
    }

    // Set country for tile storage
    mapRenderer->setCountry(country.code);

    economy = std::make_unique<Economy>();

    // Set map bounds to country
    mapCenterLat = country.centerLat;
    mapCenterLon = country.centerLon;
    zoomLevel = country.defaultZoom;

    // Clear existing data
    stations.clear();
    trainLines.clear();
    trains.clear();

    // Switch to playing state - tiles are already pre-downloaded!
    gameState->setState(GameStateType::PLAYING);
}

void Game::run() {
    Uint32 lastTime = SDL_GetTicks();
    const int TARGET_FPS = 60;
    const int FRAME_DELAY = 1000 / TARGET_FPS;

    while (running) {
        Uint32 frameStart = SDL_GetTicks();
        Uint32 currentTime = frameStart;
        float deltaTime = (currentTime - lastTime) / 1000.0f;
        lastTime = currentTime;

        handleEvents();
        update(deltaTime);
        render();

        // Frame rate limiting
        Uint32 frameTime = SDL_GetTicks() - frameStart;
        if (frameTime < FRAME_DELAY) {
            SDL_Delay(FRAME_DELAY - frameTime);
        }
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
                if (gameState->getCurrentState() == GameStateType::PLAYING) {
                    if (event.motion.state & SDL_BUTTON_RMASK) {
                        handleMouseDrag(event.motion.x, event.motion.y);
                    }
                }
                // Update button hover states
                int mouseX, mouseY;
                SDL_GetMouseState(&mouseX, &mouseY);
                if (gameState->getCurrentState() == GameStateType::MAIN_MENU) {
                    for (auto& button : mainMenuButtons) {
                        button.isHovered = button.contains(mouseX, mouseY);
                    }
                } else if (gameState->getCurrentState() == GameStateType::COUNTRY_SELECT) {
                    for (auto& button : countrySelectButtons) {
                        button.isHovered = button.contains(mouseX, mouseY);
                    }
                }
                break;

            case SDL_MOUSEBUTTONUP:
                if (gameState->getCurrentState() == GameStateType::PLAYING) {
                    handleMouseRelease(event.button.x, event.button.y);
                }
                break;

            case SDL_MOUSEWHEEL:
                if (gameState->getCurrentState() == GameStateType::PLAYING) {
                    if (event.wheel.y > 0) {
                        zoomLevel = std::min(zoomLevel + 1, 18);
                    } else if (event.wheel.y < 0) {
                        zoomLevel = std::max(zoomLevel - 1, 1);
                    }
                } else if (gameState->getCurrentState() == GameStateType::COUNTRY_SELECT) {
                    countryScrollOffset -= event.wheel.y * 30;
                    countryScrollOffset = std::max(0, std::min(countryScrollOffset,
                        (int)countrySelectButtons.size() * 60 - 500));
                }
                break;

            case SDL_KEYDOWN:
                handleKeyPress(event.key.keysym.sym);
                break;
        }
    }
}

void Game::handleKeyPress(SDL_Keycode key) {
    if (gameState->getCurrentState() == GameStateType::PLAYING) {
        switch (key) {
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
                gameState->setState(GameStateType::MAIN_MENU);
                break;
        }
    } else if (key == SDLK_ESCAPE) {
        if (gameState->getCurrentState() == GameStateType::COUNTRY_SELECT) {
            gameState->setState(GameStateType::MAIN_MENU);
        } else if (gameState->getCurrentState() == GameStateType::OPTIONS) {
            gameState->setState(GameStateType::MAIN_MENU);
        }
    }
}

void Game::handleMouseClick(int x, int y, bool leftClick) {
    switch (gameState->getCurrentState()) {
        case GameStateType::MAIN_MENU:
            if (leftClick) handleMainMenuClick(x, y);
            break;
        case GameStateType::COUNTRY_SELECT:
            if (leftClick) handleCountrySelectClick(x, y);
            break;
        case GameStateType::PLAYING:
            handleGameplayClick(x, y, leftClick);
            break;
        default:
            break;
    }
}

void Game::handleMainMenuClick(int x, int y) {
    for (auto& button : mainMenuButtons) {
        if (button.contains(x, y) && button.isEnabled) {
            button.onClick();
            break;
        }
    }
}

void Game::handleCountrySelectClick(int x, int y) {
    for (auto& button : countrySelectButtons) {
        if (button.contains(x, y) && button.isEnabled) {
            button.onClick();
            break;
        }
    }
}

void Game::handleGameplayClick(int x, int y, bool leftClick) {
    if (!leftClick) {
        isDragging = true;
        dragStartX = x;
        dragStartY = y;
        return;
    }

    if (!mapRenderer) return;

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
            Station* clickedStation = nullptr;
            for (auto& station : stations) {
                auto screenPos = mapRenderer->latLonToScreen(
                    station.getLat(), station.getLon(),
                    mapCenterLat, mapCenterLon, zoomLevel
                );
                int dx = screenPos.x - x;
                int dy = screenPos.y - y;
                if (dx * dx + dy * dy < 100) {
                    clickedStation = &station;
                    break;
                }
            }

            if (clickedStation) {
                if (!selectedStation) {
                    selectedStation = clickedStation;
                    std::cout << "Selected station: " << selectedStation->getName() << std::endl;
                } else if (selectedStation != clickedStation) {
                    int lineId = trainLines.size();
                    trainLines.emplace_back(lineId, selectedStation->getId(), clickedStation->getId());

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
                    double distance = 6371.0 * c;

                    trainLines.back().setLength(distance);

                    double cost = distance * economy->getLineBuildCostPerKm();
                    if (economy->spendMoney(cost)) {
                        selectedStation->addConnectedLine(lineId);
                        clickedStation->addConnectedLine(lineId);
                        std::cout << "Built line: " << distance << " km, $" << cost << std::endl;
                    } else {
                        trainLines.pop_back();
                        std::cout << "Not enough money!" << std::endl;
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
    if (isDragging && mapRenderer) {
        int dx = x - dragStartX;
        int dy = y - dragStartY;

        double scale = 156543.03392 * cos(mapCenterLat * M_PI / 180.0) / pow(2, zoomLevel);
        double lonDelta = -dx * scale / 111320.0;
        double latDelta = dy * scale / 110540.0;

        mapCenterLon += lonDelta;
        mapCenterLat += latDelta;

        // Clamp to country bounds if available
        const Country* country = gameState->getSelectedCountry();
        if (country) {
            mapCenterLat = std::max(country->minLat, std::min(country->maxLat, mapCenterLat));
            mapCenterLon = std::max(country->minLon, std::min(country->maxLon, mapCenterLon));
        }

        dragStartX = x;
        dragStartY = y;
    }
}

void Game::handleMouseRelease(int x, int y) {
    isDragging = false;
}

void Game::update(float deltaTime) {
    if (gameState->getCurrentState() != GameStateType::PLAYING) {
        return;
    }

    if (economy) {
        economy->update(deltaTime);
    }

    for (auto& train : trains) {
        if (train.getLineId() < trainLines.size()) {
            double lineLength = trainLines[train.getLineId()].getLength();
            train.update(deltaTime, lineLength);
        }
    }

    for (auto& station : stations) {
        static float passengerTimer = 0;
        passengerTimer += deltaTime;
        if (passengerTimer >= 2.0f) {
            station.addPassengers(5);
            passengerTimer = 0;
        }
    }
}

void Game::render() {
    switch (gameState->getCurrentState()) {
        case GameStateType::MAIN_MENU:
            renderMainMenu();
            break;
        case GameStateType::COUNTRY_SELECT:
            renderCountrySelect();
            break;
        case GameStateType::PLAYING:
            renderGameplay();
            break;
        default:
            SDL_SetRenderDrawColor(renderer, 30, 30, 40, 255);
            SDL_RenderClear(renderer);
            break;
    }

    SDL_RenderPresent(renderer);
}

void Game::renderMainMenu() {
    uiRenderer->renderMainMenu(mainMenuButtons);
}

void Game::renderCountrySelect() {
    // Adjust button positions based on scroll
    for (size_t i = 0; i < countrySelectButtons.size(); i++) {
        countrySelectButtons[i].y = 140 + i * 60 - countryScrollOffset;
    }
    uiRenderer->renderCountrySelect(countrySelectButtons, countryScrollOffset);
}

void Game::renderGameplay() {
    SDL_SetRenderDrawColor(renderer, 50, 50, 50, 255);
    SDL_RenderClear(renderer);

    if (mapRenderer) {
        mapRenderer->render(mapCenterLat, mapCenterLon, zoomLevel);
    }

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

    // Render UI
    if (economy) {
        uiRenderer->renderInfoPanel(economy->getMoney(), stations.size(), trainLines.size());
    }
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

    TTF_Quit();
    SDL_Quit();
}
