package com.coffeeshop.common.exception;

import org.springframework.http.HttpStatus;

public class PaymentProcessingException extends AppException {

    public PaymentProcessingException(ErrorCode errorCode, String message) {
        super(errorCode, HttpStatus.BAD_REQUEST, message);
    }

    public PaymentProcessingException(ErrorCode errorCode, HttpStatus status, String message, Object details) {
        super(errorCode, status, message, details);
    }
}
