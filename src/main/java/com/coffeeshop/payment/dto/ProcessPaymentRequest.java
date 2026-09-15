package com.coffeeshop.payment.dto;

import com.coffeeshop.payment.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ProcessPaymentRequest(
        @NotNull(message = "Order ID is required")
        UUID orderId,

        @NotNull(message = "Payment method is required")
        PaymentMethod paymentMethod,

        String paymentToken
) {}
