package com.coffeeshop.payment.dto;

import com.coffeeshop.payment.entity.Payment;
import com.coffeeshop.payment.entity.PaymentMethod;
import com.coffeeshop.payment.entity.PaymentStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        UUID orderId,
        BigDecimal amount,
        String currency,
        PaymentMethod paymentMethod,
        PaymentStatus status,
        String transactionReference,
        String message
) {
    public static PaymentResponse fromEntity(Payment payment, String message) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrderId(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getPaymentMethod(),
                payment.getStatus(),
                payment.getTransactionReference(),
                message != null ? message : payment.getErrorMessage()
        );
    }
}
