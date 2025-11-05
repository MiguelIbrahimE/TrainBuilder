#include "TrainLine.h"

TrainLine::TrainLine(int id, int station1Id, int station2Id)
    : id(id)
    , station1Id(station1Id)
    , station2Id(station2Id)
    , length(0.0)
{}

int TrainLine::getBuildCost() const {
    return (int)(length * COST_PER_KM);
}

int TrainLine::getMaintenanceCost() const {
    return (int)(length * MAINTENANCE_PER_KM);
}

void TrainLine::addTrain(int trainId) {
    trains.push_back(trainId);
}

void TrainLine::removeTrain(int trainId) {
    for (auto it = trains.begin(); it != trains.end(); ++it) {
        if (*it == trainId) {
            trains.erase(it);
            break;
        }
    }
}
