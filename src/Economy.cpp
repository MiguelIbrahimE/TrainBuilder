#include "Economy.h"
#include <algorithm>

Economy::Economy()
    : money(STARTING_MONEY)
    , monthlyIncome(0.0)
    , monthlyExpenses(0.0)
    , timeAccumulator(0.0f)
{}

bool Economy::spendMoney(double amount) {
    if (money >= amount) {
        money -= amount;
        return true;
    }
    return false;
}

void Economy::earnMoney(double amount) {
    money += amount;
    monthlyIncome += amount;
}

void Economy::update(float deltaTime) {
    timeAccumulator += deltaTime;

    // Process monthly expenses every 30 seconds (simulated month)
    if (timeAccumulator >= 30.0f) {
        money -= monthlyExpenses;
        money += monthlyIncome;

        // Reset counters
        monthlyIncome = 0.0;
        monthlyExpenses = 0.0;
        timeAccumulator = 0.0f;
    }
}

bool Economy::canBuildStation() const {
    return money >= stationBuildCost;
}

double Economy::calculateTicketRevenue(int passengers, double distance) const {
    return passengers * distance * TICKET_PRICE_PER_KM;
}
