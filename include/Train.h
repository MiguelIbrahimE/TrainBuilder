#pragma once

class Train {
public:
    Train(int id, int lineId, int capacity);

    int getId() const { return id; }
    int getLineId() const { return lineId; }

    // Position (0.0 = station1, 1.0 = station2)
    double getPosition() const { return position; }
    void setPosition(double pos) { position = pos; }

    // Movement
    void update(float deltaTime, double lineLength);
    void reverse();

    // Passengers
    int getPassengerCount() const { return passengerCount; }
    int getCapacity() const { return capacity; }
    void boardPassengers(int count);
    void disembarkPassengers(int count);

    // Costs
    int getPurchaseCost() const { return purchaseCost; }
    int getMaintenanceCost() const { return maintenanceCost; }

private:
    int id;
    int lineId;
    double position; // 0.0 to 1.0 along the line
    bool movingForward;

    int capacity;
    int passengerCount;

    double speed; // km/h

    static constexpr int PURCHASE_COST = 10000;
    static constexpr int MAINTENANCE_COST = 200;
    static constexpr double DEFAULT_SPEED = 80.0; // km/h

    int purchaseCost = PURCHASE_COST;
    int maintenanceCost = MAINTENANCE_COST;
};
