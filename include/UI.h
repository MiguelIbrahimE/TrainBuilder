#pragma once

#include <SDL2/SDL.h>
#include <SDL2/SDL_ttf.h>
#include <string>
#include <vector>
#include <functional>
#include <map>

struct Button {
    int x, y, width, height;
    std::string text;
    std::function<void()> onClick;
    bool isHovered;
    bool isEnabled;

    Button(int x, int y, int w, int h, const std::string& text, std::function<void()> callback)
        : x(x), y(y), width(w), height(h), text(text), onClick(callback)
        , isHovered(false), isEnabled(true) {}

    bool contains(int mouseX, int mouseY) const {
        return mouseX >= x && mouseX <= x + width &&
               mouseY >= y && mouseY <= y + height;
    }
};

class UIRenderer {
public:
    UIRenderer(SDL_Renderer* renderer);
    ~UIRenderer();

    bool init();

    // Button rendering
    void renderButton(const Button& button);
    void renderText(const std::string& text, int x, int y, int size = 24,
                   SDL_Color color = {255, 255, 255, 255});

    // Menu rendering
    void renderMainMenu(const std::vector<Button>& buttons);
    void renderCountrySelect(const std::vector<Button>& buttons, int scrollOffset);
    void renderLoadingScreen(const std::string& countryName, int current, int total);

    // Info panel
    void renderInfoPanel(double money, int stationCount, int lineCount);

private:
    SDL_Renderer* renderer;
    std::map<int, TTF_Font*> fonts; // fonts by size

    void drawRect(int x, int y, int w, int h, SDL_Color color, bool filled = true);
    void drawText(const std::string& text, int x, int y, int size, SDL_Color color);
    TTF_Font* getFont(int size);
};
