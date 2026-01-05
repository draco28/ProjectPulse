/**
 * Redis Rate Limit Store
 * Sprint 17: Global Rate Limiting (Ticket #130)
 *
 * Implements sliding window rate limiting using Redis sorted sets.
 * Uses Lua script for atomic operations to prevent race conditions.
 *
 * Algorithm: Sliding Window Log
 * - Each request adds a timestamp to a sorted set (ZADD)
 * - Old entries outside the window are removed (ZREMRANGEBYSCORE)
 * - Count of entries determines if request is allowed (ZCARD)
 *
 * Reference: lib/mcp/session-store.ts for Redis connection pattern
 */

import Redis from 'ioredis';
import type { RateLimitStore, RateLimitResult } from './types';
import { createLogger } from '@/lib/logger';

const log = createLogger({ module: 'RateLimit:RedisStore' });

/**
 * Lua script for atomic sliding window rate limiting
 *
 * KEYS[1] = rate limit key
 * ARGV[1] = current timestamp (ms)
 * ARGV[2] = window start timestamp (ms)
 * ARGV[3] = limit
 * ARGV[4] = TTL in seconds
 *
 * Returns: [allowed (0/1), current_count]
 */
const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window_start = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])

-- Remove expired entries (outside the window)
redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

-- Count current entries
local count = redis.call('ZCARD', key)

-- Check if under limit
if count < limit then
  -- Add this request
  redis.call('ZADD', key, now, now .. ':' .. math.random(1000000))
  -- Set TTL (2x window to ensure cleanup)
  redis.call('EXPIRE', key, ttl)
  return {1, count + 1}
else
  return {0, count}
end
`;

export class RedisRateLimitStore implements RateLimitStore {
  private redis: Redis | null = null;
  private readonly redisUrl: string;
  private connecting = false;
  private scriptSha: string | null = null;

  constructor(redisUrl?: string) {
    this.redisUrl = redisUrl || process.env.REDIS_URL || '';
  }

  /**
   * Lazy connect to Redis
   * Avoids connection at module import/build time
   */
  private async getClient(): Promise<Redis | null> {
    if (this.redis) {
      return this.redis;
    }

    if (this.connecting) {
      // Wait for existing connection attempt
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.redis;
    }

    if (!this.redisUrl) {
      log.warn('REDIS_URL not configured');
      return null;
    }

    this.connecting = true;

    try {
      this.redis = new Redis(this.redisUrl, {
        maxRetriesPerRequest: 2,
        connectTimeout: 3000, // 3 second timeout
        lazyConnect: false,
        retryStrategy(times) {
          if (times > 2) return null; // Stop retrying
          return Math.min(times * 100, 1000);
        },
      });

      this.redis.on('error', (err) => {
        log.error({ error: err.message }, 'Redis error');
      });

      // Load Lua script
      this.scriptSha = (await this.redis.script('LOAD', SLIDING_WINDOW_SCRIPT)) as string;

      return this.redis;
    } catch (error) {
      log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to connect');
      this.redis = null;
      return null;
    } finally {
      this.connecting = false;
    }
  }

  /**
   * Check if a request is allowed under the rate limit
   *
   * Uses sliding window algorithm:
   * 1. Remove timestamps outside the window
   * 2. Count remaining timestamps
   * 3. If under limit, add new timestamp
   *
   * Fail-open: Returns success if Redis is unavailable
   */
  async check(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    // Fail-open default
    const failOpenResult: RateLimitResult = {
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + windowSeconds * 1000,
    };

    // Unlimited tier (e.g., health)
    if (limit === Infinity || windowSeconds === 0) {
      return failOpenResult;
    }

    const client = await this.getClient();
    if (!client) {
      return failOpenResult;
    }

    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    const ttl = windowSeconds * 2; // 2x window for cleanup margin

    try {
      let result: [number, number];

      if (this.scriptSha) {
        // Use cached script (EVALSHA)
        result = (await client.evalsha(
          this.scriptSha,
          1,
          key,
          now.toString(),
          windowStart.toString(),
          limit.toString(),
          ttl.toString()
        )) as [number, number];
      } else {
        // Fallback to EVAL
        result = (await client.eval(
          SLIDING_WINDOW_SCRIPT,
          1,
          key,
          now.toString(),
          windowStart.toString(),
          limit.toString(),
          ttl.toString()
        )) as [number, number];
      }

      const [allowed, count] = result;
      const success = allowed === 1;
      const remaining = Math.max(0, limit - count);
      const reset = now + windowSeconds * 1000;

      if (!success) {
        // Calculate retry-after based on oldest entry in window
        const oldestEntry = await client.zrange(key, 0, 0, 'WITHSCORES');
        let retryAfter = windowSeconds;
        if (oldestEntry.length >= 2) {
          const oldestTimestamp = parseInt(oldestEntry[1] as string, 10);
          retryAfter = Math.ceil((oldestTimestamp + windowSeconds * 1000 - now) / 1000);
        }

        return {
          success: false,
          limit,
          remaining: 0,
          reset,
          retryAfter: Math.max(1, retryAfter),
        };
      }

      return {
        success: true,
        limit,
        remaining,
        reset,
      };
    } catch (error) {
      log.error({ error: error instanceof Error ? error.message : String(error) }, 'Check error');
      // Fail-open on error
      return failOpenResult;
    }
  }

  /**
   * Reset the rate limit for a key
   * Useful after successful authentication to clear failed attempts
   */
  async reset(key: string): Promise<void> {
    const client = await this.getClient();
    if (!client) return;

    try {
      await client.del(key);
    } catch (error) {
      log.error({ error: error instanceof Error ? error.message : String(error) }, 'Reset error');
    }
  }

  /**
   * Check if Redis is healthy
   */
  async healthCheck(): Promise<boolean> {
    const client = await this.getClient();
    if (!client) return false;

    try {
      const result = await client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * Disconnect from Redis (for graceful shutdown)
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.scriptSha = null;
    }
  }
}
