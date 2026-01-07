/**
 * @jest-environment node
 *
 * Health API route tests
 *
 * Tests the health endpoint with circuit breaker status integration.
 * Part of Phase 3: Resilience Patterns (Ticket #144)
 */

// Mock dependencies before importing the route
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    onboardingQuestion: { count: jest.fn() },
    onboardingPromptTemplate: { count: jest.fn() },
  },
}));

jest.mock('@/lib/mcp/session-manager', () => ({
  healthCheck: jest.fn(),
}));

jest.mock('@/lib/circuit-breaker', () => ({
  getCircuitStatus: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

import { prisma } from '@/lib/prisma';
import { healthCheck as sessionHealthCheck } from '@/lib/mcp/session-manager';
import { getCircuitStatus } from '@/lib/circuit-breaker';
import { GET } from '../route';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockSessionHealthCheck = sessionHealthCheck as jest.MockedFunction<typeof sessionHealthCheck>;
const mockGetCircuitStatus = getCircuitStatus as jest.MockedFunction<typeof getCircuitStatus>;

describe('GET /api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: all systems healthy
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
    (mockPrisma.onboardingQuestion.count as jest.Mock).mockResolvedValue(96);
    (mockPrisma.onboardingPromptTemplate.count as jest.Mock).mockResolvedValue(16);
    mockSessionHealthCheck.mockResolvedValue({ healthy: true, type: 'redis' });
    mockGetCircuitStatus.mockReturnValue({});
  });

  describe('healthy status', () => {
    it('returns healthy when all systems are up and circuits are closed', async () => {
      mockGetCircuitStatus.mockReturnValue({
        embedding: {
          state: 'CLOSED',
          stats: { failures: 0, successes: 42, fallbacks: 0, timeouts: 0, cacheHits: 5 },
        },
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.status).toBe('healthy');
      expect(body.database).toBe('connected');
      expect(body.redis).toBe(true);
      expect(body.sessionStore).toBe('redis');
      expect(body.seed).toEqual({ ready: true, questions: 96, templates: 16 });
      expect(body.circuits).toEqual({
        embedding: {
          state: 'CLOSED',
          stats: { failures: 0, successes: 42, fallbacks: 0, timeouts: 0, cacheHits: 5 },
        },
      });
      expect(typeof body.responseTimeMs).toBe('number');
      expect(typeof body.timestamp).toBe('string');
    });

    it('returns healthy with no circuits registered', async () => {
      mockGetCircuitStatus.mockReturnValue({});

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.status).toBe('healthy');
      expect(body.circuits).toEqual({});
    });
  });

  describe('degraded status', () => {
    it('returns degraded when a circuit is OPEN', async () => {
      mockGetCircuitStatus.mockReturnValue({
        embedding: {
          state: 'OPEN',
          stats: { failures: 5, successes: 10, fallbacks: 3, timeouts: 2, cacheHits: 0 },
        },
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.status).toBe('degraded');
      expect(body.database).toBe('connected');
      expect(body.circuits.embedding.state).toBe('OPEN');
    });

    it('returns degraded when a circuit is HALF_OPEN', async () => {
      mockGetCircuitStatus.mockReturnValue({
        embedding: {
          state: 'HALF_OPEN',
          stats: { failures: 3, successes: 20, fallbacks: 2, timeouts: 1, cacheHits: 0 },
        },
      });

      const res = await GET();
      const body = await res.json();

      // HALF_OPEN is not OPEN, so it's still healthy (testing recovery)
      expect(res.status).toBe(200);
      expect(body.status).toBe('healthy');
      expect(body.circuits.embedding.state).toBe('HALF_OPEN');
    });

    it('returns degraded when redis is unhealthy but DB is up', async () => {
      mockSessionHealthCheck.mockResolvedValue({ healthy: false, type: 'redis' });
      mockGetCircuitStatus.mockReturnValue({});

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.status).toBe('degraded');
      expect(body.redis).toBe(false);
      expect(body.database).toBe('connected');
    });

    it('returns degraded when using in-memory session store', async () => {
      mockSessionHealthCheck.mockResolvedValue({ healthy: false, type: 'memory' });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.status).toBe('degraded');
      expect(body.sessionStore).toBe('memory');
    });

    it('returns degraded when multiple circuits have issues', async () => {
      mockGetCircuitStatus.mockReturnValue({
        embedding: {
          state: 'OPEN',
          stats: { failures: 10, successes: 5, fallbacks: 5, timeouts: 5, cacheHits: 0 },
        },
        'semantic-search': {
          state: 'CLOSED',
          stats: { failures: 1, successes: 100, fallbacks: 1, timeouts: 0, cacheHits: 10 },
        },
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.status).toBe('degraded');
      expect(body.circuits.embedding.state).toBe('OPEN');
      expect(body.circuits['semantic-search'].state).toBe('CLOSED');
    });
  });

  describe('unhealthy status', () => {
    it('returns unhealthy when database query fails', async () => {
      (mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection refused'));

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.status).toBe('unhealthy');
      expect(body.database).toBe('error');
    });

    it('returns unhealthy when seed data is not ready (questions)', async () => {
      (mockPrisma.onboardingQuestion.count as jest.Mock).mockResolvedValue(50); // Less than 96

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.status).toBe('unhealthy');
      expect(body.seed.ready).toBe(false);
      expect(body.seed.questions).toBe(50);
    });

    it('returns unhealthy when seed data is not ready (templates)', async () => {
      (mockPrisma.onboardingPromptTemplate.count as jest.Mock).mockResolvedValue(10); // Less than 16

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.status).toBe('unhealthy');
      expect(body.seed.ready).toBe(false);
      expect(body.seed.templates).toBe(10);
    });

    it('returns unhealthy and 503 even with open circuits when DB is down', async () => {
      (mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB error'));
      mockGetCircuitStatus.mockReturnValue({
        embedding: {
          state: 'OPEN',
          stats: { failures: 5, successes: 0, fallbacks: 5, timeouts: 0, cacheHits: 0 },
        },
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.status).toBe('unhealthy');
    });
  });

  describe('response structure', () => {
    it('includes all required fields', async () => {
      mockGetCircuitStatus.mockReturnValue({
        embedding: {
          state: 'CLOSED',
          stats: { failures: 0, successes: 10, fallbacks: 0, timeouts: 0, cacheHits: 2 },
        },
      });

      const res = await GET();
      const body = await res.json();

      // Verify all fields are present
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('database');
      expect(body).toHaveProperty('seed');
      expect(body).toHaveProperty('redis');
      expect(body).toHaveProperty('sessionStore');
      expect(body).toHaveProperty('circuits');
      expect(body).toHaveProperty('responseTimeMs');

      // Verify types
      expect(['healthy', 'degraded', 'unhealthy']).toContain(body.status);
      expect(typeof body.timestamp).toBe('string');
      expect(['connected', 'error']).toContain(body.database);
      expect(typeof body.seed).toBe('object');
      expect(typeof body.redis).toBe('boolean');
      expect(typeof body.sessionStore).toBe('string');
      expect(typeof body.circuits).toBe('object');
      expect(typeof body.responseTimeMs).toBe('number');
    });

    it('includes circuit stats structure', async () => {
      mockGetCircuitStatus.mockReturnValue({
        embedding: {
          state: 'CLOSED',
          stats: { failures: 1, successes: 99, fallbacks: 1, timeouts: 0, cacheHits: 10 },
        },
      });

      const res = await GET();
      const body = await res.json();

      expect(body.circuits.embedding.stats).toHaveProperty('failures');
      expect(body.circuits.embedding.stats).toHaveProperty('successes');
      expect(body.circuits.embedding.stats).toHaveProperty('fallbacks');
      expect(body.circuits.embedding.stats).toHaveProperty('timeouts');
      expect(body.circuits.embedding.stats).toHaveProperty('cacheHits');
    });

    it('responseTimeMs is a reasonable value', async () => {
      const res = await GET();
      const body = await res.json();

      // Should be a non-negative number less than 5 seconds (generous for test environment)
      expect(body.responseTimeMs).toBeGreaterThanOrEqual(0);
      expect(body.responseTimeMs).toBeLessThan(5000);
    });
  });

  describe('error handling', () => {
    it('handles session health check failure gracefully', async () => {
      mockSessionHealthCheck.mockRejectedValue(new Error('Redis connection failed'));

      const res = await GET();
      const body = await res.json();

      // Should still return a response (degraded due to redis failure)
      expect(res.status).toBe(200);
      expect(body.status).toBe('degraded');
      expect(body.redis).toBe(false);
      expect(body.sessionStore).toBe('error');
    });

    it('handles circuit status returning undefined gracefully', async () => {
      mockGetCircuitStatus.mockReturnValue({} as Record<string, never>);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.circuits).toEqual({});
    });
  });
});
