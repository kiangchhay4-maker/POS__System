import { AxiosError } from 'axios';
import type { ApiError } from '../types';

/**
 * Extract user-friendly error message from API error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError | undefined;
    
    if (apiError?.code) {
      return mapErrorCodeToMessage(apiError.code, apiError.message);
    }
    
    if (error.response?.status === 404) {
      return 'Resource not found';
    }
    
    if (error.response?.status === 403) {
      return "You don't have permission to perform this action";
    }
    
    if (error.response?.status === 401) {
      return 'Your session has expired. Please log in again';
    }
    
    if (error.code === 'ERR_NETWORK') {
      return 'Connection lost. POS is working offline';
    }
    
    return apiError?.message || 'An unexpected error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Map backend error codes to user-friendly messages
 */
function mapErrorCodeToMessage(code: string, fallback: string): string {
  const errorMap: Record<string, string> = {
    // Inventory errors
    INVENTORY_INSUFFICIENT: 'Not enough stock available',
    INVENTORY_CONCURRENCY: 'Inventory was updated by another user. Please try again',
    
    // Payment errors
    PAYMENT_PENDING: 'Payment is being processed. Please wait',
    PAYMENT_UNKNOWN: 'Payment status could not be confirmed',
    PAYMENT_FAILED: 'Payment failed. Please try again',
    PAYMENT_PROCESSING: 'Payment is being processed',
    
    // Order errors
    ORDER_NOT_FOUND: 'Order not found',
    INVALID_STATE_TRANSITION: 'This action is not allowed for the current order state',
    
    // Auth errors
    UNAUTHORIZED: 'Invalid username or password',
    FORBIDDEN: "You don't have permission to perform this action",
    TOKEN_EXPIRED: 'Your session has expired. Please log in again',
    
    // Shift errors
    SHIFT_ALREADY_OPEN: 'A shift is already open',
    SHIFT_NOT_FOUND: 'No active shift found',
    
    // Business errors
    BUSINESS_CONFLICT: 'This operation conflicts with existing data',
    IDEMPOTENCY_CONFLICT: 'This request was already processed',
    
    // General errors
    RESOURCE_NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Invalid input. Please check your data',
  };
  
  return errorMap[code] || fallback || 'An error occurred';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.code === 'ERR_NETWORK' || !error.response;
  }
  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 401;
  }
  return false;
}

/**
 * Check if error is a permission error
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 403;
  }
  return false;
}
