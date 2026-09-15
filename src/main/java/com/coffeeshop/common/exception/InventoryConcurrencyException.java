package com.coffeeshop.common.exception;

import org.springframework.http.HttpStatus;

public class InventoryConcurrencyException extends AppException {

    public InventoryConcurrencyException() {
        super(ErrorCode.INVENTORY_CONCURRENT_UPDATE, HttpStatus.CONFLICT,
                "Inventory was updated concurrently by another transaction. Please retry.");
    }

    public InventoryConcurrencyException(String message) {
        super(ErrorCode.INVENTORY_CONCURRENT_UPDATE, HttpStatus.CONFLICT, message);
    }
}
