package com.coffeeshop.order.dto;

import com.coffeeshop.order.entity.Order;
import com.coffeeshop.order.entity.OrderStatus;
import com.coffeeshop.order.entity.OrderType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        UUID customerId,
        OrderType orderType,
        OrderStatus status,
        BigDecimal totalAmount,
        String currency,
        List<OrderItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
    public static OrderResponse fromEntity(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems() != null
                ? order.getItems().stream().map(OrderItemResponse::fromEntity).toList()
                : List.of();

        return new OrderResponse(
                order.getId(),
                order.getCustomerId(),
                order.getOrderType(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getCurrency(),
                itemResponses,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
