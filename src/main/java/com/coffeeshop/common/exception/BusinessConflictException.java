package com.coffeeshop.common.exception;

import org.springframework.http.HttpStatus;

public class BusinessConflictException extends AppException {

    public BusinessConflictException(ErrorCode errorCode, String message) {
        super(errorCode, HttpStatus.CONFLICT, message);
    }

    public BusinessConflictException(ErrorCode errorCode, String message, Object details) {
        super(errorCode, HttpStatus.CONFLICT, message, details);
    }
}
