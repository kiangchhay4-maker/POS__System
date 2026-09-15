package com.coffeeshop.inventory.listener;

import com.coffeeshop.inventory.service.InventoryService;
import com.coffeeshop.product.event.ProductCreatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Event listener within the Inventory subdomain reacting to Product domain events.
 * Enables loose coupling between Product and Inventory modules under DDD principles.
 */
@Component
public class InventoryEventListener {

    private static final Logger log = LoggerFactory.getLogger(InventoryEventListener.class);

    private final InventoryService inventoryService;

    public InventoryEventListener(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @EventListener
    @Transactional(propagation = Propagation.MANDATORY)
    public void onProductCreated(ProductCreatedEvent event) {
        log.info("EVENT_HANDLE: Initializing inventory for newly created product ID: {} with initialStock: {}",
                event.productId(), event.initialStock());
        inventoryService.initializeInventory(event.productId(), event.initialStock());
    }
}
