package com.coffeeshop.payment.service;

import com.coffeeshop.common.audit.AuditService;
import com.coffeeshop.order.entity.Order;
import com.coffeeshop.order.entity.OrderStatus;
import com.coffeeshop.order.entity.OrderType;
import com.coffeeshop.order.repository.OrderRepository;
import com.coffeeshop.outbox.service.OutboxService;
import com.coffeeshop.payment.client.PaymentGatewayClient;
import com.coffeeshop.payment.dto.PaymentResponse;
import com.coffeeshop.payment.dto.ProcessPaymentRequest;
import com.coffeeshop.payment.entity.Payment;
import com.coffeeshop.payment.entity.PaymentMethod;
import com.coffeeshop.payment.entity.PaymentStatus;
import com.coffeeshop.payment.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private PaymentGatewayClient gatewayClient;
    @Mock
    private OutboxService outboxService;
    @Mock
    private AuditService auditService;

    private PaymentService paymentService;

    private UUID customerId;
    private UUID orderId;
    private Order order;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        orderId = UUID.randomUUID();
        order = Order.create(customerId, OrderType.TAKEAWAY, new BigDecimal("10.00"), "USD", null);

        org.springframework.transaction.support.AbstractPlatformTransactionManager tm =
                new org.springframework.transaction.support.AbstractPlatformTransactionManager() {
                    @Override
                    protected Object doGetTransaction() {
                        return new Object();
                    }
                    @Override
                    protected void doBegin(Object transaction, org.springframework.transaction.TransactionDefinition definition) {}
                    @Override
                    protected void doCommit(org.springframework.transaction.support.DefaultTransactionStatus status) {}
                    @Override
                    protected void doRollback(org.springframework.transaction.support.DefaultTransactionStatus status) {}
                };
        paymentService = new PaymentService(
                paymentRepository,
                orderRepository,
                gatewayClient,
                outboxService,
                auditService,
                tm
        );
    }

    @Test
    @DisplayName("Should confirm order and set payment to SUCCEEDED upon approved gateway response")
    void shouldHandleSuccessfulPayment() {
        ProcessPaymentRequest request = new ProcessPaymentRequest(orderId, PaymentMethod.KHQR, "valid_token");
        Payment payment = Payment.initiate(orderId, new BigDecimal("10.00"), "USD", PaymentMethod.KHQR);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.findById(any())).thenReturn(Optional.of(payment));
        when(gatewayClient.charge(any(), any(), any(), eq("valid_token")))
                .thenReturn(new PaymentGatewayClient.GatewayResult.Success("txn_abc123"));

        PaymentResponse response = paymentService.processPayment(customerId, request);

        assertThat(response).isNotNull();
        assertThat(response.status()).isEqualTo(PaymentStatus.SUCCEEDED);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        verify(outboxService, times(1)).saveEvent(eq("PAYMENT"), any(), eq("PAYMENT_SUCCEEDED"), any());
    }

    @Test
    @DisplayName("Should mark status as UNKNOWN when gateway times out, leaving order in PAYMENT_PENDING for reconciliation")
    void shouldHandleTimeoutAsUnknownState() {
        ProcessPaymentRequest request = new ProcessPaymentRequest(orderId, PaymentMethod.CREDIT_CARD, "token_timeout");
        Payment payment = Payment.initiate(orderId, new BigDecimal("10.00"), "USD", PaymentMethod.CREDIT_CARD);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.findById(any())).thenReturn(Optional.of(payment));
        when(gatewayClient.charge(any(), any(), any(), eq("token_timeout")))
                .thenReturn(new PaymentGatewayClient.GatewayResult.Timeout("Read timed out"));

        PaymentResponse response = paymentService.processPayment(customerId, request);

        assertThat(response).isNotNull();
        assertThat(response.status()).isEqualTo(PaymentStatus.UNKNOWN);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYMENT_PENDING);
        verify(outboxService, times(1)).saveEvent(eq("PAYMENT"), any(), eq("PAYMENT_UNKNOWN_TIMEOUT"), any());
    }
}
