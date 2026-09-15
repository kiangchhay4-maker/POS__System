package com.coffeeshop.payment.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class PaymentGatewayClient {

    private static final Logger log = LoggerFactory.getLogger(PaymentGatewayClient.class);

    public sealed interface GatewayResult permits GatewayResult.Success, GatewayResult.Declined, GatewayResult.Timeout {
        record Success(String transactionReference) implements GatewayResult {}
        record Declined(String reason) implements GatewayResult {}
        record Timeout(String message) implements GatewayResult {}
    }

    /**
     * Simulates charging an external payment provider (Stripe, ABA KHQR, etc.).
     * Simulates network delays and partial failure scenarios.
     */
    public GatewayResult charge(UUID paymentId, BigDecimal amount, String currency, String token) {
        log.info("Contacting external payment gateway for payment [{}] amount [{} {}]", paymentId, amount, currency);

        // Simulation hook for test cases or special tokens:
        if ("token_timeout".equalsIgnoreCase(token)) {
            log.warn("Payment gateway simulated network timeout for payment [{}]", paymentId);
            return new GatewayResult.Timeout("Gateway network timeout after 10000ms. Transaction state ambiguous.");
        }

        if ("token_decline".equalsIgnoreCase(token)) {
            log.warn("Payment gateway declined transaction for payment [{}]", paymentId);
            return new GatewayResult.Declined("Insufficient customer funds or card expired.");
        }

        // Default successful transaction
        String ref = "txn_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        log.info("Payment gateway approved transaction [{}] for payment [{}]", ref, paymentId);
        return new GatewayResult.Success(ref);
    }

    /**
     * Queries gateway for reconciliation of UNKNOWN payment status.
     */
    public GatewayResult queryStatus(String paymentId) {
        log.info("Reconciling external transaction for payment [{}]", paymentId);
        // By default, during reconciliation after timeout, returns confirmed success
        return new GatewayResult.Success("reconciled_" + UUID.randomUUID().toString().substring(0, 8));
    }
}
