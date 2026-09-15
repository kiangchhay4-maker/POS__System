/**
 * Generate a unique idempotency key for payment operations
 */
export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

/**
 * Store idempotency key for tracking
 */
export function storeIdempotencyKey(key: string, orderId: string): void {
  const keys = getStoredIdempotencyKeys();
  keys[key] = {
    orderId,
    timestamp: Date.now(),
  };
  
  // Clean up old keys (older than 24 hours)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  Object.keys(keys).forEach((k) => {
    if (keys[k].timestamp < oneDayAgo) {
      delete keys[k];
    }
  });
  
  localStorage.setItem('idempotencyKeys', JSON.stringify(keys));
}

/**
 * Get stored idempotency keys
 */
function getStoredIdempotencyKeys(): Record<string, { orderId: string; timestamp: number }> {
  const stored = localStorage.getItem('idempotencyKeys');
  if (!stored || stored === 'undefined' || stored === 'null') {
    return {};
  }
  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem('idempotencyKeys');
    return {};
  }
}

/**
 * Check if an idempotency key was already used
 */
export function wasKeyUsed(key: string): boolean {
  const keys = getStoredIdempotencyKeys();
  return key in keys;
}
