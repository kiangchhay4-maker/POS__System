package com.coffeeshop.notification.service;

import com.coffeeshop.common.util.JsonUtil;
import com.coffeeshop.notification.entity.Notification;
import com.coffeeshop.notification.repository.NotificationRepository;
import com.coffeeshop.outbox.service.DefaultOutboxEventDispatcher;
import com.fasterxml.jackson.core.type.TypeReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Async
    @EventListener
    @Transactional
    public void onDomainEvent(DefaultOutboxEventDispatcher.DomainOutboxEvent event) {
        log.info("NotificationService received event: type={}, aggregateId={}", event.eventType(), event.aggregateId());

        try {
            Map<String, Object> payload = JsonUtil.fromJson(
                    event.payload(),
                    new TypeReference<Map<String, Object>>() {}
            );

            if (payload == null) {
                return;
            }

            switch (event.eventType()) {
                case "ORDER_CREATED" -> handleOrderCreated(payload);
                case "PAYMENT_SUCCEEDED" -> handlePaymentSucceeded(payload);
                case "ORDER_STATUS_CHANGED" -> handleOrderStatusChanged(payload);
                default -> log.debug("NotificationService ignoring unhandled event type: {}", event.eventType());
            }
        } catch (Exception ex) {
            log.error("Failed to process event [{}] in NotificationService: {}", event.eventId(), ex.getMessage(), ex);
        }
    }

    private void handleOrderCreated(Map<String, Object> payload) {
        String customerIdStr = (String) payload.get("customerId");
        String orderIdStr = (String) payload.get("orderId");
        if (customerIdStr != null) {
            UUID customerId = UUID.fromString(customerIdStr);
            Notification notification = Notification.create(
                    customerId,
                    "SMS",
                    "Order Placed Successfully",
                    "Your order [" + orderIdStr + "] has been received and is awaiting confirmation."
            );
            notification.markSent();
            notificationRepository.save(notification);
            log.info("Sent ORDER_CREATED notification to user [{}]", customerId);
        }
    }

    private void handlePaymentSucceeded(Map<String, Object> payload) {
        String orderIdStr = (String) payload.get("orderId");
        log.info("Payment confirmed for order [{}]. Receipt notification queued.", orderIdStr);
    }

    private void handleOrderStatusChanged(Map<String, Object> payload) {
        String customerIdStr = (String) payload.get("customerId");
        String newStatus = (String) payload.get("newStatus");
        String orderIdStr = (String) payload.get("orderId");

        if (customerIdStr != null) {
            UUID customerId = UUID.fromString(customerIdStr);
            String message = switch (newStatus) {
                case "CONFIRMED" -> "Your order [" + orderIdStr + "] is confirmed and will be prepared shortly.";
                case "PREPARING" -> "Our baristas are now preparing your coffee order [" + orderIdStr + "]!";
                case "READY" -> "Your coffee order [" + orderIdStr + "] is READY for pickup at the counter!";
                case "COMPLETED" -> "Thank you for visiting! Your order [" + orderIdStr + "] has been completed.";
                case "CANCELLED" -> "Your order [" + orderIdStr + "] has been cancelled.";
                default -> "Your order status was updated to: " + newStatus;
            };

            Notification notification = Notification.create(
                    customerId,
                    "PUSH",
                    "Order Status Update",
                    message
            );
            notification.markSent();
            notificationRepository.save(notification);
            log.info("Sent ORDER_STATUS_CHANGED notification ({}) to user [{}]", newStatus, customerId);
        }
    }
}
