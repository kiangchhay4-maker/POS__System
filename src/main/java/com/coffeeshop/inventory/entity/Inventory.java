package com.coffeeshop.inventory.entity;

import com.coffeeshop.common.exception.InsufficientInventoryException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "inventories")
public class Inventory {

    @Id
    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "on_hand_quantity", nullable = false)
    private int onHandQuantity;

    @Column(name = "reserved_quantity", nullable = false)
    private int reservedQuantity;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Inventory() {
    }

    public Inventory(UUID productId, int onHandQuantity, int reservedQuantity, long version, Instant updatedAt) {
        this.productId = productId;
        this.onHandQuantity = onHandQuantity;
        this.reservedQuantity = reservedQuantity;
        this.version = version;
        this.updatedAt = updatedAt;
    }

    public static Inventory create(UUID productId, int initialOnHand) {
        return new Inventory(
                productId,
                Math.max(0, initialOnHand),
                0,
                0L,
                Instant.now()
        );
    }

    public int getAvailableQuantity() {
        return this.onHandQuantity - this.reservedQuantity;
    }

    public void reserve(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Reservation quantity must be strictly positive");
        }
        int available = getAvailableQuantity();
        if (available < quantity) {
            throw new InsufficientInventoryException(productId, quantity, available);
        }
        this.reservedQuantity += quantity;
        this.updatedAt = Instant.now();
    }

    public void release(int quantity) {
        if (quantity <= 0) {
            return;
        }
        this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
        this.updatedAt = Instant.now();
    }

    public void commit(int quantity) {
        if (quantity <= 0) {
            return;
        }
        this.onHandQuantity = Math.max(0, this.onHandQuantity - quantity);
        this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
        this.updatedAt = Instant.now();
    }

    public void replenish(int additionalStock) {
        if (additionalStock <= 0) {
            throw new IllegalArgumentException("Replenishment quantity must be strictly positive");
        }
        this.onHandQuantity += additionalStock;
        this.updatedAt = Instant.now();
    }

    public void setOnHand(int newOnHand) {
        if (newOnHand < this.reservedQuantity) {
            throw new InsufficientInventoryException(
                    String.format("Cannot set onHand stock to [%d] because [%d] items are currently reserved.",
                            newOnHand, this.reservedQuantity)
            );
        }
        this.onHandQuantity = newOnHand;
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getProductId() {
        return productId;
    }

    public int getOnHandQuantity() {
        return onHandQuantity;
    }

    public int getReservedQuantity() {
        return reservedQuantity;
    }

    public long getVersion() {
        return version;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
