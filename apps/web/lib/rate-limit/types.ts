/**
 * Rate Limiting Types
 * Sprint 17: Global Rate Limiting (Ticket #130)
 *
 * Part of Phase 1: Critical Security Hardening
 */

/**
 * Rate limit tiers with different limits per route type
 */
export type RateLimitTier = 'auth' | 'write' | 'read' | 'mcp' | 'bulk' | 'health';

/**
 * Configuration for a rate limit tier
 */
export interface TierConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Redis key prefix for this tier */
  keyPrefix: string;
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Maximum requests allowed in the window */
  limit: number;
  /** Requests remaining in current window */
  remaining: number;
  /** Unix timestamp (ms) when the window resets */
  reset: number;
  /** Seconds until retry (only set when blocked) */
  retryAfter?: number;
}

/**
 * Context for generating rate limit keys
 */
export interface RateLimitKeyContext {
  /** Client IP address */
  ip: string;
  /** User ID (from NextAuth session) */
  userId?: string;
  /** Token ID (from MCP agent auth) */
  tokenId?: number;
  /** MCP session ID */
  sessionId?: string;
}

/**
 * Store interface for rate limiting backends
 */
export interface RateLimitStore {
  /**
   * Check if a request is allowed under the rate limit
   * @param key - Unique identifier for the rate limit bucket
   * @param limit - Maximum requests allowed
   * @param windowSeconds - Time window in seconds
   */
  check(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult>;

  /**
   * Reset the rate limit for a key (e.g., after successful auth)
   * @param key - The key to reset
   */
  reset(key: string): Promise<void>;

  /**
   * Check if the store is healthy
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Options for the withRateLimit HOC
 */
export interface WithRateLimitOptions {
  /** Override the auto-detected tier */
  tier?: RateLimitTier;
  /** Custom key generator (optional) */
  keyGenerator?: (context: RateLimitKeyContext) => string;
}
