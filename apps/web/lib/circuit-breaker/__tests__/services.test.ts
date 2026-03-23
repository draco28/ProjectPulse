/**
 * Service-Specific Circuit Breakers Tests
 *
 * Tests for apps/web/lib/circuit-breaker/services.ts
 * Part of Phase 3: Resilience Patterns (Ticket #143)
 */

import {
  generateEmbeddingProtected,
  isEmbeddingCircuitOpen,
  getEmbeddingCircuitStatus,
  isEmbeddingCircuitHalfOpen,
  EMBEDDING_CIRCUIT_OPTIONS,
} from '../services';
import { clearBreakers, getBreakerCount } from '../index';

// Mock the embeddings module
jest.mock('@/lib/embeddings', () => ({
  generateEmbedding: jest.fn(),
}));

// Mock the logger
jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

import { generateEmbedding } from '@/lib/embeddings';

const mockGenerateEmbedding = generateEmbedding as jest.MockedFunction<typeof generateEmbedding>;

// Helper to create a mock embedding result
function createMockEmbeddingResult(provider: 'ollama' | 'openai' = 'ollama') {
  return {
    embedding: new Array(768).fill(0.1),
    provider,
    duration: 100,
  };
}

// Helper to wait for circuit breaker state changes
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Service Circuit Breakers', () => {
  beforeEach(() => {
    // Clear all circuit breakers between tests
    clearBreakers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    clearBreakers();
  });

  describe('EMBEDDING_CIRCUIT_OPTIONS', () => {
    it('should have correct configuration values', () => {
      expect(EMBEDDING_CIRCUIT_OPTIONS.timeout).toBe(15_000);
      expect(EMBEDDING_CIRCUIT_OPTIONS.errorThresholdPercentage).toBe(50);
      expect(EMBEDDING_CIRCUIT_OPTIONS.resetTimeout).toBe(60_000);
      expect(EMBEDDING_CIRCUIT_OPTIONS.volumeThreshold).toBe(3);
    });
  });

  describe('generateEmbeddingProtected', () => {
    it('should call underlying generateEmbedding and return result', async () => {
      const mockResult = createMockEmbeddingResult();
      mockGenerateEmbedding.mockResolvedValueOnce(mockResult);

      const result = await generateEmbeddingProtected('test text');

      expect(mockGenerateEmbedding).toHaveBeenCalledWith('test text', {});
      expect(result).toEqual(mockResult);
      expect(result.embedding.length).toBe(768);
    });

    it('should pass options through to generateEmbedding', async () => {
      const mockResult = createMockEmbeddingResult('openai');
      mockGenerateEmbedding.mockResolvedValueOnce(mockResult);

      const options = { provider: 'openai' as const, timeout: 5000 };
      await generateEmbeddingProtected('test text', options);

      expect(mockGenerateEmbedding).toHaveBeenCalledWith('test text', options);
    });

    it('should reuse the same circuit breaker instance across calls', async () => {
      const mockResult = createMockEmbeddingResult();
      mockGenerateEmbedding.mockResolvedValue(mockResult);

      await generateEmbeddingProtected('test 1');
      await generateEmbeddingProtected('test 2');
      await generateEmbeddingProtected('test 3');

      // Only one breaker should be registered (reused for all calls)
      expect(getBreakerCount()).toBe(1);
    });

    it('should propagate errors from generateEmbedding', async () => {
      const error = new Error('Embedding service unavailable');
      mockGenerateEmbedding.mockRejectedValueOnce(error);

      await expect(generateEmbeddingProtected('test')).rejects.toThrow(
        'Embedding service unavailable'
      );
    });
  });

  describe('isEmbeddingCircuitOpen', () => {
    it('should return false before circuit is created', () => {
      // No calls made yet, circuit doesn't exist
      expect(isEmbeddingCircuitOpen()).toBe(false);
    });

    it('should return false when circuit is closed (healthy)', async () => {
      const mockResult = createMockEmbeddingResult();
      mockGenerateEmbedding.mockResolvedValue(mockResult);

      // Make successful calls to create the breaker
      await generateEmbeddingProtected('test');

      expect(isEmbeddingCircuitOpen()).toBe(false);
    });

    it('should return true when circuit is open after failures', async () => {
      const error = new Error('Service down');
      mockGenerateEmbedding.mockRejectedValue(error);

      // Trigger failures to open the circuit
      // With volumeThreshold=3 and errorThresholdPercentage=50,
      // we need 3 failures to trip the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await generateEmbeddingProtected('test');
        } catch {
          // Expected to fail
        }
      }

      // Small delay to allow circuit state to update
      await delay(10);

      expect(isEmbeddingCircuitOpen()).toBe(true);
    });
  });

  describe('getEmbeddingCircuitStatus', () => {
    it('should return null before circuit is created', () => {
      expect(getEmbeddingCircuitStatus()).toBeNull();
    });

    it('should return status with CLOSED state after successful calls', async () => {
      const mockResult = createMockEmbeddingResult();
      mockGenerateEmbedding.mockResolvedValue(mockResult);

      await generateEmbeddingProtected('test');

      const status = getEmbeddingCircuitStatus();
      expect(status).not.toBeNull();
      expect(status?.state).toBe('CLOSED');
      expect(status?.stats.successes).toBeGreaterThan(0);
    });

    it('should return status with OPEN state after failures', async () => {
      const error = new Error('Service down');
      mockGenerateEmbedding.mockRejectedValue(error);

      // Trigger failures
      for (let i = 0; i < 3; i++) {
        try {
          await generateEmbeddingProtected('test');
        } catch {
          // Expected
        }
      }

      await delay(10);

      const status = getEmbeddingCircuitStatus();
      expect(status).not.toBeNull();
      expect(status?.state).toBe('OPEN');
      expect(status?.stats.failures).toBeGreaterThan(0);
    });

    it('should include all stats properties', async () => {
      const mockResult = createMockEmbeddingResult();
      mockGenerateEmbedding.mockResolvedValue(mockResult);

      await generateEmbeddingProtected('test');

      const status = getEmbeddingCircuitStatus();
      expect(status).toHaveProperty('state');
      expect(status).toHaveProperty('stats');
      expect(status?.stats).toHaveProperty('failures');
      expect(status?.stats).toHaveProperty('successes');
      expect(status?.stats).toHaveProperty('fallbacks');
      expect(status?.stats).toHaveProperty('timeouts');
      expect(status?.stats).toHaveProperty('cacheHits');
    });
  });

  describe('isEmbeddingCircuitHalfOpen', () => {
    it('should return false before circuit is created', () => {
      expect(isEmbeddingCircuitHalfOpen()).toBe(false);
    });

    it('should return false when circuit is closed', async () => {
      const mockResult = createMockEmbeddingResult();
      mockGenerateEmbedding.mockResolvedValue(mockResult);

      await generateEmbeddingProtected('test');

      expect(isEmbeddingCircuitHalfOpen()).toBe(false);
    });

    it('should return false when circuit is open', async () => {
      const error = new Error('Service down');
      mockGenerateEmbedding.mockRejectedValue(error);

      for (let i = 0; i < 3; i++) {
        try {
          await generateEmbeddingProtected('test');
        } catch {
          // Expected
        }
      }

      await delay(10);

      // Circuit is OPEN, not HALF_OPEN
      expect(isEmbeddingCircuitHalfOpen()).toBe(false);
      expect(isEmbeddingCircuitOpen()).toBe(true);
    });
  });

  describe('Circuit Breaker Behavior', () => {
    it('should fail fast when circuit is open', async () => {
      const error = new Error('Service down');
      mockGenerateEmbedding.mockRejectedValue(error);

      // Trip the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await generateEmbeddingProtected('test');
        } catch {
          // Expected
        }
      }

      await delay(10);
      expect(isEmbeddingCircuitOpen()).toBe(true);

      // Now the mock should NOT be called - circuit should reject immediately
      mockGenerateEmbedding.mockClear();

      try {
        await generateEmbeddingProtected('new request');
        fail('Should have thrown');
      } catch (err) {
        // Circuit breaker error - mock was NOT called
        expect(mockGenerateEmbedding).not.toHaveBeenCalled();
      }
    });

    it('should track both successes and failures', async () => {
      const mockResult = createMockEmbeddingResult();

      // 2 successes
      mockGenerateEmbedding.mockResolvedValueOnce(mockResult);
      mockGenerateEmbedding.mockResolvedValueOnce(mockResult);
      // 1 failure
      mockGenerateEmbedding.mockRejectedValueOnce(new Error('Fail'));

      await generateEmbeddingProtected('test1');
      await generateEmbeddingProtected('test2');
      try {
        await generateEmbeddingProtected('test3');
      } catch {
        // Expected
      }

      const status = getEmbeddingCircuitStatus();
      expect(status?.stats.successes).toBe(2);
      expect(status?.stats.failures).toBe(1);

      // Circuit should still be closed (1/3 = 33% < 50% threshold)
      expect(status?.state).toBe('CLOSED');
    });
  });
});
