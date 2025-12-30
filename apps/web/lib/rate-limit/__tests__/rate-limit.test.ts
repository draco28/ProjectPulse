/**
 * Rate Limit Module Tests
 * Sprint 17: Global Rate Limiting (Ticket #130)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MemoryRateLimitStore } from '../memory-store';
import { getTierForRoute, RATE_LIMIT_TIERS } from '../tiers';
import { generateKey, getClientIp } from '../key-generator';

describe('Rate Limit Module', () => {
  describe('getTierForRoute', () => {
    it('returns null for health endpoint', () => {
      expect(getTierForRoute('/api/health', 'GET')).toBeNull();
    });

    it('returns auth tier for auth routes', () => {
      expect(getTierForRoute('/api/auth/signup', 'POST')).toBe('auth');
      expect(getTierForRoute('/api/auth/login', 'POST')).toBe('auth');
      expect(getTierForRoute('/api/agent-auth/verify', 'POST')).toBe('auth');
    });

    it('returns mcp tier for MCP routes', () => {
      expect(getTierForRoute('/api/mcp', 'POST')).toBe('mcp');
      expect(getTierForRoute('/api/mcp/log', 'POST')).toBe('mcp');
    });

    it('returns bulk tier for batch routes', () => {
      expect(getTierForRoute('/api/batch/tickets', 'POST')).toBe('bulk');
      expect(getTierForRoute('/api/tickets/bulk', 'POST')).toBe('bulk');
    });

    it('returns write tier for mutating methods', () => {
      expect(getTierForRoute('/api/tickets', 'POST')).toBe('write');
      expect(getTierForRoute('/api/tickets/123', 'PUT')).toBe('write');
      expect(getTierForRoute('/api/tickets/123', 'PATCH')).toBe('write');
      expect(getTierForRoute('/api/tickets/123', 'DELETE')).toBe('write');
    });

    it('returns read tier for GET requests', () => {
      expect(getTierForRoute('/api/tickets', 'GET')).toBe('read');
      expect(getTierForRoute('/api/knowledge/search', 'GET')).toBe('read');
    });
  });

  describe('RATE_LIMIT_TIERS', () => {
    it('has correct limits for auth tier', () => {
      expect(RATE_LIMIT_TIERS.auth.limit).toBe(5);
      expect(RATE_LIMIT_TIERS.auth.windowSeconds).toBe(900); // 15 min
    });

    it('has correct limits for write tier', () => {
      expect(RATE_LIMIT_TIERS.write.limit).toBe(100);
      expect(RATE_LIMIT_TIERS.write.windowSeconds).toBe(60);
    });

    it('has correct limits for read tier', () => {
      expect(RATE_LIMIT_TIERS.read.limit).toBe(300);
      expect(RATE_LIMIT_TIERS.read.windowSeconds).toBe(60);
    });

    it('has correct limits for mcp tier', () => {
      expect(RATE_LIMIT_TIERS.mcp.limit).toBe(60);
      expect(RATE_LIMIT_TIERS.mcp.windowSeconds).toBe(60);
    });

    it('has correct limits for bulk tier', () => {
      expect(RATE_LIMIT_TIERS.bulk.limit).toBe(10);
      expect(RATE_LIMIT_TIERS.bulk.windowSeconds).toBe(60);
    });

    it('has unlimited health tier', () => {
      expect(RATE_LIMIT_TIERS.health.limit).toBe(Infinity);
    });
  });

  describe('generateKey', () => {
    const context = { ip: '192.168.1.1', userId: 'user123', tokenId: 42, sessionId: 'sess-abc' };

    it('generates IP-only key for auth tier', () => {
      const key = generateKey('auth', context);
      expect(key).toBe('rl:auth:192.168.1.1');
    });

    it('generates session-scoped key for mcp tier', () => {
      const key = generateKey('mcp', context);
      expect(key).toBe('rl:mcp:s:sess-abc');
    });

    it('generates token-scoped key for mcp tier without session', () => {
      const key = generateKey('mcp', { ip: '192.168.1.1', tokenId: 42 });
      expect(key).toBe('rl:mcp:t:42');
    });

    it('generates composite key for write tier', () => {
      const key = generateKey('write', context);
      expect(key).toBe('rl:write:192.168.1.1:u:user123');
    });

    it('generates token-based composite key for write tier', () => {
      const key = generateKey('write', { ip: '192.168.1.1', tokenId: 42 });
      expect(key).toBe('rl:write:192.168.1.1:t:42');
    });

    it('generates anonymous key for write tier without auth', () => {
      const key = generateKey('write', { ip: '192.168.1.1' });
      expect(key).toBe('rl:write:192.168.1.1:anon');
    });
  });

  describe('MemoryRateLimitStore', () => {
    let store: MemoryRateLimitStore;

    beforeEach(() => {
      store = new MemoryRateLimitStore();
    });

    afterEach(() => {
      store.destroy();
    });

    it('allows requests under limit', async () => {
      const result = await store.check('test-key', 5, 60);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
    });

    it('tracks multiple requests', async () => {
      // First 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        const result = await store.check('test-key', 5, 60);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }

      // 6th request should be blocked
      const result = await store.check('test-key', 5, 60);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it('allows unlimited for health tier', async () => {
      const result = await store.check('health-key', Infinity, 0);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });

    it('resets rate limit for a key', async () => {
      // Use up some quota
      await store.check('reset-key', 5, 60);
      await store.check('reset-key', 5, 60);
      await store.check('reset-key', 5, 60);

      // Reset
      await store.reset('reset-key');

      // Should have full quota again
      const result = await store.check('reset-key', 5, 60);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('isolates different keys', async () => {
      // Exhaust key1
      for (let i = 0; i < 5; i++) {
        await store.check('key1', 5, 60);
      }
      const result1 = await store.check('key1', 5, 60);
      expect(result1.success).toBe(false);

      // key2 should still be allowed
      const result2 = await store.check('key2', 5, 60);
      expect(result2.success).toBe(true);
    });

    it('reports healthy status', async () => {
      const healthy = await store.healthCheck();
      expect(healthy).toBe(true);
    });
  });

  describe('getClientIp', () => {
    it('extracts IP from x-forwarded-for header', () => {
      const request = new Request('http://test.com', {
        headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' },
      });
      expect(getClientIp(request)).toBe('203.0.113.195');
    });

    it('extracts IP from x-real-ip header', () => {
      const request = new Request('http://test.com', {
        headers: { 'x-real-ip': '203.0.113.195' },
      });
      expect(getClientIp(request)).toBe('203.0.113.195');
    });

    it('extracts IP from cf-connecting-ip header', () => {
      const request = new Request('http://test.com', {
        headers: { 'cf-connecting-ip': '203.0.113.195' },
      });
      expect(getClientIp(request)).toBe('203.0.113.195');
    });

    it('returns unknown when no IP headers', () => {
      const request = new Request('http://test.com');
      expect(getClientIp(request)).toBe('unknown');
    });
  });
});
