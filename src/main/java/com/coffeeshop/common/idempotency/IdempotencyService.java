package com.coffeeshop.common.idempotency;

import com.coffeeshop.common.exception.BusinessConflictException;
import com.coffeeshop.common.exception.ErrorCode;
import com.coffeeshop.common.exception.IdempotencyException;
import com.coffeeshop.common.util.JsonUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
public class IdempotencyService {

    private final IdempotencyKeyRepository repository;
    private final long ttlMinutes;

    public IdempotencyService(
            IdempotencyKeyRepository repository,
            @Value("${app.idempotency.ttl-minutes:1440}") long ttlMinutes
    ) {
        this.repository = repository;
        this.ttlMinutes = ttlMinutes;
    }

    public String computeHash(Object requestPayload) {
        if (requestPayload == null) {
            return "";
        }
        try {
            String json = JsonUtil.toJson(requestPayload);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(json.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public <T> Optional<T> checkAndLockKey(String key, UUID userId, String requestHash, Class<T> responseType) {
        Optional<IdempotencyKey> existingOpt = repository.findByKeyAndUserId(key, userId);

        if (existingOpt.isPresent()) {
            IdempotencyKey existing = existingOpt.get();

            if (existing.isExpired()) {
                repository.delete(existing);
            } else {
                if (!existing.getRequestHash().equals(requestHash)) {
                    throw new IdempotencyException("Idempotency-Key '" + key + "' was previously used with a different request payload.");
                }

                if (existing.isCompleted()) {
                    T cachedResponse = JsonUtil.fromJson(existing.getResponseBody(), responseType);
                    return Optional.of(cachedResponse);
                } else {
                    throw new BusinessConflictException(
                            ErrorCode.BUSINESS_CONFLICT,
                            "A request with Idempotency-Key '" + key + "' is already in progress. Please retry shortly."
                    );
                }
            }
        }

        IdempotencyKey pendingKey = IdempotencyKey.createPending(key, userId, requestHash, ttlMinutes);
        repository.save(pendingKey);
        return Optional.empty();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSuccess(String key, UUID userId, int statusCode, Object responseBody) {
        repository.findByKeyAndUserId(key, userId).ifPresent(record -> {
            String json = JsonUtil.toJson(responseBody);
            record.complete(statusCode, json);
            repository.save(record);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void releaseLock(String key, UUID userId) {
        repository.findByKeyAndUserId(key, userId).ifPresent(repository::delete);
    }
}
