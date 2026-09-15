package com.coffeeshop.product.event;

import com.coffeeshop.product.entity.ProductCategory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Domain event published when a new Product is created and persisted.
 * Decouples the Product catalog aggregate from downstream subdomains
 * (e.g., Inventory, Search Indexing, Analytics).
 */
public record ProductCreatedEvent(
        UUID productId,
        String name,
        String description,
        ProductCategory category,
        BigDecimal price,
        String currency,
        boolean available,
        int initialStock,
        Instant occurredAt
) {
    public ProductCreatedEvent {
        if (productId == null) {
            throw new IllegalArgumentException("productId must not be null");
        }
        if (occurredAt == null) {
            occurredAt = Instant.now();
        }
    }

    public ProductCreatedEvent(UUID productId, String name, int initialStock) {
        this(productId, name, null, null, null, null, true, initialStock, Instant.now());
    }

    public static ProductCreatedEvent from(
            UUID productId,
            String name,
            String description,
            ProductCategory category,
            BigDecimal price,
            String currency,
            boolean available,
            int initialStock
    ) {
        return new ProductCreatedEvent(
                productId,
                name,
                description,
                category,
                price,
                currency,
                available,
                initialStock,
                Instant.now()
        );
    }
}
