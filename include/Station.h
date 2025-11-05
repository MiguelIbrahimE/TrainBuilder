#pragma once

#include <string>
#include <vector>

class Station {
public:
    Station(int id, double lat, double lon, const std::string& name);

    int getId() const { return id; }
    double getLat() const { return lat; }
    double getLon() const { return lon; }
    std::string getName() const { return name; }

    // Passenger management
    void addPassengers(int count);
    int getPassengerCount() const { return passengerCount; }
    void removePassengers(int count);

    // Economic data
    int getBuildCost() const { return buildCost; }
    int getMaintenanceCost() const { return maintenanceCost; }

    // Connected lines
    void addConnectedLine(int lineId);
    const std::vector<int>& getConnectedLines() const { return connectedLines; }

private:
    int id;
    double lat;
    double lon;
    std::string name;

    int passengerCount;
    int buildCost;
    int maintenanceCost;

    std::vector<int> connectedLines;
};
