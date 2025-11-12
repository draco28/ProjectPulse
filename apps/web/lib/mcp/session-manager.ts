/**
 * MCP Session Manager
 *
 * Sprint 5.5 - MCP Server Infrastructure
 * Created: 2025-11-12
 *
 * Manages MCP session lifecycle with UUID v4 session IDs and TTL-based expiration.
 * Uses in-memory Map storage for MVP (migrate to Redis/database for production).
 *
 * Session Lifecycle:
 * 1. Client sends request without Mcp-Session-Id → Generate new UUID
 * 2. Server returns session ID in Mcp-Session-Id header
 * 3. Client includes session ID in subsequent requests
 * 4. Sessions expire after 1 hour of inactivity
 * 5. Periodic cleanup removes expired sessions
 *
 * @see apps/web/.agent/task/nextjs-mcp-http-route-20251112-1420.md
 */

import { randomUUID } from 'crypto';
import type { MCPSession } from './types';

/**
 * Session expiration: 1 hour (3600000ms)
 *
 * Sessions are removed if not accessed within this time period.
 * This prevents memory leaks from abandoned sessions.
 */
const SESSION_TTL = 3600000; // 1 hour

/**
 * Cleanup interval: 10 minutes (600000ms)
 *
 * Background job runs every 10 minutes to remove expired sessions.
 */
const CLEANUP_INTERVAL = 600000; // 10 minutes

/**
 * In-memory session store (MVP only)
 *
 * Production: Replace with Redis (for distributed systems) or database (for persistence).
 *
 * Memory footprint: ~1KB per session (UUID + dates + small metadata)
 * Expected max sessions: 100-1000 concurrent (local network usage)
 * Total memory: 100KB - 1MB (acceptable for MVP)
 */
const sessions = new Map<string, MCPSession>();

/**
 * Cleanup timer reference
 */
let cleanupTimer: NodeJS.Timeout | null = null;

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
 * Removes expired sessions automatically.
 *
 * @param sessionId - UUID v4 session identifier
 * @returns Session object (existing or newly created)
 *
 * @example
 * ```typescript
 * // First request (no session ID)
 * const session1 = await validateSession('new-generated-uuid');
 * // Returns new session
 *
 * // Subsequent request (with session ID)
 * const session2 = await validateSession('new-generated-uuid');
 * // Returns same session, lastAccessedAt updated
 * ```
 */
export async function validateSession(sessionId: string): Promise<MCPSession> {
  // Validate session ID format
  if (!isValidSessionId(sessionId)) {
    console.warn(`[Session] Invalid session ID format: ${sessionId}`);
    // Create new session with valid UUID
    return createSession();
  }

  // Check if session exists
  const existingSession = sessions.get(sessionId);

  if (existingSession) {
    // Check expiration
    const now = Date.now();
    const sessionAge = now - existingSession.lastAccessedAt.getTime();

    if (sessionAge > SESSION_TTL) {
      // Session expired - delete and create new
      sessions.delete(sessionId);
      console.warn(
        `[Session] Expired session ${sessionId} (age: ${Math.round(sessionAge / 1000)}s)`
      );
      return createSession();
    }

    // Update last accessed time (session is still valid)
    existingSession.lastAccessedAt = new Date();
    sessions.set(sessionId, existingSession);

    return existingSession;
  }

  // Session not found - create new with provided ID
  return createSession(sessionId);
}

/**
 * Create a new session.
 *
 * @param sessionId - Optional session ID (generates UUID if not provided)
 * @returns New session object
 *
 * @internal
 */
function createSession(sessionId?: string): MCPSession {
  const id = sessionId || generateSessionId();
  const now = new Date();

  const session: MCPSession = {
    id,
    createdAt: now,
    lastAccessedAt: now,
    metadata: {}, // Tool-specific state can be stored here
  };

  sessions.set(id, session);

  console.log(`[Session] Created new session: ${id}`);

  // Start cleanup timer if not already running
  startCleanup();

  return session;
}

/**
 * Get session by ID (no validation, no expiration check).
 *
 * Use validateSession() instead for normal operations.
 * This is only for internal testing/debugging.
 *
 * @param sessionId - Session ID to retrieve
 * @returns Session object or undefined
 *
 * @internal
 */
export function getSession(sessionId: string): MCPSession | undefined {
  return sessions.get(sessionId);
}

/**
 * Delete session by ID.
 *
 * @param sessionId - Session ID to delete
 * @returns True if session was deleted, false if not found
 *
 * @example
 * ```typescript
 * const deleted = deleteSession('550e8400-e29b-41d4-a716-446655440000');
 * ```
 */
export function deleteSession(sessionId: string): boolean {
  const existed = sessions.has(sessionId);
  sessions.delete(sessionId);

  if (existed) {
    console.log(`[Session] Deleted session: ${sessionId}`);
  }

  return existed;
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
export function getAllSessions(): MCPSession[] {
  return Array.from(sessions.values());
}

/**
 * Get session count.
 *
 * @returns Number of active sessions
 */
export function getSessionCount(): number {
  return sessions.size;
}

/**
 * Clear all sessions (for testing only).
 *
 * @internal
 */
export function clearAllSessions(): void {
  const count = sessions.size;
  sessions.clear();
  console.log(`[Session] Cleared all sessions (${count} removed)`);
}

/**
 * Remove expired sessions (passive cleanup).
 *
 * Called periodically by cleanup timer.
 * Also callable manually for testing.
 *
 * @returns Number of sessions removed
 */
export function removeExpiredSessions(): number {
  const now = Date.now();
  let removedCount = 0;

  for (const [sessionId, session] of sessions.entries()) {
    const sessionAge = now - session.lastAccessedAt.getTime();

    if (sessionAge > SESSION_TTL) {
      sessions.delete(sessionId);
      removedCount++;
      console.log(
        `[Session] Removed expired session ${sessionId} (age: ${Math.round(sessionAge / 1000)}s)`
      );
    }
  }

  if (removedCount > 0) {
    console.log(`[Session] Cleanup removed ${removedCount} expired sessions`);
  }

  return removedCount;
}

/**
 * Start periodic cleanup timer.
 *
 * Runs every 10 minutes to remove expired sessions.
 * Idempotent - safe to call multiple times.
 *
 * @internal
 */
function startCleanup(): void {
  if (cleanupTimer) {
    return; // Already running
  }

  cleanupTimer = setInterval(() => {
    removeExpiredSessions();
  }, CLEANUP_INTERVAL);

  // Prevent timer from keeping Node.js process alive
  cleanupTimer.unref();

  console.log(
    `[Session] Cleanup timer started (interval: ${CLEANUP_INTERVAL / 1000}s)`
  );
}

/**
 * Stop periodic cleanup timer (for testing/shutdown).
 *
 * @internal
 */
export function stopCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
    console.log('[Session] Cleanup timer stopped');
  }
}

/**
 * Get session manager stats.
 *
 * For monitoring and debugging.
 *
 * @returns Session manager statistics
 */
export function getSessionStats() {
  const now = Date.now();
  const activeSessions = Array.from(sessions.values());

  const stats = {
    totalSessions: sessions.size,
    expiredSessions: activeSessions.filter(
      (s) => now - s.lastAccessedAt.getTime() > SESSION_TTL
    ).length,
    oldestSession: activeSessions.reduce(
      (oldest, session) =>
        !oldest || session.createdAt < oldest.createdAt ? session : oldest,
      null as MCPSession | null
    ),
    newestSession: activeSessions.reduce(
      (newest, session) =>
        !newest || session.createdAt > newest.createdAt ? session : newest,
      null as MCPSession | null
    ),
  };

  return stats;
}
