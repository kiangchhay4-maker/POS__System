package com.coffeeshop.common.exception;

import org.springframework.http.HttpStatus;

public class IdempotencyException extends AppException {

    public IdempotencyException(String message) {
        super(ErrorCode.IDEMPOTENCY_KEY_REUSED, HttpStatus.CONFLICT, message);
    }
}
