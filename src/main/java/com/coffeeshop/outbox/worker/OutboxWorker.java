package com.coffeeshop.outbox.worker;

import com.coffeeshop.outbox.entity.OutboxEvent;
import com.coffeeshop.outbox.repository.OutboxRepository;
import com.coffeeshop.outbox.service.OutboxEventDispatcher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;

@Component
@ConditionalOnProperty(name = "app.outbox.enabled", havingValue = "true", matchIfMissing = true)
public class OutboxWorker {

    private static final Logger log = LoggerFactory.getLogger(OutboxWorker.class);

    private final OutboxRepository outboxRepository;
    private final OutboxEventDispatcher eventDispatcher;
    private final TransactionTemplate transactionTemplate;
    private final int batchSize;
    private final int maxRetries;

    public OutboxWorker(
            OutboxRepository outboxRepository,
            OutboxEventDispatcher eventDispatcher,
            PlatformTransactionManager transactionManager,
            @Value("${app.outbox.batch-size:50}") int batchSize,
            @Value("${app.outbox.max-retry-count:5}") int maxRetries
    ) {
        this.outboxRepository = outboxRepository;
        this.eventDispatcher = eventDispatcher;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.batchSize = batchSize;
        this.maxRetries = maxRetries;
    }

    @Scheduled(fixedDelayString = "${app.outbox.fixed-delay-ms:3000}")
    public void processOutbox() {
        List<OutboxEvent> events = outboxRepository.findActionableEvents(
                maxRetries,
                PageRequest.of(0, batchSize)
        );

        if (events.isEmpty()) {
            return;
        }

        log.debug("OutboxWorker: Found {} actionable event(s) to process", events.size());

        for (OutboxEvent event : events) {
            processSingleEvent(event);
        }
    }

    private void processSingleEvent(OutboxEvent event) {
        transactionTemplate.executeWithoutResult(status -> {
            try {
                event.markProcessing();
                outboxRepository.save(event);

                eventDispatcher.dispatch(event);

                event.markProcessed();
                outboxRepository.save(event);
                log.info("Successfully processed outbox event [{}]: {}", event.getId(), event.getEventType());
            } catch (Exception ex) {
                log.error("Failed to process outbox event [{}] (attempt {}/{}): {}",
                        event.getId(), event.getRetryCount() + 1, maxRetries, ex.getMessage());
                event.recordFailure(ex, maxRetries);
                outboxRepository.save(event);
            }
        });
    }
}
