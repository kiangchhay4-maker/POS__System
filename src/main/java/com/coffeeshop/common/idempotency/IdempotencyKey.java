package com.coffeeshop.common.idempotency;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "idempotency_keys")
public class IdempotencyKey {

    @Id
    private UUID id;

    @Column(name = "\"key\"", nullable = false, unique = true)
    private String key;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "request_hash", nullable = false)
    private String requestHash;

    @Column(name = "response_status")
    private Integer responseStatus;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "response_body", columnDefinition = "jsonb")
    private String responseBody;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    public IdempotencyKey() {
    }

    public IdempotencyKey(
            UUID id,
            String key,
            UUID userId,
            String requestHash,
            Integer responseStatus,
            String responseBody,
            Instant createdAt,
            Instant expiresAt
    ) {
        this.id = id;
        this.key = key;
        this.userId = userId;
        this.requestHash = requestHash;
        this.responseStatus = responseStatus;
        this.responseBody = responseBody;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    public static IdempotencyKey createPending(String key, UUID userId, String requestHash, long ttlMinutes) {
        Instant now = Instant.now();
        return new IdempotencyKey(
                UUID.randomUUID(),
                key,
                userId,
                requestHash,
                null,
                null,
                now,
                now.plusSeconds(ttlMinutes * 60)
        );
    }

    public void complete(int status, String responseJson) {
        this.responseStatus = status;
        this.responseBody = responseJson;
    }

    public boolean isCompleted() {
        return responseStatus != null && responseBody != null;
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public String getKey() {
        return key;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getRequestHash() {
        return requestHash;
    }

    public Integer getResponseStatus() {
        return responseStatus;
    }

    public String getResponseBody() {
        return responseBody;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }
}
