/**
 * Redis Session Store for MCP Server
 *
 * Provides persistent session management across container restarts
 * and horizontal scaling support.
 */

import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import type { MCPSession } from './types';
import { createLogger } from '@/lib/logger';

const log = createLogger({ module: 'MCP:SessionStore' });

/**
 * Internal session data structure for Redis storage
 * Uses number timestamps for efficient JSON serialization
 */
export interface SessionData {
  id: string;
  projectId: number;
  createdAt: number;
  lastAccessedAt: number;
  expiresAt: number;
}

/**
 * Convert SessionData (Redis) to MCPSession (application)
 */
function toMCPSession(data: SessionData): MCPSession {
  return {
    id: data.id,
    createdAt: new Date(data.createdAt),
    lastAccessedAt: new Date(data.lastAccessedAt),
    metadata: { projectId: data.projectId },
  };
}

/**
 * Convert MCPSession (application) to SessionData (Redis)
 */
function toSessionData(session: MCPSession, projectId: number): SessionData {
  return {
    id: session.id,
    projectId,
    createdAt: session.createdAt.getTime(),
    lastAccessedAt: session.lastAccessedAt.getTime(),
    expiresAt: session.lastAccessedAt.getTime() + 3600000,
  };
}

export class RedisSessionStore {
  private redis: Redis;
  private readonly TTL_SECONDS = 3600; // 1 hour

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on('error', (err) => {
      log.error({ error: err.message }, 'Redis connection error');
    });

    this.redis.on('connect', () => {
      log.info('Connected to Redis');
    });
  }

  async createSession(projectId: number): Promise<MCPSession> {
    const sessionId = randomUUID();
    const now = Date.now();

    const data: SessionData = {
      id: sessionId,
      projectId,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: now + this.TTL_SECONDS * 1000,
    };

    await this.redis.setex(`session:${sessionId}`, this.TTL_SECONDS, JSON.stringify(data));

    // Track session in per-project Set for efficient listing
    await this.redis.sadd(`project:${projectId}:sessions`, sessionId);

    return toMCPSession(data);
  }

  async createSessionWithId(sessionId: string, projectId: number): Promise<MCPSession> {
    const now = Date.now();

    const data: SessionData = {
      id: sessionId,
      projectId,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: now + this.TTL_SECONDS * 1000,
    };

    await this.redis.setex(`session:${sessionId}`, this.TTL_SECONDS, JSON.stringify(data));

    // Track session in per-project Set for efficient listing
    await this.redis.sadd(`project:${projectId}:sessions`, sessionId);

    return toMCPSession(data);
  }

  async getSession(sessionId: string): Promise<MCPSession | null> {
    const raw = await this.redis.get(`session:${sessionId}`);
    if (!raw) return null;

    const data: SessionData = JSON.parse(raw);

    // Update last accessed time
    data.lastAccessedAt = Date.now();
    await this.redis.setex(`session:${sessionId}`, this.TTL_SECONDS, JSON.stringify(data));

    return toMCPSession(data);
  }

  async deleteSession(sessionId: string): Promise<void> {
    // Get projectId to remove from Set
    const raw = await this.redis.get(`session:${sessionId}`);
    if (raw) {
      try {
        const data: SessionData = JSON.parse(raw);
        await this.redis.srem(`project:${data.projectId}:sessions`, sessionId);
      } catch {
        // Ignore parse errors - lazy cleanup will handle stale entries
      }
    }
    await this.redis.del(`session:${sessionId}`);
  }

  async extendSession(sessionId: string, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || this.TTL_SECONDS;
    await this.redis.expire(`session:${sessionId}`, ttl);
  }

  async getActiveSessions(projectId: number): Promise<MCPSession[]> {
    // Use per-project Set instead of scanning all keys (O(n) per-project vs O(N) global)
    const setKey = `project:${projectId}:sessions`;
    const sessionIds = await this.redis.smembers(setKey);

    if (sessionIds.length === 0) return [];

    // Batch get all sessions for this project (MGET is efficient)
    const sessionKeys = sessionIds.map((id) => `session:${id}`);
    const rawSessions = await this.redis.mget(...sessionKeys);

    const sessions: MCPSession[] = [];
    const staleIds: string[] = [];

    for (let i = 0; i < rawSessions.length; i++) {
      const raw = rawSessions[i];
      const sessionId = sessionIds[i];
      if (!sessionId) continue; // Guard against undefined (noUncheckedIndexedAccess)

      if (!raw) {
        // Session expired via TTL but Set entry remains - mark for cleanup
        staleIds.push(sessionId);
        continue;
      }
      try {
        const data: SessionData = JSON.parse(raw);
        sessions.push(toMCPSession(data));
      } catch {
        staleIds.push(sessionId);
      }
    }

    // Lazy cleanup of stale entries
    if (staleIds.length > 0) {
      await this.redis.srem(setKey, ...staleIds);
    }

    return sessions;
  }

  async getActiveSessionCount(): Promise<number> {
    // Use SCAN instead of KEYS for non-blocking iteration
    let count = 0;
    let cursor = '0';
    do {
      const result = await this.redis.scan(cursor, 'MATCH', 'session:*', 'COUNT', 100);
      cursor = result[0];
      count += result[1].length;
    } while (cursor !== '0');
    return count;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}

/**
 * In-Memory Session Store (Fallback)
 *
 * Used when Redis is unavailable. Sessions are not persistent
 * and don't support horizontal scaling.
 */
export class InMemorySessionStore {
  private sessions: Map<string, SessionData> = new Map();
  private sessionsByProject: Map<number, Set<string>> = new Map(); // Per-project tracking
  private readonly TTL_MS = 3600000; // 1 hour
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired sessions every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  async createSession(projectId: number): Promise<MCPSession> {
    const sessionId = randomUUID();
    const now = Date.now();

    const data: SessionData = {
      id: sessionId,
      projectId,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: now + this.TTL_MS,
    };

    this.sessions.set(sessionId, data);

    // Track session in per-project Set (matching Redis behavior)
    if (!this.sessionsByProject.has(projectId)) {
      this.sessionsByProject.set(projectId, new Set());
    }
    this.sessionsByProject.get(projectId)!.add(sessionId);

    return toMCPSession(data);
  }

  async createSessionWithId(sessionId: string, projectId: number): Promise<MCPSession> {
    const now = Date.now();

    const data: SessionData = {
      id: sessionId,
      projectId,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: now + this.TTL_MS,
    };

    this.sessions.set(sessionId, data);

    // Track session in per-project Set (matching Redis behavior)
    if (!this.sessionsByProject.has(projectId)) {
      this.sessionsByProject.set(projectId, new Set());
    }
    this.sessionsByProject.get(projectId)!.add(sessionId);

    return toMCPSession(data);
  }

  async getSession(sessionId: string): Promise<MCPSession | null> {
    const data = this.sessions.get(sessionId);
    if (!data) return null;

    if (data.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }

    data.lastAccessedAt = Date.now();
    return toMCPSession(data);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessionsByProject.get(session.projectId)?.delete(sessionId);
    }
    this.sessions.delete(sessionId);
  }

  async extendSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.expiresAt = Date.now() + this.TTL_MS;
    }
  }

  async getActiveSessions(projectId: number): Promise<MCPSession[]> {
    const now = Date.now();
    const projectSessionIds = this.sessionsByProject.get(projectId);
    if (!projectSessionIds) return [];

    const sessions: MCPSession[] = [];
    const staleIds: string[] = [];

    for (const sessionId of projectSessionIds) {
      const data = this.sessions.get(sessionId);
      if (!data || data.expiresAt <= now) {
        staleIds.push(sessionId);
      } else {
        sessions.push(toMCPSession(data));
      }
    }

    // Cleanup stale entries (matching Redis lazy cleanup behavior)
    for (const id of staleIds) {
      projectSessionIds.delete(id);
      this.sessions.delete(id);
    }

    return sessions;
  }

  async getActiveSessionCount(): Promise<number> {
    return this.sessions.size;
  }

  async healthCheck(): Promise<boolean> {
    return true; // Always healthy for in-memory
  }

  async disconnect(): Promise<void> {
    clearInterval(this.cleanupInterval);
    this.sessions.clear();
    this.sessionsByProject.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.sessions.entries()) {
      if (data.expiresAt < now) {
        this.sessionsByProject.get(data.projectId)?.delete(sessionId);
        this.sessions.delete(sessionId);
      }
    }
  }
}
