package com.coffeeshop.outbox.service;

import com.coffeeshop.outbox.entity.OutboxEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class DefaultOutboxEventDispatcher implements OutboxEventDispatcher {

    private static final Logger log = LoggerFactory.getLogger(DefaultOutboxEventDispatcher.class);

    private final ApplicationEventPublisher applicationEventPublisher;

    public DefaultOutboxEventDispatcher(ApplicationEventPublisher applicationEventPublisher) {
        this.applicationEventPublisher = applicationEventPublisher;
    }

    @Override
    public void dispatch(OutboxEvent event) throws Exception {
        log.info("Dispatching outbox event: id={}, type={}, aggregateId={}",
                event.getId(), event.getEventType(), event.getAggregateId());

        DomainOutboxEvent domainEvent = new DomainOutboxEvent(
                event.getId(),
                event.getAggregateType(),
                event.getAggregateId(),
                event.getEventType(),
                event.getPayload()
        );

        applicationEventPublisher.publishEvent(domainEvent);
    }

    public record DomainOutboxEvent(
            UUID eventId,
            String aggregateType,
            UUID aggregateId,
            String eventType,
            String payload
    ) {}
}
