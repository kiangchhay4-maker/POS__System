package com.coffeeshop.payment.service;

import com.coffeeshop.common.audit.AuditService;
import com.coffeeshop.common.exception.BusinessConflictException;
import com.coffeeshop.common.exception.ErrorCode;
import com.coffeeshop.common.exception.PaymentProcessingException;
import com.coffeeshop.common.exception.ResourceNotFoundException;
import com.coffeeshop.order.entity.Order;
import com.coffeeshop.order.entity.OrderStatus;
import com.coffeeshop.order.repository.OrderRepository;
import com.coffeeshop.outbox.service.OutboxService;
import com.coffeeshop.payment.client.PaymentGatewayClient;
import com.coffeeshop.payment.dto.PaymentResponse;
import com.coffeeshop.payment.dto.ProcessPaymentRequest;
import com.coffeeshop.payment.entity.Payment;
import com.coffeeshop.payment.entity.PaymentMethod;
import com.coffeeshop.payment.entity.PaymentStatus;
import com.coffeeshop.payment.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final PaymentGatewayClient gatewayClient;
    private final OutboxService outboxService;
    private final AuditService auditService;
    private final TransactionTemplate transactionTemplate;

    public PaymentService(
            PaymentRepository paymentRepository,
            OrderRepository orderRepository,
            PaymentGatewayClient gatewayClient,
            OutboxService outboxService,
            AuditService auditService,
            PlatformTransactionManager transactionManager
    ) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.gatewayClient = gatewayClient;
        this.outboxService = outboxService;
        this.auditService = auditService;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    /**
     * Executes payment workflow cleanly respecting the external network boundary:
     * DB transaction is committed BEFORE calling external gateway, avoiding connection pool starvation.
     */
    public PaymentResponse processPayment(UUID customerId, ProcessPaymentRequest request) {
        // Phase 1: Local DB Transaction - Verify order and register INITIATED payment
        Payment payment = transactionTemplate.execute(status ->
                initiatePaymentRecordInternal(customerId, request.orderId(), request.paymentMethod())
        );

        if (payment == null) {
            throw new IllegalStateException("Failed to initiate payment transaction");
        }

        // Phase 2: Outside DB Transaction - External Gateway Network Call
        PaymentGatewayClient.GatewayResult gatewayResult = gatewayClient.charge(
                payment.getId(),
                payment.getAmount(),
                payment.getCurrency(),
                request.paymentToken()
        );

        // Phase 3: Local DB Transaction - Settle state machine based on gateway result
        return transactionTemplate.execute(status ->
                settlePaymentRecordInternal(payment.getId(), gatewayResult)
        );
    }

    private Payment initiatePaymentRecordInternal(UUID customerId, UUID orderId, PaymentMethod paymentMethod) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.ORDER_NOT_FOUND, "Order not found: " + orderId));

        if (!order.getCustomerId().equals(customerId)) {
            throw new ResourceNotFoundException(ErrorCode.ORDER_NOT_FOUND, "Order not found: " + orderId);
        }

        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.CONFIRMED) {
            throw new BusinessConflictException(ErrorCode.PAYMENT_ALREADY_PROCESSED, "Order is already paid and confirmed.");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessConflictException(ErrorCode.ORDER_ALREADY_CANCELLED, "Cannot pay for a cancelled order.");
        }

        Optional<Payment> existingPaymentOpt = paymentRepository.findByOrderId(orderId);
        if (existingPaymentOpt.isPresent() && existingPaymentOpt.get().getStatus() == PaymentStatus.SUCCEEDED) {
            throw new BusinessConflictException(ErrorCode.PAYMENT_ALREADY_PROCESSED, "Payment has already succeeded for this order.");
        }

        if (order.getStatus() == OrderStatus.CREATED) {
            order.transitionTo(OrderStatus.PAYMENT_PENDING);
            orderRepository.save(order);
        }

        Payment payment = Payment.initiate(order.getId(), order.getTotalAmount(), order.getCurrency(), paymentMethod);
        return paymentRepository.save(payment);
    }

    private PaymentResponse settlePaymentRecordInternal(UUID paymentId, PaymentGatewayClient.GatewayResult result) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PAYMENT_NOT_FOUND, "Payment not found: " + paymentId));

        Order order = orderRepository.findById(payment.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.ORDER_NOT_FOUND, "Order not found"));

        if (result instanceof PaymentGatewayClient.GatewayResult.Success success) {
            payment.markSucceeded(success.transactionReference());
            order.transitionTo(OrderStatus.CONFIRMED);
            orderRepository.save(order);
            Payment saved = paymentRepository.save(payment);

            outboxService.saveEvent("PAYMENT", saved.getId(), "PAYMENT_SUCCEEDED", Map.of(
                    "paymentId", saved.getId().toString(),
                    "orderId", order.getId().toString(),
                    "amount", saved.getAmount()
            ));

            auditService.recordAudit(
                    order.getCustomerId(),
                    "CUSTOMER",
                    "PAYMENT_SUCCEEDED",
                    "PAYMENT",
                    saved.getId(),
                    PaymentStatus.INITIATED.name(),
                    PaymentStatus.SUCCEEDED.name(),
                    null
            );

            return PaymentResponse.fromEntity(saved, "Payment processed and order confirmed successfully.");

        } else if (result instanceof PaymentGatewayClient.GatewayResult.Declined declined) {
            payment.markFailed(declined.reason());
            Payment saved = paymentRepository.save(payment);

            outboxService.saveEvent("PAYMENT", saved.getId(), "PAYMENT_FAILED", Map.of(
                    "paymentId", saved.getId().toString(),
                    "orderId", order.getId().toString(),
                    "reason", declined.reason()
            ));

            throw new PaymentProcessingException(
                    ErrorCode.PAYMENT_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Payment was declined by the provider: " + declined.reason(),
                    PaymentResponse.fromEntity(saved, "Payment declined.")
            );

        } else if (result instanceof PaymentGatewayClient.GatewayResult.Timeout timeout) {
            // TIMEOUT does NOT mean FAILED. Set state to UNKNOWN and trigger reconciliation
            payment.markUnknown(timeout.message());
            Payment saved = paymentRepository.save(payment);

            outboxService.saveEvent("PAYMENT", saved.getId(), "PAYMENT_UNKNOWN_TIMEOUT", Map.of(
                    "paymentId", saved.getId().toString(),
                    "orderId", order.getId().toString(),
                    "timeoutMessage", timeout.message()
            ));

            log.warn("Payment [{}] encountered timeout. Marked as UNKNOWN for background reconciliation.", saved.getId());

            return PaymentResponse.fromEntity(
                    saved,
                    "Payment provider timed out. Your order is pending verification; please do not retry immediately."
            );
        }

        throw new IllegalStateException("Unrecognized gateway result type");
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderId(UUID orderId, UUID customerId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PAYMENT_NOT_FOUND, "No payment found for order: " + orderId));

        return PaymentResponse.fromEntity(payment, null);
    }

    /**
     * Background job to reconcile payments in UNKNOWN state.
     */
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void reconcileUnknownPayments() {
        List<Payment> unknownPayments = paymentRepository.findByStatus(PaymentStatus.UNKNOWN);
        if (unknownPayments.isEmpty()) {
            return;
        }

        log.info("Reconciliation job: Found {} UNKNOWN payment(s) to reconcile", unknownPayments.size());
        for (Payment payment : unknownPayments) {
            try {
                PaymentGatewayClient.GatewayResult result = gatewayClient.queryStatus(payment.getId().toString());
                if (result instanceof PaymentGatewayClient.GatewayResult.Success success) {
                    payment.markSucceeded(success.transactionReference());
                    orderRepository.findById(payment.getOrderId()).ifPresent(order -> {
                        order.transitionTo(OrderStatus.CONFIRMED);
                        orderRepository.save(order);
                    });
                    paymentRepository.save(payment);
                    log.info("Successfully reconciled payment [{}] to SUCCEEDED", payment.getId());
                }
            } catch (Exception ex) {
                log.error("Failed to reconcile payment [{}]: {}", payment.getId(), ex.getMessage());
            }
        }
    }
}
