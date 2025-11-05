#pragma once

#include <vector>

class Economy {
public:
    Economy();

    // Budget management
    double getMoney() const { return money; }
    bool spendMoney(double amount);
    void earnMoney(double amount);

    // Income/expense tracking
    void update(float deltaTime);
    double getMonthlyIncome() const { return monthlyIncome; }
    double getMonthlyExpenses() const { return monthlyExpenses; }
    double getNetIncome() const { return monthlyIncome - monthlyExpenses; }

    // Station costs
    bool canBuildStation() const;
    double getStationBuildCost() const { return stationBuildCost; }
    double getStationMaintenanceCost() const { return stationMaintenanceCost; }

    // Line costs (per km)
    double getLineBuildCostPerKm() const { return lineBuildCostPerKm; }
    double getLineMaintenanceCostPerKm() const { return lineMaintenanceCostPerKm; }

    // Revenue
    double calculateTicketRevenue(int passengers, double distance) const;

private:
    double money;
    double monthlyIncome;
    double monthlyExpenses;

    // Constants
    static constexpr double STARTING_MONEY = 100000.0;
    static constexpr double STATION_BUILD_COST = 5000.0;
    static constexpr double STATION_MAINTENANCE = 100.0;
    static constexpr double LINE_BUILD_COST_PER_KM = 1000.0;
    static constexpr double LINE_MAINTENANCE_PER_KM = 10.0;
    static constexpr double TICKET_PRICE_PER_KM = 0.5;

    double stationBuildCost = STATION_BUILD_COST;
    double stationMaintenanceCost = STATION_MAINTENANCE;
    double lineBuildCostPerKm = LINE_BUILD_COST_PER_KM;
    double lineMaintenanceCostPerKm = LINE_MAINTENANCE_PER_KM;

    // Time tracking
    float timeAccumulator;
};
