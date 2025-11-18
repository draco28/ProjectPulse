/**
 * Session Store Compatibility Layer
 * 
 * Provides legacy cleanup functions for backward compatibility.
 * Modern session stores handle cleanup automatically:
 * - RedisSessionStore: TTL-based expiration
 * - InMemorySessionStore: Internal cleanup timer
 */

/**
 * Start periodic cleanup timer (legacy compatibility)
 * 
 * No-op: InMemorySessionStore starts cleanup internally,
 * RedisSessionStore uses TTL (no manual cleanup needed)
 */
export function startCleanup(): void {
  // No-op: cleanup handled by store lifecycle
}

/**
 * Stop periodic cleanup timer (legacy compatibility)
 * 
 * No-op: cleanup handled by store lifecycle
 */
export function stopCleanup(): void {
  // No-op: cleanup handled by store lifecycle
}
