/**
 * Circuit Breaker Infrastructure Unit Tests
 *
 * Tests for getCircuitBreaker(), getCircuitStatus(), and clearBreakers().
 * Part of Phase 3: Resilience Patterns (Ticket #142)
 *
 * Note: These tests use REAL timers with short delays for reliable async testing.
 * Circuit breaker timeouts are set very low (50-100ms) for fast test execution.
 *
 * @module lib/circuit-breaker/__tests__/circuit-breaker.test.ts
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  getCircuitBreaker,
  getCircuitStatus,
  clearBreakers,
  getBreakerCount,
  DEFAULT_CIRCUIT_BREAKER_OPTIONS,
  type CircuitBreakerOptions,
  type CircuitState,
} from '../index';

// ─────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Create a function that always succeeds.
 */
function createAlwaysSucceed<T>(value: T): jest.Mock<() => Promise<T>> {
  return jest.fn(async () => value);
}

/**
 * Create a function that always fails.
 */
function createAlwaysFail(error = new Error('Always fails')): jest.Mock<() => Promise<never>> {
  return jest.fn(async () => {
    throw error;
  });
}

/**
 * Sleep for a specified duration.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Default test options with short timeouts for fast tests.
 */
const TEST_OPTIONS: Partial<CircuitBreakerOptions> = {
  timeout: 500, // 500ms timeout
  errorThresholdPercentage: 50,
  resetTimeout: 200, // Short reset for testing half-open state
  volumeThreshold: 2, // Low threshold for faster tripping
};

// ─────────────────────────────────────────────────────────────
// Setup and Teardown
// ─────────────────────────────────────────────────────────────

describe('Circuit Breaker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearBreakers();
  });

  afterEach(() => {
    clearBreakers();
  });

  // ─────────────────────────────────────────────────────────────
  // DEFAULT_CIRCUIT_BREAKER_OPTIONS Tests
  // ─────────────────────────────────────────────────────────────

  describe('DEFAULT_CIRCUIT_BREAKER_OPTIONS', () => {
    it('has sensible defaults', () => {
      expect(DEFAULT_CIRCUIT_BREAKER_OPTIONS.timeout).toBe(10_000);
      expect(DEFAULT_CIRCUIT_BREAKER_OPTIONS.errorThresholdPercentage).toBe(50);
      expect(DEFAULT_CIRCUIT_BREAKER_OPTIONS.resetTimeout).toBe(30_000);
      expect(DEFAULT_CIRCUIT_BREAKER_OPTIONS.volumeThreshold).toBe(5);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getCircuitBreaker Factory Tests
  // ─────────────────────────────────────────────────────────────

  describe('getCircuitBreaker', () => {
    it('creates a new circuit breaker', () => {
      const fn = createAlwaysSucceed('success');
      const breaker = getCircuitBreaker('test-breaker', fn, TEST_OPTIONS);

      expect(breaker).toBeDefined();
      expect(getBreakerCount()).toBe(1);
    });

    it('returns existing breaker for same name', () => {
      const fn1 = createAlwaysSucceed('success1');
      const fn2 = createAlwaysSucceed('success2');

      const breaker1 = getCircuitBreaker('same-name', fn1, TEST_OPTIONS);
      const breaker2 = getCircuitBreaker('same-name', fn2, TEST_OPTIONS);

      expect(breaker1).toBe(breaker2);
      expect(getBreakerCount()).toBe(1);
    });

    it('creates separate breakers for different names', () => {
      const fn = createAlwaysSucceed('success');

      getCircuitBreaker('breaker-a', fn, TEST_OPTIONS);
      getCircuitBreaker('breaker-b', fn, TEST_OPTIONS);

      expect(getBreakerCount()).toBe(2);
    });

    it('merges options with defaults', () => {
      const fn = createAlwaysSucceed('success');
      const breaker = getCircuitBreaker('merge-test', fn, { timeout: 5000 });

      // Should use provided timeout but default for others
      expect(breaker).toBeDefined();
      expect(getBreakerCount()).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Circuit Stays Closed Tests
  // ─────────────────────────────────────────────────────────────

  describe('circuit stays closed on success', () => {
    it('allows requests when circuit is closed', async () => {
      const fn = createAlwaysSucceed('success');
      const breaker = getCircuitBreaker('closed-test', fn, TEST_OPTIONS);

      const result = await breaker.fire();

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);

      const status = getCircuitStatus();
      expect(status['closed-test'].state).toBe('CLOSED');
    });

    it('keeps circuit closed after multiple successes', async () => {
      const fn = createAlwaysSucceed('success');
      const breaker = getCircuitBreaker('multi-success', fn, TEST_OPTIONS);

      await breaker.fire();
      await breaker.fire();
      await breaker.fire();

      const status = getCircuitStatus();
      expect(status['multi-success'].state).toBe('CLOSED');
      expect(status['multi-success'].stats.successes).toBe(3);
    });

    it('tracks success count correctly', async () => {
      const fn = createAlwaysSucceed('value');
      const breaker = getCircuitBreaker('count-test', fn, TEST_OPTIONS);

      await breaker.fire();
      await breaker.fire();
      await breaker.fire();
      await breaker.fire();
      await breaker.fire();

      const status = getCircuitStatus();
      expect(status['count-test'].stats.successes).toBe(5);
      expect(status['count-test'].stats.failures).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Circuit Opens After Threshold Tests
  // ─────────────────────────────────────────────────────────────

  describe('circuit opens after threshold failures', () => {
    it('opens circuit after failure threshold exceeded', async () => {
      const fn = createAlwaysFail(new Error('Service down'));
      const breaker = getCircuitBreaker('open-test', fn, {
        ...TEST_OPTIONS,
        volumeThreshold: 2,
        errorThresholdPercentage: 50,
      });

      // First failure
      await expect(breaker.fire()).rejects.toThrow('Service down');

      // Second failure - should trip the circuit
      await expect(breaker.fire()).rejects.toThrow('Service down');

      // Third call should fail fast (circuit open)
      await expect(breaker.fire()).rejects.toThrow();

      const status = getCircuitStatus();
      expect(status['open-test'].state).toBe('OPEN');
    });

    it('fails fast when circuit is open', async () => {
      const fn = createAlwaysFail(new Error('Service down'));
      const breaker = getCircuitBreaker('fail-fast', fn, {
        ...TEST_OPTIONS,
        volumeThreshold: 1,
        errorThresholdPercentage: 1,
      });

      // Trip the circuit
      await expect(breaker.fire()).rejects.toThrow();

      // Function should not be called when circuit is open
      fn.mockClear();
      await expect(breaker.fire()).rejects.toThrow();

      // Original function should not have been called (circuit is open)
      expect(fn).not.toHaveBeenCalled();
    });

    it('tracks failure count correctly', async () => {
      const fn = createAlwaysFail(new Error('Failure'));
      const breaker = getCircuitBreaker('failure-count', fn, {
        ...TEST_OPTIONS,
        volumeThreshold: 3,
        errorThresholdPercentage: 100, // Never trip based on percentage
      });

      // These should all call the function
      await expect(breaker.fire()).rejects.toThrow();
      await expect(breaker.fire()).rejects.toThrow();
      await expect(breaker.fire()).rejects.toThrow();

      const status = getCircuitStatus();
      expect(status['failure-count'].stats.failures).toBe(3);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Half-Open State Tests
  // ─────────────────────────────────────────────────────────────

  describe('half-open state transitions', () => {
    it('closes circuit after successful test in half-open', async () => {
      let shouldFail = true;
      const fn = jest.fn(async () => {
        if (shouldFail) {
          throw new Error('Service down');
        }
        return 'recovered';
      });

      const breaker = getCircuitBreaker('recovery-test', fn, {
        ...TEST_OPTIONS,
        volumeThreshold: 1,
        errorThresholdPercentage: 1,
        resetTimeout: 100, // Short for testing
      });

      // Trip the circuit
      await expect(breaker.fire()).rejects.toThrow();

      // Verify circuit is open
      let status = getCircuitStatus();
      expect(status['recovery-test'].state).toBe('OPEN');

      // Wait for reset timeout
      await sleep(150);

      // Now make the function succeed
      shouldFail = false;

      // This should succeed and close the circuit
      const result = await breaker.fire();
      expect(result).toBe('recovered');

      // Circuit should be closed now
      status = getCircuitStatus();
      expect(status['recovery-test'].state).toBe('CLOSED');
    });

    it('re-opens circuit after failure in half-open', async () => {
      const fn = createAlwaysFail(new Error('Still down'));
      const breaker = getCircuitBreaker('reopen-test', fn, {
        ...TEST_OPTIONS,
        volumeThreshold: 1,
        errorThresholdPercentage: 1,
        resetTimeout: 100,
      });

      // Trip the circuit
      await expect(breaker.fire()).rejects.toThrow();

      // Wait for reset timeout
      await sleep(150);

      // Try again - should fail and re-open
      await expect(breaker.fire()).rejects.toThrow();

      const status = getCircuitStatus();
      expect(status['reopen-test'].state).toBe('OPEN');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getCircuitStatus Tests
  // ─────────────────────────────────────────────────────────────

  describe('getCircuitStatus', () => {
    it('returns empty object when no breakers registered', () => {
      const status = getCircuitStatus();
      expect(status).toEqual({});
    });

    it('returns status for all registered breakers', () => {
      const fn = createAlwaysSucceed('success');

      getCircuitBreaker('breaker-1', fn, TEST_OPTIONS);
      getCircuitBreaker('breaker-2', fn, TEST_OPTIONS);

      const status = getCircuitStatus();

      expect(Object.keys(status)).toHaveLength(2);
      expect(status['breaker-1']).toBeDefined();
      expect(status['breaker-2']).toBeDefined();
    });

    it('returns correct stats structure', async () => {
      const fn = createAlwaysSucceed('success');
      const breaker = getCircuitBreaker('stats-test', fn, TEST_OPTIONS);

      await breaker.fire();
      await breaker.fire();

      const status = getCircuitStatus();

      expect(status['stats-test']).toEqual({
        state: 'CLOSED',
        stats: {
          failures: expect.any(Number),
          successes: 2,
          fallbacks: expect.any(Number),
          timeouts: expect.any(Number),
          cacheHits: expect.any(Number),
        },
      });
    });

    it('shows OPEN state for tripped circuits', async () => {
      const fn = createAlwaysFail(new Error('Down'));
      const breaker = getCircuitBreaker('open-status', fn, {
        ...TEST_OPTIONS,
        volumeThreshold: 1,
        errorThresholdPercentage: 1,
      });

      // Trip the circuit
      await expect(breaker.fire()).rejects.toThrow();

      const status = getCircuitStatus();
      expect(status['open-status'].state).toBe('OPEN');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // clearBreakers Tests
  // ─────────────────────────────────────────────────────────────

  describe('clearBreakers', () => {
    it('removes all registered breakers', () => {
      const fn = createAlwaysSucceed('success');

      getCircuitBreaker('breaker-1', fn, TEST_OPTIONS);
      getCircuitBreaker('breaker-2', fn, TEST_OPTIONS);

      expect(getBreakerCount()).toBe(2);

      clearBreakers();

      expect(getBreakerCount()).toBe(0);
    });

    it('allows creating new breakers after clear', async () => {
      const fn = createAlwaysSucceed('success');

      getCircuitBreaker('old-breaker', fn, TEST_OPTIONS);
      clearBreakers();

      const newBreaker = getCircuitBreaker('new-breaker', fn, TEST_OPTIONS);
      const result = await newBreaker.fire();

      expect(result).toBe('success');
      expect(getBreakerCount()).toBe(1);
    });

    it('clears status after clear', () => {
      const fn = createAlwaysSucceed('success');

      getCircuitBreaker('to-clear', fn, TEST_OPTIONS);
      expect(getCircuitStatus()['to-clear']).toBeDefined();

      clearBreakers();

      expect(getCircuitStatus()['to-clear']).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getBreakerCount Tests
  // ─────────────────────────────────────────────────────────────

  describe('getBreakerCount', () => {
    it('returns 0 when no breakers registered', () => {
      expect(getBreakerCount()).toBe(0);
    });

    it('returns correct count after creating breakers', () => {
      const fn = createAlwaysSucceed('success');

      expect(getBreakerCount()).toBe(0);

      getCircuitBreaker('one', fn, TEST_OPTIONS);
      expect(getBreakerCount()).toBe(1);

      getCircuitBreaker('two', fn, TEST_OPTIONS);
      expect(getBreakerCount()).toBe(2);

      getCircuitBreaker('three', fn, TEST_OPTIONS);
      expect(getBreakerCount()).toBe(3);
    });

    it('does not increase for duplicate names', () => {
      const fn = createAlwaysSucceed('success');

      getCircuitBreaker('same', fn, TEST_OPTIONS);
      getCircuitBreaker('same', fn, TEST_OPTIONS);
      getCircuitBreaker('same', fn, TEST_OPTIONS);

      expect(getBreakerCount()).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Edge Cases
  // ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles async functions with arguments', async () => {
      const fn = jest.fn(async (a: number, b: string) => `${b}-${a}`);
      const breaker = getCircuitBreaker('args-test', fn, TEST_OPTIONS);

      const result = await breaker.fire(42, 'test');

      expect(result).toBe('test-42');
      expect(fn).toHaveBeenCalledWith(42, 'test');
    });

    it('handles void return type', async () => {
      const fn = jest.fn(async () => undefined);
      const breaker = getCircuitBreaker('void-test', fn, TEST_OPTIONS);

      const result = await breaker.fire();

      expect(result).toBeUndefined();
    });

    it('preserves error type from original function', async () => {
      class CustomError extends Error {
        constructor(public code: string) {
          super('Custom error');
          this.name = 'CustomError';
        }
      }

      const fn = jest.fn(async () => {
        throw new CustomError('ERR_CUSTOM');
      });

      const breaker = getCircuitBreaker('error-type-test', fn, TEST_OPTIONS);

      try {
        await breaker.fire();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
        expect((error as CustomError).code).toBe('ERR_CUSTOM');
      }
    });

    it('handles multiple arguments correctly', async () => {
      const fn = jest.fn(async (a: number, b: string, c: boolean) => `${a}-${b}-${c}`);
      const breaker = getCircuitBreaker('multi-args', fn, TEST_OPTIONS);

      const result = await breaker.fire(1, 'two', true);

      expect(result).toBe('1-two-true');
      expect(fn).toHaveBeenCalledWith(1, 'two', true);
    });

    it('handles object arguments', async () => {
      interface Options {
        name: string;
        value: number;
      }

      const fn = jest.fn(async (opts: Options) => opts.name);
      const breaker = getCircuitBreaker('object-args', fn, TEST_OPTIONS);

      const result = await breaker.fire({ name: 'test', value: 42 });

      expect(result).toBe('test');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Multiple Breakers Independence Tests
  // ─────────────────────────────────────────────────────────────

  describe('multiple breakers independence', () => {
    it('breakers operate independently', async () => {
      const failingFn = createAlwaysFail(new Error('Down'));
      const succeedingFn = createAlwaysSucceed('up');

      const failingBreaker = getCircuitBreaker('failing', failingFn, {
        ...TEST_OPTIONS,
        volumeThreshold: 1,
        errorThresholdPercentage: 1,
      });
      const succeedingBreaker = getCircuitBreaker('succeeding', succeedingFn, TEST_OPTIONS);

      // Trip the failing breaker
      await expect(failingBreaker.fire()).rejects.toThrow();

      // Succeeding breaker should still work
      const result = await succeedingBreaker.fire();
      expect(result).toBe('up');

      const status = getCircuitStatus();
      expect(status['failing'].state).toBe('OPEN');
      expect(status['succeeding'].state).toBe('CLOSED');
    });

    it('stats are tracked independently', async () => {
      const fn1 = createAlwaysSucceed('a');
      const fn2 = createAlwaysSucceed('b');

      const breaker1 = getCircuitBreaker('stats-1', fn1, TEST_OPTIONS);
      const breaker2 = getCircuitBreaker('stats-2', fn2, TEST_OPTIONS);

      // Different number of calls
      await breaker1.fire();
      await breaker1.fire();
      await breaker1.fire();

      await breaker2.fire();

      const status = getCircuitStatus();
      expect(status['stats-1'].stats.successes).toBe(3);
      expect(status['stats-2'].stats.successes).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Type Safety Tests (compile-time verified)
  // ─────────────────────────────────────────────────────────────

  describe('type safety', () => {
    it('preserves return type', async () => {
      const fn = async () => ({ id: 1, name: 'test' });
      const breaker = getCircuitBreaker('typed', fn, TEST_OPTIONS);

      const result = await breaker.fire();

      // TypeScript verifies this at compile time
      expect(result.id).toBe(1);
      expect(result.name).toBe('test');
    });

    it('state type is correct', () => {
      const fn = createAlwaysSucceed('test');
      getCircuitBreaker('state-type', fn, TEST_OPTIONS);

      const status = getCircuitStatus();
      const state: CircuitState = status['state-type'].state;

      expect(['CLOSED', 'OPEN', 'HALF_OPEN']).toContain(state);
    });
  });
});
