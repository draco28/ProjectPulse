/**
 * Redis Session Store for MCP Server
 * 
 * Provides persistent session management across container restarts
 * and horizontal scaling support.
 */

import Redis from 'ioredis';
import { randomUUID } from 'crypto';

export interface MCPSession {
  id: string;
  projectId: number;
  createdAt: number;
  lastAccessedAt: number;
  expiresAt: number;
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
    
    const session: MCPSession = {
      id: sessionId,
      projectId,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: now + (this.TTL_SECONDS * 1000),
    };
    
    await this.redis.setex(
      `session:${sessionId}`,
      this.TTL_SECONDS,
      JSON.stringify(session)
    );
    
    return session;
  }

  async getSession(sessionId: string): Promise<MCPSession | null> {
    const data = await this.redis.get(`session:${sessionId}`);
    if (!data) return null;
    
    const session: MCPSession = JSON.parse(data);
    
    // Update last accessed time
    session.lastAccessedAt = Date.now();
    await this.redis.setex(
      `session:${sessionId}`,
      this.TTL_SECONDS,
      JSON.stringify(session)
    );
    
    return session;
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
          const data = await this.redis.get(key);
          return data ? JSON.parse(data) as MCPSession : null;
        } catch {
          return null;
        }
      })
    );
    
    return sessions.filter(s => s && s.projectId === projectId) as MCPSession[];
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
  private sessions: Map<string, MCPSession> = new Map();
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
    
    const session: MCPSession = {
      id: sessionId,
      projectId,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: now + this.TTL_MS,
    };
    
    this.sessions.set(sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<MCPSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    if (session.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }
    
    session.lastAccessedAt = Date.now();
    return session;
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
    return Array.from(this.sessions.values()).filter(
      s => s.projectId === projectId && s.expiresAt > now
    );
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
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }
  }
}
