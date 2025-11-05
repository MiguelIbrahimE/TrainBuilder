#include "Station.h"

Station::Station(int id, double lat, double lon, const std::string& name)
    : id(id)
    , lat(lat)
    , lon(lon)
    , name(name)
    , passengerCount(0)
    , buildCost(5000)
    , maintenanceCost(100)
{}

void Station::addPassengers(int count) {
    passengerCount += count;
}

void Station::removePassengers(int count) {
    passengerCount = std::max(0, passengerCount - count);
}

void Station::addConnectedLine(int lineId) {
    connectedLines.push_back(lineId);
}
