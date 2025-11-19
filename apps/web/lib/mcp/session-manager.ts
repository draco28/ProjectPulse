/**
 * MCP Session Manager
 *
 * Sprint 5.5 - MCP Server Infrastructure
 * Updated: 2025-11-18 - Redis Integration
 *
 * Manages MCP session lifecycle with Redis (production) or in-memory (development) storage.
 * Automatically detects environment and uses appropriate backend.
 *
 * Session Lifecycle:
 * 1. Client sends request without Mcp-Session-Id → Generate new UUID
 * 2. Server returns session ID in Mcp-Session-Id header
 * 3. Client includes session ID in subsequent requests
 * 4. Sessions expire after 1 hour of inactivity (TTL-based)
 * 5. Redis: Auto-expiration via TTL, InMemory: Background cleanup
 *
 * Production (NODE_ENV=production + REDIS_URL set):
 * - Uses RedisSessionStore for persistent, scalable sessions
 * - Multiple Next.js instances share Redis
 * - Sessions survive container restarts
 *
 * Development (NODE_ENV=development or no REDIS_URL):
 * - Uses InMemorySessionStore for zero-dependency local dev
 * - Sessions lost on restart (acceptable for development)
 */

import { randomUUID } from 'crypto';
import type { MCPSession } from './types';
import { RedisSessionStore, InMemorySessionStore } from './session-store';

/**
 * Module-level session store instance (lazy initialized)
 */
let store: RedisSessionStore | InMemorySessionStore | null = null;

/**
 * Store type for monitoring
 */
let storeType: 'redis' | 'memory' = 'memory';

/**
 * Default project ID (TODO: Extract from session context in future)
 * 
 * Currently all sessions use DEFAULT_PROJECT_ID for single-project mode.
 * Future: Multi-tenant support will extract projectId from authenticated context.
 */
const DEFAULT_PROJECT_ID = parseInt(process.env.DEFAULT_PROJECT_ID || '8', 10);

/**
 * Initialize session store (lazy initialization)
 * 
 * Detects environment and creates appropriate store:
 * - Production + REDIS_URL → RedisSessionStore (persistent, scalable)
 * - Development or no REDIS_URL → InMemorySessionStore (local, temporary)
 */
function getStore(): RedisSessionStore | InMemorySessionStore {
  if (store) return store;

  const redisUrl = process.env.REDIS_URL;
  const isProduction = process.env.NODE_ENV === 'production';

  if (redisUrl && isProduction) {
    console.log('[SessionManager] Initializing Redis session store');
    store = new RedisSessionStore(redisUrl);
    storeType = 'redis';
  } else {
    console.log('[SessionManager] Initializing in-memory session store (development)');
    store = new InMemorySessionStore();
    storeType = 'memory';
  }

  return store;
}

/**
 * Generate a new session ID (UUID v4).
 *
 * UUID v4 provides 122 bits of entropy, making collisions extremely unlikely
 * (probability of collision: ~1 in 2^61 for 1 billion UUIDs).
 *
 * @returns UUID v4 string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 *
 * @example
 * ```typescript
 * const sessionId = generateSessionId();
 * // "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function generateSessionId(): string {
  return randomUUID();
}

/**
 * Validate session ID format (UUID v4).
 *
 * @param sessionId - Session ID to validate
 * @returns True if valid UUID v4 format
 */
export function isValidSessionId(sessionId: string): boolean {
  const uuidV4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(sessionId);
}

/**
 * Validate session ID and return session object.
 *
 * Creates new session if ID not found or invalid.
 * Updates lastAccessedAt timestamp for existing sessions.
 * Removes expired sessions automatically (via TTL or store cleanup).
 *
 * Maintains backward compatibility with existing functional API.
 *
 * @param sessionId - UUID v4 session identifier
 * @returns Session object (existing or newly created)
 *
 * @example
 * ```typescript
 * // First request (invalid or no session ID)
 * const session1 = await validateSession('invalid-id');
 * // Returns new session with valid UUID
 *
 * // Subsequent request (with session ID)
 * const session2 = await validateSession(session1.id);
 * // Returns same session, lastAccessedAt updated
 * ```
 */
export async function validateSession(sessionId: string): Promise<MCPSession> {
  const sessionStore = getStore();

  // Invalid format → create new
  if (!isValidSessionId(sessionId)) {
    console.warn(`[Session] Invalid session ID format: ${sessionId}`);
    return await sessionStore.createSession(DEFAULT_PROJECT_ID);
  }

  // Try to get existing session
  const session = await sessionStore.getSession(sessionId);
  
  if (session) {
    return session;
  }

  // Not found → create new with provided ID
  console.warn(`[Session] Session not found: ${sessionId}, creating new`);
  return await sessionStore.createSessionWithId(sessionId, DEFAULT_PROJECT_ID);
}

/**
 * Get session by ID (no validation, no expiration check).
 *
 * Use validateSession() instead for normal operations.
 * This is only for internal testing/debugging.
 *
 * @param sessionId - Session ID to retrieve
 * @returns Session object or null
 *
 * @internal
 */
export async function getSession(sessionId: string): Promise<MCPSession | null> {
  const sessionStore = getStore();
  return await sessionStore.getSession(sessionId);
}

/**
 * Delete session by ID.
 *
 * @param sessionId - Session ID to delete
 * @returns True if session was deleted
 *
 * @example
 * ```typescript
 * const deleted = await deleteSession('550e8400-e29b-41d4-a716-446655440000');
 * ```
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  const sessionStore = getStore();
  await sessionStore.deleteSession(sessionId);
  return true;
}

/**
 * Get all active sessions.
 *
 * For debugging and monitoring only.
 *
 * @returns Array of active sessions
 *
 * @internal
 */
export async function getAllSessions(): Promise<MCPSession[]> {
  const sessionStore = getStore();
  return await sessionStore.getActiveSessions(DEFAULT_PROJECT_ID);
}

/**
 * Get session count.
 *
 * @returns Number of active sessions
 */
export async function getSessionCount(): Promise<number> {
  const sessionStore = getStore();
  return await sessionStore.getActiveSessionCount();
}

/**
 * Clear all sessions (for testing only).
 *
 * @internal
 */
export async function clearAllSessions(): Promise<void> {
  const sessionStore = getStore();
  const sessions = await sessionStore.getActiveSessions(DEFAULT_PROJECT_ID);
  await Promise.all(sessions.map(s => sessionStore.deleteSession(s.id)));
  console.log(`[Session] Cleared all sessions (${sessions.length} removed)`);
}

/**
 * Remove expired sessions (manual cleanup).
 *
 * Note: Redis handles TTL automatically, InMemory has background cleanup.
 * This is a no-op for compatibility with legacy code.
 *
 * @returns Number of sessions removed (always 0 - handled by store)
 */
export async function removeExpiredSessions(): Promise<number> {
  // Redis handles TTL automatically
  // InMemory handles cleanup via internal timer
  // This is a no-op for compatibility
  return 0;
}

/**
 * Get session manager stats.
 *
 * For monitoring and debugging.
 *
 * @returns Session manager statistics including store type
 */
export async function getSessionStats() {
  const sessionStore = getStore();
  const sessions = await sessionStore.getActiveSessions(DEFAULT_PROJECT_ID);

  return {
    storeType,
    totalSessions: sessions.length,
    expiredSessions: 0, // Handled by TTL
    oldestSession: sessions.reduce(
      (oldest, s) => (!oldest || s.createdAt < oldest.createdAt ? s : oldest),
      null as MCPSession | null
    ),
    newestSession: sessions.reduce(
      (newest, s) => (!newest || s.createdAt > newest.createdAt ? s : newest),
      null as MCPSession | null
    ),
  };
}

/**
 * Health check for session store.
 *
 * Returns health status and store type.
 *
 * @returns Health check result
 */
export async function healthCheck(): Promise<{ healthy: boolean; type: string }> {
  const sessionStore = getStore();
  const healthy = await sessionStore.healthCheck();
  return { healthy, type: storeType };
}

/**
 * Graceful shutdown.
 *
 * Disconnects from session store and cleans up resources.
 */
export async function shutdown(): Promise<void> {
  if (store) {
    await store.disconnect();
    store = null;
  }
}

// Legacy exports for compatibility
export { startCleanup, stopCleanup } from './session-store-compat';
