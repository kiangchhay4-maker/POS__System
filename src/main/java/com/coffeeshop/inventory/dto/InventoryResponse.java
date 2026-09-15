package com.coffeeshop.inventory.dto;

import com.coffeeshop.inventory.entity.Inventory;

import java.util.UUID;

public record InventoryResponse(
        UUID productId,
        int onHandQuantity,
        int reservedQuantity,
        int availableQuantity
) {
    public static InventoryResponse fromEntity(Inventory inventory) {
        return new InventoryResponse(
                inventory.getProductId(),
                inventory.getOnHandQuantity(),
                inventory.getReservedQuantity(),
                inventory.getAvailableQuantity()
        );
    }
}
