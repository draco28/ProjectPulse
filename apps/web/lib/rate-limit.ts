/**
 * Rate Limiting Utility
 * Sprint 8.9: Self-hosted Redis rate limiting for auth endpoints
 * 
 * Limits: 5 attempts per 15 minutes per IP
 */

import Redis from 'ioredis';

// Use self-hosted Redis on Mac mini
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 50, 2000);
  },
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for an identifier (IP address or user ID)
 * @param identifier - Unique identifier (e.g., IP address)
 * @param limit - Max attempts (default: 5)
 * @param window - Time window in seconds (default: 900 = 15 minutes)
 */
export async function rateLimit(
  identifier: string,
  limit = 5,
  window = 900
): Promise<RateLimitResult> {
  const key = `rate_limit:${identifier}`;

  try {
    const current = await redis.incr(key);

    // Set expiration on first request
    if (current === 1) {
      await redis.expire(key, window);
    }

    const ttl = await redis.ttl(key);
    const reset = Date.now() + ttl * 1000;

    if (current > limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset,
      };
    }

    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - current),
      reset,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open - allow request if Redis is down
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + window * 1000,
    };
  }
}

/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  const key = `rate_limit:${identifier}`;
  await redis.del(key);
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    const ip = forwarded.split(',')[0];
    return ip ? ip.trim() : 'unknown';
  }

  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
}
