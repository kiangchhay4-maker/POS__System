package com.coffeeshop.common.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;

public class InvalidStateTransitionException extends AppException {

    public InvalidStateTransitionException(String currentStatus, String targetStatus) {
        super(
                ErrorCode.ORDER_INVALID_STATUS,
                HttpStatus.UNPROCESSABLE_ENTITY,
                String.format("Cannot transition status from [%s] to [%s]", currentStatus, targetStatus),
                Map.of("currentStatus", currentStatus, "targetStatus", targetStatus)
        );
    }
}
