package com.coffeeshop.common.exception;

import com.coffeeshop.common.response.ApiError;
import com.coffeeshop.common.response.ApiResponse;
import com.coffeeshop.common.response.PageMeta;
import jakarta.persistence.OptimisticLockException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex, HttpServletRequest request) {
        String requestId = resolveRequestId(request);
        log.warn("Application exception [{}]: {} (Request: {})", ex.getErrorCode(), ex.getMessage(), requestId);

        ApiError error = ApiError.of(ex.getErrorCode().name(), ex.getMessage(), ex.getDetails());
        PageMeta meta = PageMeta.withRequestId(requestId);

        return ResponseEntity.status(ex.getHttpStatus())
                .body(ApiResponse.error(error, meta));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String requestId = resolveRequestId(request);
        Map<String, String> fieldErrors = new HashMap<>();

        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        log.warn("Validation failure: {} (Request: {})", fieldErrors, requestId);

        ApiError error = ApiError.of(
                ErrorCode.REQUEST_VALIDATION_FAILED.name(),
                "Validation failed for one or more fields.",
                fieldErrors
        );
        PageMeta meta = PageMeta.withRequestId(requestId);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(error, meta));
    }

    @ExceptionHandler({OptimisticLockException.class, ObjectOptimisticLockingFailureException.class, OptimisticLockingFailureException.class})
    public ResponseEntity<ApiResponse<Void>> handleOptimisticLockingFailure(Exception ex, HttpServletRequest request) {
        String requestId = resolveRequestId(request);
        log.warn("Optimistic locking conflict detected: {} (Request: {})", ex.getMessage(), requestId);

        ApiError error = ApiError.of(
                ErrorCode.INVENTORY_CONCURRENT_UPDATE.name(),
                "The resource was updated concurrently by another operation. Please retry."
        );
        PageMeta meta = PageMeta.withRequestId(requestId);

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(error, meta));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        String requestId = resolveRequestId(request);
        log.warn("Access denied: {} (Request: {})", ex.getMessage(), requestId);

        ApiError error = ApiError.of(
                ErrorCode.AUTH_ACCESS_DENIED.name(),
                "You do not have permission to access this resource."
        );
        PageMeta meta = PageMeta.withRequestId(requestId);

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(error, meta));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(AuthenticationException ex, HttpServletRequest request) {
        String requestId = resolveRequestId(request);
        log.warn("Authentication failure: {} (Request: {})", ex.getMessage(), requestId);

        ApiError error = ApiError.of(
                ErrorCode.AUTH_INVALID_CREDENTIALS.name(),
                ex.getMessage()
        );
        PageMeta meta = PageMeta.withRequestId(requestId);

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(error, meta));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex, HttpServletRequest request) {
        String requestId = resolveRequestId(request);
        log.error("Unhandled internal server error occurred (Request: {})", requestId, ex);

        ApiError error = ApiError.of(
                ErrorCode.INTERNAL_ERROR.name(),
                "An unexpected internal error occurred. Please contact support with the request ID."
        );
        PageMeta meta = PageMeta.withRequestId(requestId);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(error, meta));
    }

    private String resolveRequestId(HttpServletRequest request) {
        String reqId = request.getHeader("X-Request-ID");
        return (reqId != null && !reqId.isBlank()) ? reqId : "req_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
}
