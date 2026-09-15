package com.coffeeshop.cart.entity;

import com.coffeeshop.product.entity.Product;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "cart_items")
public class CartItem {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public CartItem() {
    }

    public CartItem(UUID id, Cart cart, Product product, int quantity, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.cart = cart;
        this.product = product;
        this.quantity = quantity;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static CartItem create(Cart cart, Product product, int quantity) {
        Instant now = Instant.now();
        return new CartItem(UUID.randomUUID(), cart, product, quantity, now, now);
    }

    public void updateQuantity(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Cart item quantity must be strictly positive");
        }
        this.quantity = quantity;
        this.updatedAt = Instant.now();
    }

    public void addQuantity(int extraQuantity) {
        if (extraQuantity <= 0) {
            throw new IllegalArgumentException("Quantity addition must be strictly positive");
        }
        this.quantity += extraQuantity;
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public Cart getCart() {
        return cart;
    }

    public void setCart(Cart cart) {
        this.cart = cart;
    }

    public Product getProduct() {
        return product;
    }

    public int getQuantity() {
        return quantity;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
