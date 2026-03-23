/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Session Store Tests
 *
 * Ticket #128 - Fix Redis KEYS Pattern (O(N) Blocking)
 * Phase 1: Critical Security Hardening
 *
 * Tests for RedisSessionStore and InMemorySessionStore:
 * - Per-project Set tracking (SADD/SREM/SMEMBERS)
 * - Non-blocking SCAN for global counts
 * - Lazy cleanup of stale entries
 * - Multi-tenant isolation
 */

import { RedisSessionStore, InMemorySessionStore } from '../session-store';

// Mock ioredis
const mockRedis = {
  setex: jest.fn().mockResolvedValue('OK'),
  sadd: jest.fn().mockResolvedValue(1),
  srem: jest.fn().mockResolvedValue(1),
  smembers: jest.fn().mockResolvedValue([]),
  mget: jest.fn().mockResolvedValue([]),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  scan: jest.fn().mockResolvedValue(['0', []]),
  ping: jest.fn().mockResolvedValue('PONG'),
  quit: jest.fn().mockResolvedValue('OK'),
  keys: jest.fn(), // Should NOT be called after fix
  on: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedis);
});

// ============================================================================
// RedisSessionStore Tests
// ============================================================================

describe('RedisSessionStore', () => {
  let store: RedisSessionStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = new RedisSessionStore('redis://localhost:6379');
  });

  afterEach(async () => {
    await store.disconnect();
  });

  describe('createSession', () => {
    it('should create session and add to project Set', async () => {
      const session = await store.createSession(6);

      expect(session.id).toBeDefined();
      expect(session.metadata?.projectId).toBe(6);

      // Verify setex was called for session data
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringMatching(/^session:/),
        3600,
        expect.any(String)
      );

      // Verify sadd was called for project Set
      expect(mockRedis.sadd).toHaveBeenCalledWith('project:6:sessions', session.id);
    });

    it('should NOT use redis.keys() for session creation', async () => {
      await store.createSession(6);
      expect(mockRedis.keys).not.toHaveBeenCalled();
    });
  });

  describe('createSessionWithId', () => {
    it('should create session with specific ID and add to project Set', async () => {
      const sessionId = 'test-session-123';
      const session = await store.createSessionWithId(sessionId, 7);

      expect(session.id).toBe(sessionId);
      expect(session.metadata?.projectId).toBe(7);

      // Verify setex was called with the specific session ID
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `session:${sessionId}`,
        3600,
        expect.any(String)
      );

      // Verify sadd was called for project Set
      expect(mockRedis.sadd).toHaveBeenCalledWith('project:7:sessions', sessionId);
    });
  });

  describe('deleteSession', () => {
    it('should get session first to find projectId, then remove from Set', async () => {
      const sessionId = 'session-to-delete';
      mockRedis.get.mockResolvedValueOnce(
        JSON.stringify({
          id: sessionId,
          projectId: 6,
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
          expiresAt: Date.now() + 3600000,
        })
      );

      await store.deleteSession(sessionId);

      // Should get session data to find projectId
      expect(mockRedis.get).toHaveBeenCalledWith(`session:${sessionId}`);

      // Should remove from project Set
      expect(mockRedis.srem).toHaveBeenCalledWith('project:6:sessions', sessionId);

      // Should delete session key
      expect(mockRedis.del).toHaveBeenCalledWith(`session:${sessionId}`);
    });

    it('should handle non-existent session gracefully', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      await store.deleteSession('non-existent-session');

      // Should still call del
      expect(mockRedis.del).toHaveBeenCalledWith('session:non-existent-session');
      // Should NOT call srem (no projectId found)
      expect(mockRedis.srem).not.toHaveBeenCalled();
    });

    it('should NOT use redis.keys() for deletion', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      await store.deleteSession('any-session');
      expect(mockRedis.keys).not.toHaveBeenCalled();
    });
  });

  describe('getActiveSessions', () => {
    it('should use SMEMBERS instead of KEYS for listing sessions', async () => {
      const projectId = 6;
      const sessionIds = ['session-1', 'session-2'];
      const sessionData = sessionIds.map((id) =>
        JSON.stringify({
          id,
          projectId,
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
          expiresAt: Date.now() + 3600000,
        })
      );

      mockRedis.smembers.mockResolvedValueOnce(sessionIds);
      mockRedis.mget.mockResolvedValueOnce(sessionData);

      const sessions = await store.getActiveSessions(projectId);

      // Should use smembers on project Set
      expect(mockRedis.smembers).toHaveBeenCalledWith(`project:${projectId}:sessions`);

      // Should use mget for batch retrieval
      expect(mockRedis.mget).toHaveBeenCalledWith('session:session-1', 'session:session-2');

      // Should NOT use keys
      expect(mockRedis.keys).not.toHaveBeenCalled();

      expect(sessions).toHaveLength(2);
    });

    it('should return empty array when no sessions in Set', async () => {
      mockRedis.smembers.mockResolvedValueOnce([]);

      const sessions = await store.getActiveSessions(6);

      expect(sessions).toEqual([]);
      expect(mockRedis.mget).not.toHaveBeenCalled();
    });

    it('should perform lazy cleanup of stale entries', async () => {
      const projectId = 6;
      const sessionIds = ['valid-session', 'stale-session', 'another-stale'];

      mockRedis.smembers.mockResolvedValueOnce(sessionIds);
      mockRedis.mget.mockResolvedValueOnce([
        JSON.stringify({
          id: 'valid-session',
          projectId,
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
          expiresAt: Date.now() + 3600000,
        }),
        null, // Expired/stale
        null, // Expired/stale
      ]);

      const sessions = await store.getActiveSessions(projectId);

      // Should return only valid sessions
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('valid-session');

      // Should cleanup stale entries from Set
      expect(mockRedis.srem).toHaveBeenCalledWith(
        `project:${projectId}:sessions`,
        'stale-session',
        'another-stale'
      );
    });

    it('should handle JSON parse errors gracefully', async () => {
      const projectId = 6;
      mockRedis.smembers.mockResolvedValueOnce(['session-1', 'session-2']);
      mockRedis.mget.mockResolvedValueOnce([
        'invalid json {{{',
        JSON.stringify({
          id: 'session-2',
          projectId,
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
          expiresAt: Date.now() + 3600000,
        }),
      ]);

      const sessions = await store.getActiveSessions(projectId);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('session-2');

      // Should cleanup invalid entry
      expect(mockRedis.srem).toHaveBeenCalledWith(`project:${projectId}:sessions`, 'session-1');
    });
  });

  describe('getActiveSessionCount', () => {
    it('should use SCAN instead of KEYS for counting', async () => {
      // Simulate SCAN iteration: first batch returns some keys, second returns none
      mockRedis.scan
        .mockResolvedValueOnce(['100', ['session:1', 'session:2', 'session:3']])
        .mockResolvedValueOnce(['0', ['session:4', 'session:5']]);

      const count = await store.getActiveSessionCount();

      // Should use scan with pattern
      expect(mockRedis.scan).toHaveBeenCalledWith('0', 'MATCH', 'session:*', 'COUNT', 100);
      expect(mockRedis.scan).toHaveBeenCalledWith('100', 'MATCH', 'session:*', 'COUNT', 100);

      // Should NOT use keys
      expect(mockRedis.keys).not.toHaveBeenCalled();

      expect(count).toBe(5);
    });

    it('should return 0 when no sessions exist', async () => {
      mockRedis.scan.mockResolvedValueOnce(['0', []]);

      const count = await store.getActiveSessionCount();

      expect(count).toBe(0);
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should isolate sessions by projectId', async () => {
      // Create sessions for different projects
      await store.createSession(6);
      await store.createSession(7);

      // Verify each project gets its own Set
      expect(mockRedis.sadd).toHaveBeenCalledWith('project:6:sessions', expect.any(String));
      expect(mockRedis.sadd).toHaveBeenCalledWith('project:7:sessions', expect.any(String));
    });

    it('should only return sessions for requested projectId', async () => {
      const project6Sessions = ['session-6a', 'session-6b'];
      mockRedis.smembers.mockResolvedValueOnce(project6Sessions);
      mockRedis.mget.mockResolvedValueOnce(
        project6Sessions.map((id) =>
          JSON.stringify({
            id,
            projectId: 6,
            createdAt: Date.now(),
            lastAccessedAt: Date.now(),
            expiresAt: Date.now() + 3600000,
          })
        )
      );

      const sessions = await store.getActiveSessions(6);

      expect(mockRedis.smembers).toHaveBeenCalledWith('project:6:sessions');
      expect(sessions).toHaveLength(2);
      expect(sessions.every((s) => s.metadata?.projectId === 6)).toBe(true);
    });
  });
});

// ============================================================================
// InMemorySessionStore Tests
// ============================================================================

describe('InMemorySessionStore', () => {
  let store: InMemorySessionStore;

  beforeEach(() => {
    store = new InMemorySessionStore();
  });

  afterEach(async () => {
    await store.disconnect();
  });

  describe('createSession', () => {
    it('should create session and track in project Set', async () => {
      const session = await store.createSession(6);

      expect(session.id).toBeDefined();
      expect(session.metadata?.projectId).toBe(6);

      // Verify session is retrievable
      const retrieved = await store.getSession(session.id);
      expect(retrieved?.id).toBe(session.id);
    });

    it('should track sessions separately per project', async () => {
      await store.createSession(6);
      await store.createSession(6);
      await store.createSession(7);

      const project6Sessions = await store.getActiveSessions(6);
      const project7Sessions = await store.getActiveSessions(7);

      expect(project6Sessions).toHaveLength(2);
      expect(project7Sessions).toHaveLength(1);
    });
  });

  describe('deleteSession', () => {
    it('should remove session and clean up project tracking', async () => {
      const session = await store.createSession(6);

      await store.deleteSession(session.id);

      const retrieved = await store.getSession(session.id);
      expect(retrieved).toBeNull();

      const sessions = await store.getActiveSessions(6);
      expect(sessions).toHaveLength(0);
    });
  });

  describe('getActiveSessions', () => {
    it('should return only sessions for the requested project', async () => {
      await store.createSession(6);
      await store.createSession(6);
      await store.createSession(7);
      await store.createSession(8);

      const sessions = await store.getActiveSessions(6);

      expect(sessions).toHaveLength(2);
      expect(sessions.every((s) => s.metadata?.projectId === 6)).toBe(true);
    });

    it('should return empty array for project with no sessions', async () => {
      await store.createSession(6);

      const sessions = await store.getActiveSessions(99);

      expect(sessions).toEqual([]);
    });

    it('should filter out expired sessions and clean them up', async () => {
      // Create a session
      const session = await store.createSession(6);

      // Manually expire the session by accessing internal state
      // This simulates TTL expiry
      const internalSessions = (store as any).sessions as Map<string, any>;
      const sessionData = internalSessions.get(session.id);
      sessionData.expiresAt = Date.now() - 1000; // Expired 1 second ago

      const sessions = await store.getActiveSessions(6);

      // Should not return expired session
      expect(sessions).toHaveLength(0);

      // Session should be cleaned up
      const retrieved = await store.getSession(session.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('getActiveSessionCount', () => {
    it('should return total count of all sessions', async () => {
      await store.createSession(6);
      await store.createSession(7);
      await store.createSession(8);

      const count = await store.getActiveSessionCount();

      expect(count).toBe(3);
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should maintain complete isolation between projects', async () => {
      // Create sessions for multiple projects
      const session6 = await store.createSession(6);
      const session7 = await store.createSession(7);

      // Delete session from project 6
      await store.deleteSession(session6.id);

      // Project 7 should be unaffected
      const project6Sessions = await store.getActiveSessions(6);
      const project7Sessions = await store.getActiveSessions(7);

      expect(project6Sessions).toHaveLength(0);
      expect(project7Sessions).toHaveLength(1);
      expect(project7Sessions[0].id).toBe(session7.id);
    });
  });
});

// ============================================================================
// Behavioral Consistency Tests
// ============================================================================

describe('Store Behavioral Consistency', () => {
  describe('Both stores should behave identically', () => {
    let redisStore: RedisSessionStore;
    let memoryStore: InMemorySessionStore;

    beforeEach(() => {
      jest.clearAllMocks();
      redisStore = new RedisSessionStore('redis://localhost:6379');
      memoryStore = new InMemorySessionStore();

      // Setup Redis mock to behave like memory store
      const mockSessions = new Map<string, string>();
      const mockSets = new Map<number, Set<string>>();

      mockRedis.setex.mockImplementation((key: string, _ttl: number, value: string) => {
        mockSessions.set(key, value);
        return Promise.resolve('OK');
      });

      mockRedis.sadd.mockImplementation((setKey: string, member: string) => {
        const projectId = parseInt(setKey.split(':')[1]);
        if (!mockSets.has(projectId)) mockSets.set(projectId, new Set());
        mockSets.get(projectId)!.add(member);
        return Promise.resolve(1);
      });

      mockRedis.smembers.mockImplementation((setKey: string) => {
        const projectId = parseInt(setKey.split(':')[1]);
        return Promise.resolve(Array.from(mockSets.get(projectId) || []));
      });

      mockRedis.mget.mockImplementation((...keys: string[]) => {
        return Promise.resolve(keys.map((k) => mockSessions.get(k) || null));
      });

      mockRedis.get.mockImplementation((key: string) => {
        return Promise.resolve(mockSessions.get(key) || null);
      });

      mockRedis.del.mockImplementation((key: string) => {
        mockSessions.delete(key);
        return Promise.resolve(1);
      });

      mockRedis.srem.mockImplementation((setKey: string, ...members: string[]) => {
        const projectId = parseInt(setKey.split(':')[1]);
        const set = mockSets.get(projectId);
        if (set) members.forEach((m) => set.delete(m));
        return Promise.resolve(members.length);
      });
    });

    afterEach(async () => {
      await redisStore.disconnect();
      await memoryStore.disconnect();
    });

    it('should create sessions with same structure', async () => {
      const redisSession = await redisStore.createSession(6);
      const memSession = await memoryStore.createSession(6);

      expect(redisSession).toMatchObject({
        id: expect.any(String),
        createdAt: expect.any(Date),
        lastAccessedAt: expect.any(Date),
        metadata: { projectId: 6 },
      });

      expect(memSession).toMatchObject({
        id: expect.any(String),
        createdAt: expect.any(Date),
        lastAccessedAt: expect.any(Date),
        metadata: { projectId: 6 },
      });
    });

    it('should isolate sessions by project identically', async () => {
      await redisStore.createSession(6);
      await redisStore.createSession(6);
      await redisStore.createSession(7);

      await memoryStore.createSession(6);
      await memoryStore.createSession(6);
      await memoryStore.createSession(7);

      const redisSessions6 = await redisStore.getActiveSessions(6);
      const memorySessions6 = await memoryStore.getActiveSessions(6);

      expect(redisSessions6).toHaveLength(2);
      expect(memorySessions6).toHaveLength(2);
    });
  });
});
