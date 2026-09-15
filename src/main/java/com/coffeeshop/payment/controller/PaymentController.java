package com.coffeeshop.payment.controller;

import com.coffeeshop.common.response.ApiResponse;
import com.coffeeshop.common.security.CurrentUser;
import com.coffeeshop.common.security.UserPrincipal;
import com.coffeeshop.payment.dto.PaymentResponse;
import com.coffeeshop.payment.dto.ProcessPaymentRequest;
import com.coffeeshop.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@Tag(name = "Payments", description = "Endpoints for processing order payments and payment status queries")
@PreAuthorize("isAuthenticated()")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @Operation(summary = "Process payment for an order with partial failure and timeout handling")
    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> processPayment(
            @CurrentUser UserPrincipal principal,
            @Valid @RequestBody ProcessPaymentRequest request
    ) {
        PaymentResponse response = paymentService.processPayment(principal.id(), request);
        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(response));
    }

    @Operation(summary = "Get payment status for a specific order")
    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByOrderId(
            @CurrentUser UserPrincipal principal,
            @PathVariable UUID orderId
    ) {
        PaymentResponse response = paymentService.getPaymentByOrderId(orderId, principal.id());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
