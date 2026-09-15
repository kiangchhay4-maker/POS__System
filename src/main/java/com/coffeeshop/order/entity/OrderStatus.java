package com.coffeeshop.order.entity;

import java.util.Set;

public enum OrderStatus {
    CREATED,
    PAYMENT_PENDING,
    CONFIRMED,
    PREPARING,
    READY,
    COMPLETED,
    CANCELLED;

    public boolean canTransitionTo(OrderStatus target) {
        if (this == target) {
            return true;
        }

        return switch (this) {
            case CREATED -> Set.of(PAYMENT_PENDING, CONFIRMED, CANCELLED).contains(target);
            case PAYMENT_PENDING -> Set.of(CONFIRMED, CANCELLED).contains(target);
            case CONFIRMED -> Set.of(PREPARING, CANCELLED).contains(target);
            case PREPARING -> Set.of(READY, CANCELLED).contains(target);
            case READY -> Set.of(COMPLETED, CANCELLED).contains(target);
            case COMPLETED, CANCELLED -> false; // Terminal states
        };
    }
}
