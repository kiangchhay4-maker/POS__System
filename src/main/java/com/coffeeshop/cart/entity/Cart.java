package com.coffeeshop.cart.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "carts")
public class Cart {

    @Id
    private UUID id;

    @Column(name = "customer_id", nullable = false, unique = true)
    private UUID customerId;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CartItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Cart() {
    }

    public Cart(UUID id, UUID customerId, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.customerId = customerId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static Cart create(UUID customerId) {
        Instant now = Instant.now();
        return new Cart(UUID.randomUUID(), customerId, now, now);
    }

    public void addItem(CartItem item) {
        this.items.add(item);
        item.setCart(this);
        this.updatedAt = Instant.now();
    }

    public void removeItem(CartItem item) {
        this.items.remove(item);
        item.setCart(null);
        this.updatedAt = Instant.now();
    }

    public void clear() {
        this.items.clear();
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public List<CartItem> getItems() {
        return items;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
