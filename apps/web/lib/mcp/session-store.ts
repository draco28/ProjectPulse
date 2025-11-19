/**
 * Redis Session Store for MCP Server
 * 
 * Provides persistent session management across container restarts
 * and horizontal scaling support.
 */

import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import type { MCPSession } from './types';

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
      console.error('[RedisSessionStore] Error:', err.message);
    });

    this.redis.on('connect', () => {
      console.log('[RedisSessionStore] Connected to Redis');
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
      expiresAt: now + (this.TTL_SECONDS * 1000),
    };
    
    await this.redis.setex(
      `session:${sessionId}`,
      this.TTL_SECONDS,
      JSON.stringify(data)
    );
    
    return toMCPSession(data);
  }

  async createSessionWithId(sessionId: string, projectId: number): Promise<MCPSession> {
    const now = Date.now();
    
    const data: SessionData = {
      id: sessionId,
      projectId,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: now + (this.TTL_SECONDS * 1000),
    };
    
    await this.redis.setex(
      `session:${sessionId}`,
      this.TTL_SECONDS,
      JSON.stringify(data)
    );
    
    return toMCPSession(data);
  }

  async getSession(sessionId: string): Promise<MCPSession | null> {
    const raw = await this.redis.get(`session:${sessionId}`);
    if (!raw) return null;
    
    const data: SessionData = JSON.parse(raw);
    
    // Update last accessed time
    data.lastAccessedAt = Date.now();
    await this.redis.setex(
      `session:${sessionId}`,
      this.TTL_SECONDS,
      JSON.stringify(data)
    );
    
    return toMCPSession(data);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }

  async extendSession(sessionId: string, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || this.TTL_SECONDS;
    await this.redis.expire(`session:${sessionId}`, ttl);
  }

  async getActiveSessions(projectId: number): Promise<MCPSession[]> {
    const pattern = 'session:*';
    const keys = await this.redis.keys(pattern);
    
    if (keys.length === 0) return [];
    
    const sessions = await Promise.all(
      keys.map(async (key) => {
        try {
          const raw = await this.redis.get(key);
          if (!raw) return null;
          const data: SessionData = JSON.parse(raw);
          return data.projectId === projectId ? toMCPSession(data) : null;
        } catch {
          return null;
        }
      })
    );
    
    return sessions.filter(s => s !== null) as MCPSession[];
  }

  async getActiveSessionCount(): Promise<number> {
    const keys = await this.redis.keys('session:*');
    return keys.length;
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
    return Array.from(this.sessions.values())
      .filter(data => data.projectId === projectId && data.expiresAt > now)
      .map(data => toMCPSession(data));
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
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.sessions.entries()) {
      if (data.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }
  }
}
