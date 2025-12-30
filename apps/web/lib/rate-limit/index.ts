/**
 * Rate Limiting Module
 * Sprint 17: Global Rate Limiting (Ticket #130)
 *
 * Provides tiered rate limiting for all API routes.
 *
 * Usage:
 *   import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
 *
 *   const result = await checkRateLimit('write', { ip: clientIp, userId });
 *   if (!result.success) {
 *     return rateLimitResponse(result);
 *   }
 *
 * Or use the HOC:
 *   import { withRateLimit } from '@/lib/rate-limit';
 *   export const POST = withRateLimit(handler);
 */

import { NextResponse } from 'next/server';
import type { RateLimitStore, RateLimitTier, RateLimitKeyContext, RateLimitResult } from './types';
import { RATE_LIMIT_TIERS, getTierForRoute } from './tiers';
import { generateKey, getClientIp } from './key-generator';
import { RedisRateLimitStore } from './redis-store';
import { MemoryRateLimitStore } from './memory-store';

// Re-export types and utilities
export type { RateLimitTier, RateLimitKeyContext, RateLimitResult, WithRateLimitOptions } from './types';
export { RATE_LIMIT_TIERS, getTierForRoute } from './tiers';
export { generateKey, getClientIp } from './key-generator';

/**
 * Singleton store instance
 * Uses Redis if available, falls back to memory
 */
let store: RateLimitStore | null = null;
let storeInitPromise: Promise<RateLimitStore> | null = null;

/**
 * Get or create the rate limit store
 * Automatically chooses Redis or memory based on availability
 */
async function getStore(): Promise<RateLimitStore> {
  if (store) {
    return store;
  }

  if (storeInitPromise) {
    return storeInitPromise;
  }

  storeInitPromise = initStore();
  store = await storeInitPromise;
  storeInitPromise = null;
  return store;
}

/**
 * Initialize the rate limit store
 * Tries Redis first, falls back to memory
 */
async function initStore(): Promise<RateLimitStore> {
  // Check feature flag
  const enabled = process.env.RATE_LIMIT_V2_ENABLED !== 'false';
  if (!enabled) {
    console.log('[RateLimit] V2 disabled, using memory store');
    return new MemoryRateLimitStore();
  }

  // Try Redis
  if (process.env.REDIS_URL) {
    const redisStore = new RedisRateLimitStore();
    const healthy = await redisStore.healthCheck();
    if (healthy) {
      console.log('[RateLimit] Using Redis store');
      return redisStore;
    }
    console.warn('[RateLimit] Redis unhealthy, falling back to memory');
  }

  console.log('[RateLimit] Using in-memory store');
  return new MemoryRateLimitStore();
}

/**
 * Check rate limit for a request
 *
 * @param tier - Rate limit tier (auth, write, read, mcp, bulk, health)
 * @param context - Key context (ip, userId, tokenId, sessionId)
 * @returns RateLimitResult indicating if request is allowed
 */
export async function checkRateLimit(
  tier: RateLimitTier,
  context: RateLimitKeyContext
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_TIERS[tier];

  // Health tier is always allowed
  if (tier === 'health' || config.limit === Infinity) {
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: Date.now() + config.windowSeconds * 1000,
    };
  }

  const currentStore = await getStore();
  const key = generateKey(tier, context);

  return currentStore.check(key, config.limit, config.windowSeconds);
}

/**
 * Reset rate limit for a specific key context
 * Useful after successful authentication
 *
 * @param tier - Rate limit tier
 * @param context - Key context
 */
export async function resetRateLimit(
  tier: RateLimitTier,
  context: RateLimitKeyContext
): Promise<void> {
  const currentStore = await getStore();
  const key = generateKey(tier, context);
  await currentStore.reset(key);
}

/**
 * Build rate limit headers for a response
 *
 * @param result - Rate limit result
 * @returns Headers object with X-RateLimit-* headers
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Create a 429 Too Many Requests response
 *
 * @param result - Rate limit result (must have success: false)
 * @returns NextResponse with 429 status
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too Many Requests',
      code: 'RATE_LIMITED',
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    }
  );
}

/**
 * Add rate limit headers to an existing response
 *
 * @param response - Existing NextResponse
 * @param result - Rate limit result
 * @returns Response with added headers
 */
export function addRateLimitHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
  const headers = rateLimitHeaders(result);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Check if rate limiting is enabled
 */
export function isRateLimitEnabled(): boolean {
  return process.env.RATE_LIMIT_V2_ENABLED !== 'false';
}

/**
 * Get store health status (for /api/health endpoint)
 */
export async function getRateLimitHealth(): Promise<{ type: string; healthy: boolean }> {
  const currentStore = await getStore();
  const healthy = await currentStore.healthCheck();
  const type = currentStore instanceof RedisRateLimitStore ? 'redis' : 'memory';
  return { type, healthy };
}
