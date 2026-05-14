/**
 * Simple in-memory rate limiter with sliding window.
 * For production with multiple instances, replace with Redis-based implementation.
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.lastRefill > 600_000) {
      store.delete(key);
    }
  }
}, 300_000);

/**
 * Token bucket rate limiter.
 * Returns { allowed: true } if the request is within limits,
 * or { allowed: false, retryAfterMs } if rate limited.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; retryAfterMs?: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    // First request — create entry with (maxRequests - 1) remaining
    store.set(key, { tokens: config.maxRequests - 1, lastRefill: now });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }

  // Refill tokens based on time elapsed
  const elapsed = now - entry.lastRefill;
  const refillRate = config.maxRequests / config.windowMs; // tokens per ms
  const tokensToAdd = elapsed * refillRate;
  entry.tokens = Math.min(config.maxRequests, entry.tokens + tokensToAdd);
  entry.lastRefill = now;

  if (entry.tokens >= 1) {
    entry.tokens -= 1;
    store.set(key, entry);
    return { allowed: true, remaining: Math.floor(entry.tokens) };
  }

  // Rate limited — calculate retry time
  const retryAfterMs = Math.ceil((1 - entry.tokens) / refillRate);
  return { allowed: false, remaining: 0, retryAfterMs };
}

// ─── Preconfigured Limiters ──────────────────────────────────

/** Rate limit for AI generation endpoints: 30 requests per minute per account */
export const GENERATION_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};

/** Rate limit for general API endpoints: 120 requests per minute per account */
export const GENERAL_LIMIT: RateLimitConfig = {
  maxRequests: 120,
  windowMs: 60_000,
};

/** Rate limit for auth endpoints: 10 requests per minute per IP */
export const AUTH_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60_000,
};
