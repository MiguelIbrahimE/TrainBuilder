#include "Train.h"
#include <algorithm>

Train::Train(int id, int lineId, int capacity)
    : id(id)
    , lineId(lineId)
    , position(0.0)
    , movingForward(true)
    , capacity(capacity)
    , passengerCount(0)
    , speed(DEFAULT_SPEED)
{}

void Train::update(float deltaTime, double lineLength) {
    if (lineLength <= 0) return;

    // Convert speed (km/h) to position change per second
    double distancePerSecond = speed / 3600.0; // km per second
    double positionChangePerSecond = distancePerSecond / lineLength;

    double positionChange = positionChangePerSecond * deltaTime;

    if (movingForward) {
        position += positionChange;
        if (position >= 1.0) {
            position = 1.0;
            reverse();
        }
    } else {
        position -= positionChange;
        if (position <= 0.0) {
            position = 0.0;
            reverse();
        }
    }
}

void Train::reverse() {
    movingForward = !movingForward;
}

void Train::boardPassengers(int count) {
    int available = capacity - passengerCount;
    passengerCount += std::min(count, available);
}

void Train::disembarkPassengers(int count) {
    passengerCount = std::max(0, passengerCount - count);
}
