/**
 * In-Memory Rate Limit Store
 * Sprint 17: Global Rate Limiting (Ticket #130)
 *
 * Fallback store when Redis is unavailable.
 * Uses sliding window algorithm matching Redis implementation.
 *
 * Limitations:
 * - Not shared across instances (no horizontal scaling)
 * - Not persistent across restarts
 * - Higher memory usage under load
 *
 * Reference: lib/mcp/session-store.ts InMemorySessionStore pattern
 */

import type { RateLimitStore, RateLimitResult } from './types';

/**
 * Entry in the sliding window log
 */
interface WindowEntry {
  timestamp: number;
}

/**
 * Rate limit bucket storing timestamps of requests
 */
interface RateLimitBucket {
  entries: WindowEntry[];
  windowSeconds: number;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private buckets: Map<string, RateLimitBucket> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);

    // Prevent interval from keeping Node.js process alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Check if a request is allowed under the rate limit
   *
   * Uses sliding window algorithm:
   * 1. Remove timestamps outside the window
   * 2. Count remaining timestamps
   * 3. If under limit, add new timestamp
   */
  async check(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    // Unlimited tier (e.g., health)
    if (limit === Infinity || windowSeconds === 0) {
      return {
        success: true,
        limit,
        remaining: limit,
        reset: Date.now() + windowSeconds * 1000,
      };
    }

    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Get or create bucket
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { entries: [], windowSeconds };
      this.buckets.set(key, bucket);
    }

    // Remove expired entries (sliding window)
    bucket.entries = bucket.entries.filter((entry) => entry.timestamp > windowStart);

    const count = bucket.entries.length;
    const reset = now + windowSeconds * 1000;

    if (count < limit) {
      // Allow request, add timestamp
      bucket.entries.push({ timestamp: now });
      return {
        success: true,
        limit,
        remaining: Math.max(0, limit - count - 1),
        reset,
      };
    }

    // Rate limited
    // Calculate retry-after based on oldest entry
    const oldestEntry = bucket.entries[0];
    const retryAfter = oldestEntry
      ? Math.ceil((oldestEntry.timestamp + windowSeconds * 1000 - now) / 1000)
      : windowSeconds;

    return {
      success: false,
      limit,
      remaining: 0,
      reset,
      retryAfter: Math.max(1, retryAfter),
    };
  }

  /**
   * Reset the rate limit for a key
   */
  async reset(key: string): Promise<void> {
    this.buckets.delete(key);
  }

  /**
   * Check if the store is healthy
   * Memory store is always healthy
   */
  async healthCheck(): Promise<boolean> {
    return true;
  }

  /**
   * Cleanup expired buckets
   * Called periodically by interval
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, bucket] of this.buckets.entries()) {
      // Remove expired entries
      bucket.entries = bucket.entries.filter(
        (entry) => entry.timestamp > now - bucket.windowSeconds * 1000
      );

      // Delete empty buckets
      if (bucket.entries.length === 0) {
        this.buckets.delete(key);
      }
    }
  }

  /**
   * Destroy the store (for graceful shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.buckets.clear();
  }

  /**
   * Get stats for debugging
   */
  getStats(): { bucketCount: number; totalEntries: number } {
    let totalEntries = 0;
    for (const bucket of this.buckets.values()) {
      totalEntries += bucket.entries.length;
    }
    return {
      bucketCount: this.buckets.size,
      totalEntries,
    };
  }
}
