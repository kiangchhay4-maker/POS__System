package com.coffeeshop.order.service;

import com.coffeeshop.common.audit.AuditService;
import com.coffeeshop.common.idempotency.IdempotencyService;
import com.coffeeshop.common.security.Role;
import com.coffeeshop.inventory.service.InventoryService;
import com.coffeeshop.order.dto.CreateOrderRequest;
import com.coffeeshop.order.dto.OrderItemRequest;
import com.coffeeshop.order.dto.OrderResponse;
import com.coffeeshop.order.entity.Order;
import com.coffeeshop.order.entity.OrderStatus;
import com.coffeeshop.order.entity.OrderType;
import com.coffeeshop.order.repository.OrderRepository;
import com.coffeeshop.outbox.service.OutboxService;
import com.coffeeshop.product.entity.Product;
import com.coffeeshop.product.entity.ProductCategory;
import com.coffeeshop.product.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ProductService productService;
    @Mock
    private InventoryService inventoryService;
    @Mock
    private OutboxService outboxService;
    @Mock
    private IdempotencyService idempotencyService;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private OrderService orderService;

    private UUID customerId;
    private UUID productId;
    private Product product;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        product = Product.create("Iced Latte", "Double shot espresso", ProductCategory.COFFEE, new BigDecimal("3.50"), "USD", true);
        productId = product.getId();
    }

    @Test
    @DisplayName("Should create order, calculate prices server-side, reserve inventory, and register outbox event")
    void shouldCreateOrderAtomically() {
        CreateOrderRequest request = new CreateOrderRequest(
                List.of(new OrderItemRequest(productId, 2)),
                OrderType.TAKEAWAY
        );

        when(idempotencyService.computeHash(any())).thenReturn("sample_hash");
        when(idempotencyService.checkAndLockKey(anyString(), eq(customerId), anyString(), eq(OrderResponse.class)))
                .thenReturn(Optional.empty());
        when(productService.findEntityById(productId)).thenReturn(product);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.createOrder(customerId, request, "key_123");

        assertThat(response).isNotNull();
        assertThat(response.customerId()).isEqualTo(customerId);
        assertThat(response.status()).isEqualTo(OrderStatus.CREATED);
        // 2 items * $3.50 = $7.00 calculated strictly server-side
        assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("7.00"));

        // Verify inventory reservation happened
        verify(inventoryService, times(1)).reserveStock(productId, 2);

        // Verify outbox event was recorded atomically
        verify(outboxService, times(1)).saveEvent(eq("ORDER"), any(UUID.class), eq("ORDER_CREATED"), any());

        // Verify idempotency record saved
        verify(idempotencyService, times(1)).recordSuccess(eq("key_123"), eq(customerId), eq(201), any());
    }

    @Test
    @DisplayName("Should return cached response when idempotency key is reused")
    void shouldReturnCachedResponseOnIdempotentRetry() {
        CreateOrderRequest request = new CreateOrderRequest(
                List.of(new OrderItemRequest(productId, 2)),
                OrderType.TAKEAWAY
        );
        OrderResponse cachedResponse = new OrderResponse(
                UUID.randomUUID(), customerId, OrderType.TAKEAWAY, OrderStatus.CREATED,
                new BigDecimal("7.00"), "USD", List.of(), null, null
        );

        when(idempotencyService.computeHash(any())).thenReturn("sample_hash");
        when(idempotencyService.checkAndLockKey(eq("key_duplicate"), eq(customerId), anyString(), eq(OrderResponse.class)))
                .thenReturn(Optional.of(cachedResponse));

        OrderResponse result = orderService.createOrder(customerId, request, "key_duplicate");

        assertThat(result).isSameAs(cachedResponse);
        verify(orderRepository, never()).save(any());
        verify(inventoryService, never()).reserveStock(any(), anyInt());
    }

    @Test
    @DisplayName("Should release inventory reservation when order is cancelled")
    void shouldReleaseInventoryWhenOrderCancelled() {
        Order order = Order.create(customerId, OrderType.TAKEAWAY, new BigDecimal("3.50"), "USD", null);
        order.addItem(com.coffeeshop.order.entity.OrderItem.create(order, productId, "Iced Latte", new BigDecimal("3.50"), 1));

        when(orderRepository.findByIdWithItems(order.getId())).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderService.updateOrderStatus(order.getId(), OrderStatus.CANCELLED, customerId, Role.CUSTOMER);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        verify(inventoryService, times(1)).releaseReservation(productId, 1);
        verify(outboxService, times(1)).saveEvent(eq("ORDER"), eq(order.getId()), eq("ORDER_STATUS_CHANGED"), any());
    }
}
