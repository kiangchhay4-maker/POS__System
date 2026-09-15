package com.coffeeshop.common.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenException extends AppException {

    public ForbiddenException(String message) {
        super(ErrorCode.AUTH_ACCESS_DENIED, HttpStatus.FORBIDDEN, message);
    }
}
