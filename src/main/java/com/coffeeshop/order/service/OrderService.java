package com.coffeeshop.order.service;

import com.coffeeshop.common.audit.AuditService;
import com.coffeeshop.common.exception.BusinessConflictException;
import com.coffeeshop.common.exception.ErrorCode;
import com.coffeeshop.common.exception.ResourceNotFoundException;
import com.coffeeshop.common.idempotency.IdempotencyService;
import com.coffeeshop.common.security.Role;
import com.coffeeshop.inventory.service.InventoryService;
import com.coffeeshop.order.dto.*;
import com.coffeeshop.order.entity.Order;
import com.coffeeshop.order.entity.OrderItem;
import com.coffeeshop.order.entity.OrderStatus;
import com.coffeeshop.order.repository.OrderRepository;
import com.coffeeshop.outbox.service.OutboxService;
import com.coffeeshop.product.entity.Product;
import com.coffeeshop.product.service.ProductService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductService productService;
    private final InventoryService inventoryService;
    private final OutboxService outboxService;
    private final IdempotencyService idempotencyService;
    private final AuditService auditService;

    public OrderService(
            OrderRepository orderRepository,
            ProductService productService,
            InventoryService inventoryService,
            OutboxService outboxService,
            IdempotencyService idempotencyService,
            AuditService auditService
    ) {
        this.orderRepository = orderRepository;
        this.productService = productService;
        this.inventoryService = inventoryService;
        this.outboxService = outboxService;
        this.idempotencyService = idempotencyService;
        this.auditService = auditService;
    }

    /**
     * Atomically creates an order, reserves inventory, registers outbox event, and records idempotency.
     * All operations reside strictly inside ONE database transaction.
     */
    @Transactional
    public OrderResponse createOrder(UUID customerId, CreateOrderRequest request, String idempotencyKey) {
        if (request.items() == null || request.items().isEmpty()) {
            throw new BusinessConflictException(ErrorCode.ORDER_EMPTY_ITEMS, "Order must contain at least one item.");
        }

        // 1. Check Idempotency Key if supplied
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            String requestHash = idempotencyService.computeHash(request);
            Optional<OrderResponse> cached = idempotencyService.checkAndLockKey(
                    idempotencyKey, customerId, requestHash, OrderResponse.class
            );
            if (cached.isPresent()) {
                return cached.get();
            }
        }

        // 2. Validate products and calculate prices strictly server-side
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderItemRequest itemReq : request.items()) {
            Product product = productService.findEntityById(itemReq.productId());
            if (!product.isAvailable()) {
                throw new BusinessConflictException(
                        ErrorCode.PRODUCT_UNAVAILABLE,
                        "Product [" + product.getName() + "] is currently unavailable."
                );
            }

            // 3. Atomically reserve inventory (protected by optimistic locking)
            inventoryService.reserveStock(product.getId(), itemReq.quantity());

            BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(itemReq.quantity()));
            totalAmount = totalAmount.add(subtotal);

            OrderItem orderItem = OrderItem.create(
                    null,
                    product.getId(),
                    product.getName(),
                    product.getPrice(),
                    itemReq.quantity()
            );
            orderItems.add(orderItem);
        }

        // 4. Create Order Entity
        Order order = Order.create(
                customerId,
                request.orderType(),
                totalAmount,
                "USD",
                idempotencyKey
        );

        for (OrderItem orderItem : orderItems) {
            order.addItem(orderItem);
        }

        // 5. Persist order with cascaded items
        Order savedOrder = orderRepository.save(order);

        // 6. Save Outbox Event (Atomic with Order creation)
        Map<String, Object> eventPayload = Map.of(
                "orderId", savedOrder.getId().toString(),
                "customerId", customerId.toString(),
                "totalAmount", savedOrder.getTotalAmount(),
                "status", savedOrder.getStatus().name()
        );
        outboxService.saveEvent("ORDER", savedOrder.getId(), "ORDER_CREATED", eventPayload);

        OrderResponse response = OrderResponse.fromEntity(savedOrder);

        // 7. Complete idempotency record
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            idempotencyService.recordSuccess(idempotencyKey, customerId, 201, response);
        }

        return response;
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID orderId, UUID requesterId, Role requesterRole) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.ORDER_NOT_FOUND, "Order not found with id: " + orderId));

        if (requesterRole == Role.CUSTOMER && !order.getCustomerId().equals(requesterId)) {
            throw new ResourceNotFoundException(ErrorCode.ORDER_NOT_FOUND, "Order not found with id: " + orderId);
        }

        return OrderResponse.fromEntity(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getCustomerOrders(UUID customerId, Pageable pageable) {
        return orderRepository.findByCustomerId(customerId, pageable)
                .map(OrderResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> searchOrders(OrderStatus status, UUID customerId, Pageable pageable) {
        return orderRepository.searchOrders(status, customerId, pageable)
                .map(OrderResponse::fromEntity);
    }

    /**
     * Transition order status adhering to the explicit finite state machine.
     * Manages inventory release/commit and asynchronous event dispatch.
     */
    @Transactional
    public OrderResponse updateOrderStatus(UUID orderId, OrderStatus newStatus, UUID actorId, Role actorRole) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.ORDER_NOT_FOUND, "Order not found with id: " + orderId));

        OrderStatus oldStatus = order.getStatus();
        order.transitionTo(newStatus);

        // Side-effects on inventory based on terminal states
        if (newStatus == OrderStatus.CANCELLED) {
            for (OrderItem item : order.getItems()) {
                inventoryService.releaseReservation(item.getProductId(), item.getQuantity());
            }
        } else if (newStatus == OrderStatus.COMPLETED) {
            for (OrderItem item : order.getItems()) {
                inventoryService.commitReservation(item.getProductId(), item.getQuantity());
            }
        }

        Order saved = orderRepository.save(order);

        // Outbox event for order status change
        Map<String, Object> payload = Map.of(
                "orderId", saved.getId().toString(),
                "customerId", saved.getCustomerId().toString(),
                "oldStatus", oldStatus.name(),
                "newStatus", newStatus.name()
        );
        outboxService.saveEvent("ORDER", saved.getId(), "ORDER_STATUS_CHANGED", payload);

        // Record Audit log
        auditService.recordAudit(
                actorId,
                actorRole != null ? actorRole.name() : "SYSTEM",
                "ORDER_STATUS_CHANGED",
                "ORDER",
                saved.getId(),
                oldStatus.name(),
                newStatus.name(),
                null
        );

        return OrderResponse.fromEntity(saved);
    }

    @Transactional
    public OrderResponse cancelOrder(UUID orderId, UUID customerId) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.ORDER_NOT_FOUND, "Order not found with id: " + orderId));

        if (!order.getCustomerId().equals(customerId)) {
            throw new ResourceNotFoundException(ErrorCode.ORDER_NOT_FOUND, "Order not found with id: " + orderId);
        }

        return updateOrderStatus(orderId, OrderStatus.CANCELLED, customerId, Role.CUSTOMER);
    }
}
