#pragma once

#include <vector>
#include <string>

class TrainLine {
public:
    TrainLine(int id, int station1Id, int station2Id);

    int getId() const { return id; }
    int getStation1() const { return station1Id; }
    int getStation2() const { return station2Id; }

    // Economic data
    double getLength() const { return length; }
    void setLength(double len) { length = len; }

    int getBuildCost() const;
    int getMaintenanceCost() const;

    // Train management
    void addTrain(int trainId);
    void removeTrain(int trainId);
    const std::vector<int>& getTrains() const { return trains; }

private:
    int id;
    int station1Id;
    int station2Id;
    double length; // in kilometers

    std::vector<int> trains;

    // Cost calculation
    static constexpr double COST_PER_KM = 1000.0;
    static constexpr double MAINTENANCE_PER_KM = 10.0;
};
