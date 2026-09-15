package com.coffeeshop.order.controller;

import com.coffeeshop.common.response.ApiResponse;
import com.coffeeshop.common.response.PageMeta;
import com.coffeeshop.common.security.CurrentUser;
import com.coffeeshop.common.security.UserPrincipal;
import com.coffeeshop.order.dto.CreateOrderRequest;
import com.coffeeshop.order.dto.OrderResponse;
import com.coffeeshop.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders", description = "Customer order creation, retrieval, and cancellation endpoints")
@PreAuthorize("isAuthenticated()")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @Operation(summary = "Create customer order atomically with inventory reservation and idempotency")
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @CurrentUser UserPrincipal principal,
            @Valid @RequestBody CreateOrderRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        OrderResponse response = orderService.createOrder(principal.id(), request, idempotencyKey);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @Operation(summary = "List current customer orders with pagination")
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(
            @CurrentUser UserPrincipal principal,
            @PageableDefault(page = 0, size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<OrderResponse> pageResult = orderService.getCustomerOrders(principal.id(), pageable);
        PageMeta meta = PageMeta.fromPage(pageResult);
        return ResponseEntity.ok(ApiResponse.success(pageResult.getContent(), meta));
    }

    @Operation(summary = "Get order details by order ID")
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @CurrentUser UserPrincipal principal,
            @PathVariable UUID orderId
    ) {
        OrderResponse response = orderService.getOrderById(orderId, principal.id(), principal.role());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Cancel customer order")
    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @CurrentUser UserPrincipal principal,
            @PathVariable UUID orderId
    ) {
        OrderResponse response = orderService.cancelOrder(orderId, principal.id());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
