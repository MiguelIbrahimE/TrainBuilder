#include "UI.h"
#include <algorithm>
#include <iostream>

UIRenderer::UIRenderer(SDL_Renderer* renderer)
    : renderer(renderer)
{}

UIRenderer::~UIRenderer() {
    // Clean up fonts
    for (auto& pair : fonts) {
        if (pair.second) {
            TTF_CloseFont(pair.second);
        }
    }
    fonts.clear();
}

bool UIRenderer::init() {
    if (TTF_Init() == -1) {
        std::cerr << "TTF_Init failed: " << TTF_GetError() << std::endl;
        return false;
    }
    return true;
}

TTF_Font* UIRenderer::getFont(int size) {
    // Check if we already have this font size loaded
    auto it = fonts.find(size);
    if (it != fonts.end()) {
        return it->second;
    }

    // Try to load a system font
    const char* fontPaths[] = {
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/TTF/DejaVuSans.ttf"
    };

    TTF_Font* font = nullptr;
    for (const char* path : fontPaths) {
        font = TTF_OpenFont(path, size);
        if (font) {
            break;
        }
    }

    if (!font) {
        std::cerr << "Failed to load font: " << TTF_GetError() << std::endl;
        return nullptr;
    }

    fonts[size] = font;
    return font;
}

void UIRenderer::drawRect(int x, int y, int w, int h, SDL_Color color, bool filled) {
    SDL_Rect rect = {x, y, w, h};
    SDL_SetRenderDrawColor(renderer, color.r, color.g, color.b, color.a);
    if (filled) {
        SDL_RenderFillRect(renderer, &rect);
    } else {
        SDL_RenderDrawRect(renderer, &rect);
    }
}

void UIRenderer::drawText(const std::string& text, int x, int y, int size, SDL_Color color) {
    if (text.empty()) return;

    TTF_Font* font = getFont(size);
    if (!font) {
        // Fallback to rectangle rendering if font loading failed
        int charWidth = size / 2;
        int charHeight = size;
        for (size_t i = 0; i < text.length(); i++) {
            SDL_Rect charRect = {
                x + (int)(i * charWidth),
                y,
                charWidth - 2,
                charHeight
            };
            SDL_SetRenderDrawColor(renderer, color.r, color.g, color.b, color.a);
            SDL_RenderDrawRect(renderer, &charRect);
        }
        return;
    }

    SDL_Surface* surface = TTF_RenderText_Blended(font, text.c_str(), color);
    if (!surface) {
        std::cerr << "Failed to render text: " << TTF_GetError() << std::endl;
        return;
    }

    SDL_Texture* texture = SDL_CreateTextureFromSurface(renderer, surface);
    if (!texture) {
        std::cerr << "Failed to create texture: " << SDL_GetError() << std::endl;
        SDL_FreeSurface(surface);
        return;
    }

    SDL_Rect dstRect = {x, y, surface->w, surface->h};
    SDL_RenderCopy(renderer, texture, nullptr, &dstRect);

    SDL_DestroyTexture(texture);
    SDL_FreeSurface(surface);
}

void UIRenderer::renderButton(const Button& button) {
    // Button background
    SDL_Color bgColor;
    if (!button.isEnabled) {
        bgColor = {80, 80, 80, 255};
    } else if (button.isHovered) {
        bgColor = {70, 120, 200, 255};
    } else {
        bgColor = {50, 100, 180, 255};
    }
    drawRect(button.x, button.y, button.width, button.height, bgColor, true);

    // Button border
    SDL_Color borderColor = {100, 150, 220, 255};
    drawRect(button.x, button.y, button.width, button.height, borderColor, false);

    // Button text (centered)
    TTF_Font* font = getFont(20);
    int textWidth = 0;
    int textHeight = 0;
    if (font) {
        TTF_SizeText(font, button.text.c_str(), &textWidth, &textHeight);
    } else {
        textWidth = button.text.length() * 10;
        textHeight = 20;
    }
    int textX = button.x + (button.width - textWidth) / 2;
    int textY = button.y + (button.height - textHeight) / 2;
    drawText(button.text, textX, textY, 20, {255, 255, 255, 255});
}

void UIRenderer::renderText(const std::string& text, int x, int y, int size, SDL_Color color) {
    drawText(text, x, y, size, color);
}

void UIRenderer::renderMainMenu(const std::vector<Button>& buttons) {
    // Clear screen with dark background
    SDL_SetRenderDrawColor(renderer, 30, 30, 40, 255);
    SDL_RenderClear(renderer);

    // Title
    drawText("TRAIN BUILDER", 400, 150, 48, {255, 255, 255, 255});
    drawText("Economic Railway Simulator", 350, 180, 20, {200, 200, 200, 255});

    // Render buttons
    for (const auto& button : buttons) {
        renderButton(button);
    }

    // Footer
    drawText("Use arrow keys and mouse to navigate", 350, 650, 16, {150, 150, 150, 255});
}

void UIRenderer::renderCountrySelect(const std::vector<Button>& buttons, int scrollOffset) {
    // Clear screen
    SDL_SetRenderDrawColor(renderer, 30, 30, 40, 255);
    SDL_RenderClear(renderer);

    // Title
    drawText("SELECT A COUNTRY", 450, 50, 36, {255, 255, 255, 255});
    drawText("Choose where to build your railway network", 320, 80, 18, {200, 200, 200, 255});

    // Render country buttons (with scrolling)
    for (const auto& button : buttons) {
        if (button.y + button.height > 120 && button.y < 680) {
            renderButton(button);
        }
    }

    // Scroll indicators
    if (scrollOffset > 0) {
        drawText("^ Scroll Up", 550, 100, 14, {150, 150, 150, 255});
    }
    if (buttons.size() > 10) {
        drawText("v Scroll Down", 540, 680, 14, {150, 150, 150, 255});
    }
}

void UIRenderer::renderLoadingScreen(const std::string& countryName, int current, int total) {
    // Clear screen
    SDL_SetRenderDrawColor(renderer, 30, 30, 40, 255);
    SDL_RenderClear(renderer);

    // Title
    std::string title = "Loading " + countryName;
    drawText(title, 450, 250, 36, {255, 255, 255, 255});
    drawText("Downloading map tiles...", 450, 300, 20, {200, 200, 200, 255});

    // Progress bar background
    int barWidth = 600;
    int barHeight = 40;
    int barX = 340;
    int barY = 360;

    drawRect(barX, barY, barWidth, barHeight, {50, 50, 50, 255}, true);
    drawRect(barX, barY, barWidth, barHeight, {100, 100, 100, 255}, false);

    // Progress bar fill
    if (total > 0) {
        float progress = (float)current / total;
        int fillWidth = (int)(barWidth * progress);
        drawRect(barX, barY, fillWidth, barHeight, {70, 180, 120, 255}, true);
    }

    // Progress text
    std::string progressText = std::to_string(current) + " / " + std::to_string(total);
    int percentage = total > 0 ? (100 * current / total) : 0;
    std::string percentText = std::to_string(percentage) + "%";

    drawText(progressText, 560, 420, 18, {200, 200, 200, 255});
    drawText(percentText, 600, 370, 20, {255, 255, 255, 255});

    SDL_RenderPresent(renderer);
}

void UIRenderer::renderInfoPanel(double money, int stationCount, int lineCount) {
    // Panel background
    drawRect(10, 10, 250, 120, {0, 0, 0, 200}, true);
    drawRect(10, 10, 250, 120, {100, 100, 100, 255}, false);

    // Money
    std::string moneyStr = "Money: $" + std::to_string((int)money);
    drawText(moneyStr, 20, 20, 18, {255, 255, 100, 255});

    // Stations
    std::string stationsStr = "Stations: " + std::to_string(stationCount);
    drawText(stationsStr, 20, 45, 16, {200, 200, 200, 255});

    // Lines
    std::string linesStr = "Lines: " + std::to_string(lineCount);
    drawText(linesStr, 20, 70, 16, {200, 200, 200, 255});

    // Controls hint
    drawText("ESC: Menu", 20, 95, 14, {150, 150, 150, 255});
}
