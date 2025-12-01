/**
 * Redis Client for Production Session Storage
 * ============================================
 * Sprint 11: Production Deployment
 * 
 * Provides Redis connection for:
 * - Session storage (NextAuth)
 * - Rate limiting (future)
 * - Caching (future)
 * 
 * Falls back gracefully if REDIS_URL is not configured (dev mode).
 */

import Redis from 'ioredis';

/**
 * Singleton Redis client instance
 * Returns null if REDIS_URL is not configured (development fallback)
 */
let redisClient: Redis | null = null;

/**
 * Get or create Redis client singleton
 */
export function getRedisClient(): Redis | null {
  // Return existing client if already initialized
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  
  // Development fallback - no Redis required
  if (!redisUrl) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Redis] REDIS_URL not set in production - sessions will not persist across restarts');
    }
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      // Connection options
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      
      // Reconnection options
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return true;
        }
        return false;
      },
      
      // Enable offline queue for better resilience
      enableOfflineQueue: true,
      
      // Connection timeout
      connectTimeout: 10000,
      
      // Keep alive
      keepAlive: 30000,
    });

    // Event handlers
    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });

    redisClient.on('close', () => {
      console.log('[Redis] Connection closed');
    });

    redisClient.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });

    return redisClient;
  } catch (error) {
    console.error('[Redis] Failed to initialize client:', error);
    return null;
  }
}

/**
 * Check if Redis is available and connected
 */
export async function isRedisHealthy(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    const result = await client.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Redis] Connection closed gracefully');
  }
}

// Export getter function for lazy initialization (avoids connection at import/build time)
// Use getRedis() instead of direct redis export to prevent build-time connection attempts
export function getRedis(): Redis | null {
  return getRedisClient();
}

// Note: We intentionally do NOT export a direct `redis` constant here
// because it would connect to Redis at module import time (including during build)
// Use getRedis() when you need the Redis client
