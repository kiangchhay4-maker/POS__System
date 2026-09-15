package com.coffeeshop.common.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;
import java.util.UUID;

public class InsufficientInventoryException extends AppException {

    public InsufficientInventoryException(UUID productId, int requested, int available) {
        super(
                ErrorCode.INVENTORY_INSUFFICIENT,
                HttpStatus.CONFLICT,
                String.format("Insufficient inventory for product [%s]. Requested: %d, Available: %d",
                        productId, requested, available),
                Map.of(
                        "productId", productId.toString(),
                        "requestedQuantity", requested,
                        "availableQuantity", available
                )
        );
    }

    public InsufficientInventoryException(String message) {
        super(ErrorCode.INVENTORY_INSUFFICIENT, HttpStatus.CONFLICT, message);
    }
}
