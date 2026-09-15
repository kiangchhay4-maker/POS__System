package com.coffeeshop.inventory.service;

import com.coffeeshop.common.exception.ErrorCode;
import com.coffeeshop.common.exception.ResourceNotFoundException;
import com.coffeeshop.inventory.dto.InventoryResponse;
import com.coffeeshop.inventory.dto.UpdateInventoryStockRequest;
import com.coffeeshop.inventory.entity.Inventory;
import com.coffeeshop.inventory.repository.InventoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    public InventoryService(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    @Transactional(readOnly = true)
    public InventoryResponse getInventory(UUID productId) {
        Inventory inventory = findByProductId(productId);
        return InventoryResponse.fromEntity(inventory);
    }

    @Transactional
    public Inventory initializeInventory(UUID productId, int initialStock) {
        Inventory inventory = Inventory.create(productId, initialStock);
        return inventoryRepository.save(inventory);
    }

    /**
     * Reserves stock for an order item within the caller's active database transaction.
     * Optimistic locking protects against concurrent over-reservation.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void reserveStock(UUID productId, int quantity) {
        Inventory inventory = findByProductId(productId);
        inventory.reserve(quantity);
        inventoryRepository.save(inventory);
    }

    /**
     * Releases reserved stock when an order is cancelled or expires.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void releaseReservation(UUID productId, int quantity) {
        Inventory inventory = findByProductId(productId);
        inventory.release(quantity);
        inventoryRepository.save(inventory);
    }

    /**
     * Commits reserved stock when an order is fulfilled/completed.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void commitReservation(UUID productId, int quantity) {
        Inventory inventory = findByProductId(productId);
        inventory.commit(quantity);
        inventoryRepository.save(inventory);
    }

    @Transactional
    public InventoryResponse adjustStock(UUID productId, UpdateInventoryStockRequest request) {
        Inventory inventory = findByProductId(productId);

        if (request.onHandQuantity() != null) {
            inventory.setOnHand(request.onHandQuantity());
        }
        if (request.replenishQuantity() != null) {
            inventory.replenish(request.replenishQuantity());
        }

        Inventory updated = inventoryRepository.save(inventory);
        return InventoryResponse.fromEntity(updated);
    }

    private Inventory findByProductId(UUID productId) {
        return inventoryRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        ErrorCode.INVENTORY_NOT_FOUND,
                        "Inventory record not found for product id: " + productId
                ));
    }
}
