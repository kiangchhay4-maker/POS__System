package com.coffeeshop.outbox.repository;

import com.coffeeshop.outbox.entity.OutboxEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OutboxRepository extends JpaRepository<OutboxEvent, UUID> {

    @Query("SELECT e FROM OutboxEvent e WHERE e.status IN ('PENDING', 'FAILED') AND e.retryCount < :maxRetries ORDER BY e.createdAt ASC")
    List<OutboxEvent> findActionableEvents(@Param("maxRetries") int maxRetries, Pageable pageable);
}
