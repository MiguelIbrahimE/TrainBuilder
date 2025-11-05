#include "GameState.h"

GameStateManager::GameStateManager()
    : currentState(GameStateType::MAIN_MENU)
    , selectedCountry(nullptr)
{
    initializeCountries();
}

void GameStateManager::setState(GameStateType newState) {
    currentState = newState;
}

void GameStateManager::selectCountry(const Country& country) {
    // Find and store pointer to the country in our list
    for (const auto& c : availableCountries) {
        if (c.code == country.code) {
            selectedCountry = &c;
            break;
        }
    }
}

void GameStateManager::initializeCountries() {
    // Initialize with a curated list of countries
    // Format: {name, code, centerLat, centerLon, defaultZoom, minLat, maxLat, minLon, maxLon}

    availableCountries = {
        {"Netherlands", "NL", 52.3676, 4.9041, 8, 50.75, 53.7, 3.31, 7.23},
        {"Belgium", "BE", 50.5039, 4.4699, 8, 49.5, 51.5, 2.5, 6.4},
        {"Luxembourg", "LU", 49.8153, 6.1296, 9, 49.4, 50.2, 5.7, 6.5},
        {"Switzerland", "CH", 46.8182, 8.2275, 8, 45.8, 47.8, 5.9, 10.5},
        {"Austria", "AT", 47.5162, 14.5501, 7, 46.4, 49.0, 9.5, 17.2},
        {"Denmark", "DK", 56.2639, 9.5018, 7, 54.5, 57.8, 8.0, 15.2},
        {"United Kingdom", "UK", 54.0, -2.5, 6, 49.9, 60.9, -8.0, 2.0},
        {"Ireland", "IE", 53.4129, -8.2439, 7, 51.4, 55.4, -10.5, -5.5},
        {"France", "FR", 46.2276, 2.2137, 6, 41.3, 51.1, -5.2, 9.6},
        {"Germany", "DE", 51.1657, 10.4515, 6, 47.3, 55.1, 5.9, 15.0},
        {"Italy", "IT", 41.8719, 12.5674, 6, 36.6, 47.1, 6.6, 18.5},
        {"Spain", "ES", 40.4637, -3.7492, 6, 36.0, 43.8, -9.3, 3.3},
        {"Portugal", "PT", 39.3999, -8.2245, 7, 36.9, 42.2, -9.5, -6.2},
        {"Poland", "PL", 51.9194, 19.1451, 6, 49.0, 54.9, 14.1, 24.2},
        {"Czech Republic", "CZ", 49.8175, 15.4730, 7, 48.5, 51.1, 12.1, 18.9},
        {"Slovakia", "SK", 48.6690, 19.6990, 7, 47.7, 49.6, 16.8, 22.6},
        {"Hungary", "HU", 47.1625, 19.5033, 7, 45.7, 48.6, 16.1, 22.9},
        {"Romania", "RO", 45.9432, 24.9668, 7, 43.6, 48.3, 20.3, 29.7},
        {"Sweden", "SE", 60.1282, 18.6435, 5, 55.3, 69.1, 11.0, 24.2},
        {"Norway", "NO", 60.4720, 8.4689, 5, 57.9, 71.2, 4.5, 31.2},
        {"Finland", "FI", 61.9241, 25.7482, 6, 59.8, 70.1, 20.5, 31.6},
        {"Japan", "JP", 36.2048, 138.2529, 6, 24.0, 45.5, 123.0, 146.0},
        {"South Korea", "KR", 35.9078, 127.7669, 7, 33.0, 38.6, 124.6, 131.9},
        {"United States", "US", 37.0902, -95.7129, 4, 24.5, 49.4, -125.0, -66.9},
        {"Canada", "CA", 56.1304, -106.3468, 4, 41.7, 83.1, -141.0, -52.6},
        {"Australia", "AU", -25.2744, 133.7751, 4, -43.6, -10.7, 113.3, 153.6},
    };
}
