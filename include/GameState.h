#pragma once

#include <string>
#include <vector>

enum class GameStateType {
    MAIN_MENU,
    COUNTRY_SELECT,
    PLAYING,
    PAUSED,
    OPTIONS
};

struct Country {
    std::string name;
    std::string code;  // ISO 3166-1 alpha-2 code
    double centerLat;
    double centerLon;
    int defaultZoom;

    // Bounding box
    double minLat;
    double maxLat;
    double minLon;
    double maxLon;
};

class GameStateManager {
public:
    GameStateManager();

    GameStateType getCurrentState() const { return currentState; }
    void setState(GameStateType newState);

    // Country management
    const std::vector<Country>& getAvailableCountries() const { return availableCountries; }
    void selectCountry(const Country& country);
    const Country* getSelectedCountry() const { return selectedCountry; }

    // Save/Load
    std::string getCurrentSaveName() const { return currentSaveName; }
    void setCurrentSaveName(const std::string& name) { currentSaveName = name; }

private:
    GameStateType currentState;
    std::vector<Country> availableCountries;
    const Country* selectedCountry;
    std::string currentSaveName;

    void initializeCountries();
};
