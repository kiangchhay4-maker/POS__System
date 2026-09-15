package com.coffeeshop.inventory.dto;

import jakarta.validation.constraints.Min;

public record UpdateInventoryStockRequest(
        @Min(value = 0, message = "On-hand quantity cannot be negative")
        Integer onHandQuantity,

        @Min(value = 1, message = "Replenish quantity must be at least 1")
        Integer replenishQuantity
) {}
