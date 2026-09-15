package com.coffeeshop.cart.controller;

import com.coffeeshop.cart.dto.AddToCartRequest;
import com.coffeeshop.cart.dto.CartResponse;
import com.coffeeshop.cart.dto.UpdateCartItemRequest;
import com.coffeeshop.cart.service.CartService;
import com.coffeeshop.common.response.ApiResponse;
import com.coffeeshop.common.security.CurrentUser;
import com.coffeeshop.common.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cart")
@Tag(name = "Cart", description = "Endpoints for customer shopping cart operations")
@PreAuthorize("isAuthenticated()")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @Operation(summary = "Get current customer cart")
    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(@CurrentUser UserPrincipal principal) {
        CartResponse response = cartService.getCart(principal.id());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Add an item to the shopping cart")
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(
            @CurrentUser UserPrincipal principal,
            @Valid @RequestBody AddToCartRequest request
    ) {
        CartResponse response = cartService.addItem(principal.id(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @Operation(summary = "Update cart item quantity")
    @PatchMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateItemQuantity(
            @CurrentUser UserPrincipal principal,
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateCartItemRequest request
    ) {
        CartResponse response = cartService.updateItemQuantity(principal.id(), itemId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Remove an item from the cart")
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(
            @CurrentUser UserPrincipal principal,
            @PathVariable UUID itemId
    ) {
        CartResponse response = cartService.removeItem(principal.id(), itemId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
