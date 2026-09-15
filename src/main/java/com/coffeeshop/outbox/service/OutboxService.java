package com.coffeeshop.outbox.service;

import com.coffeeshop.common.util.JsonUtil;
import com.coffeeshop.outbox.entity.OutboxEvent;
import com.coffeeshop.outbox.repository.OutboxRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class OutboxService {

    private final OutboxRepository outboxRepository;

    public OutboxService(OutboxRepository outboxRepository) {
        this.outboxRepository = outboxRepository;
    }

    /**
     * Saves an outbox event within an active business transaction.
     */
    @Transactional
    public OutboxEvent saveEvent(String aggregateType, UUID aggregateId, String eventType, Object payload) {
        String json = JsonUtil.toJson(payload);
        OutboxEvent event = OutboxEvent.create(aggregateType, aggregateId, eventType, json);
        return outboxRepository.save(event);
    }
}
