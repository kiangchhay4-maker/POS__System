package com.coffeeshop.cart.service;

import com.coffeeshop.cart.dto.AddToCartRequest;
import com.coffeeshop.cart.dto.CartResponse;
import com.coffeeshop.cart.dto.UpdateCartItemRequest;
import com.coffeeshop.cart.entity.Cart;
import com.coffeeshop.cart.entity.CartItem;
import com.coffeeshop.cart.repository.CartItemRepository;
import com.coffeeshop.cart.repository.CartRepository;
import com.coffeeshop.common.exception.BusinessConflictException;
import com.coffeeshop.common.exception.ErrorCode;
import com.coffeeshop.common.exception.ResourceNotFoundException;
import com.coffeeshop.inventory.dto.InventoryResponse;
import com.coffeeshop.inventory.service.InventoryService;
import com.coffeeshop.product.entity.Product;
import com.coffeeshop.product.service.ProductService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductService productService;
    private final InventoryService inventoryService;

    public CartService(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductService productService,
            InventoryService inventoryService
    ) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productService = productService;
        this.inventoryService = inventoryService;
    }

    @Transactional
    public CartResponse getCart(UUID customerId) {
        Cart cart = getOrCreateCartEntity(customerId);
        return CartResponse.fromEntity(cart);
    }

    @Transactional
    public CartResponse addItem(UUID customerId, AddToCartRequest request) {
        Cart cart = getOrCreateCartEntity(customerId);
        Product product = productService.findEntityById(request.productId());

        if (!product.isAvailable()) {
            throw new BusinessConflictException(
                    ErrorCode.PRODUCT_UNAVAILABLE,
                    "Product [" + product.getName() + "] is currently unavailable."
            );
        }

        // Validate stock availability
        InventoryResponse inventory = inventoryService.getInventory(product.getId());

        Optional<CartItem> existingItemOpt = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(product.getId()))
                .findFirst();

        int targetTotalQuantity = request.quantity();
        if (existingItemOpt.isPresent()) {
            targetTotalQuantity += existingItemOpt.get().getQuantity();
        }

        if (inventory.availableQuantity() < targetTotalQuantity) {
            throw new BusinessConflictException(
                    ErrorCode.INVENTORY_INSUFFICIENT,
                    String.format("Cannot add %d units of [%s]. Available stock is %d.",
                            targetTotalQuantity, product.getName(), inventory.availableQuantity())
            );
        }

        if (existingItemOpt.isPresent()) {
            existingItemOpt.get().addQuantity(request.quantity());
        } else {
            CartItem newItem = CartItem.create(cart, product, request.quantity());
            cart.addItem(newItem);
        }

        Cart saved = cartRepository.save(cart);
        return CartResponse.fromEntity(saved);
    }

    @Transactional
    public CartResponse updateItemQuantity(UUID customerId, UUID itemId, UpdateCartItemRequest request) {
        Cart cart = getOrCreateCartEntity(customerId);
        CartItem item = cartItemRepository.findByIdAndCartId(itemId, cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CART_ITEM_NOT_FOUND, "Item not found in cart"));

        InventoryResponse inventory = inventoryService.getInventory(item.getProduct().getId());
        if (inventory.availableQuantity() < request.quantity()) {
            throw new BusinessConflictException(
                    ErrorCode.INVENTORY_INSUFFICIENT,
                    String.format("Cannot set quantity to %d. Only %d units available.",
                            request.quantity(), inventory.availableQuantity())
            );
        }

        item.updateQuantity(request.quantity());
        cartItemRepository.save(item);
        return CartResponse.fromEntity(cart);
    }

    @Transactional
    public CartResponse removeItem(UUID customerId, UUID itemId) {
        Cart cart = getOrCreateCartEntity(customerId);
        CartItem item = cartItemRepository.findByIdAndCartId(itemId, cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CART_ITEM_NOT_FOUND, "Item not found in cart"));

        cart.removeItem(item);
        cartItemRepository.delete(item);
        return CartResponse.fromEntity(cart);
    }

    @Transactional
    public void clearCart(UUID customerId) {
        cartRepository.findByCustomerId(customerId).ifPresent(cart -> {
            cart.clear();
            cartRepository.save(cart);
        });
    }

    private Cart getOrCreateCartEntity(UUID customerId) {
        return cartRepository.findByCustomerIdWithItems(customerId)
                .orElseGet(() -> cartRepository.save(Cart.create(customerId)));
    }
}
