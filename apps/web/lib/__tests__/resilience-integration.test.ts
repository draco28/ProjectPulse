/**
 * Resilience Integration Tests
 *
 * Tests for verifying all resilience patterns work together correctly:
 * - Timeout + Retry combination
 * - Circuit Breaker state transitions (CLOSED -> OPEN -> HALF_OPEN -> CLOSED)
 * - Fallback behavior when circuit is open
 * - Defense in depth (all patterns combined)
 *
 * Part of Phase 3: Resilience Patterns (Ticket #145)
 *
 * Note: These tests use REAL timers with short delays for reliable async testing.
 * Circuit breaker and retry timeouts are set very low (1-50ms) for fast execution.
 *
 * @module lib/__tests__/resilience-integration.test.ts
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { withTimeout, TimeoutError } from '../utils/timeout';
import { withRetry, type RetryOptions } from '../retry';
import {
  getCircuitBreaker,
  getCircuitStatus,
  clearBreakers,
  getBreakerCount,
  type CircuitBreakerOptions,
} from '../circuit-breaker';

// ─────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Sleep for a specified duration.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a function that fails N times then succeeds.
 */
function createFailThenSucceed<T>(
  failCount: number,
  successValue: T,
  errorFactory: () => Error = () => new Error('Transient error')
): jest.Mock<() => Promise<T>> {
  let attempts = 0;
  return jest.fn(async () => {
    attempts++;
    if (attempts <= failCount) {
      throw errorFactory();
    }
    return successValue;
  });
}

/**
 * Create a function that always fails with the given error.
 */
function createAlwaysFail(
  errorFactory: () => Error = () => new Error('Always fails')
): jest.Mock<() => Promise<never>> {
  return jest.fn(async () => {
    throw errorFactory();
  });
}

/**
 * Create a function that always succeeds.
 */
function createAlwaysSucceed<T>(value: T): jest.Mock<() => Promise<T>> {
  return jest.fn(async () => value);
}

/**
 * Create a slow function that takes longer than a timeout.
 */
function createSlowFunction<T>(delayMs: number, value: T): () => Promise<T> {
  return async () => {
    await sleep(delayMs);
    return value;
  };
}

/**
 * Create an error with a specific code.
 */
function createErrorWithCode(code: string, message = 'Error'): Error {
  const error = new Error(message);
  (error as Error & { code: string }).code = code;
  return error;
}

/**
 * Default retry options with short delays for fast tests.
 */
const TEST_RETRY_OPTIONS: Partial<RetryOptions> = {
  initialDelayMs: 1,
  maxDelayMs: 10,
  jitter: false, // Disable jitter for predictable tests
};

/**
 * Default circuit breaker options with short timeouts for fast tests.
 */
const TEST_CIRCUIT_OPTIONS: Partial<CircuitBreakerOptions> = {
  timeout: 500,
  errorThresholdPercentage: 50,
  resetTimeout: 100, // Short reset for testing half-open state
  volumeThreshold: 2, // Low threshold for faster tripping
};

// ─────────────────────────────────────────────────────────────
// Setup and Teardown
// ─────────────────────────────────────────────────────────────

describe('Resilience Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearBreakers();
  });

  afterEach(() => {
    clearBreakers();
  });

  // ─────────────────────────────────────────────────────────────
  // Timeout + Retry Combination Tests
  // ─────────────────────────────────────────────────────────────

  describe('Timeout + Retry Combination', () => {
    it('should retry on timeout and eventually succeed', async () => {
      let attempts = 0;
      const slowThenFast = async (): Promise<string> => {
        attempts++;
        if (attempts < 2) {
          // First attempt is slow - will timeout
          await sleep(100);
          return 'slow';
        }
        // Second attempt is fast
        return 'success';
      };

      const result = await withRetry(() => withTimeout(slowThenFast(), 50, 'test-slow-then-fast'), {
        ...TEST_RETRY_OPTIONS,
        maxAttempts: 3,
        retryableErrors: ['timed out'], // TimeoutError message contains 'timed out'
      });

      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('should fail after max retries on persistent timeout', async () => {
      const alwaysSlow = createSlowFunction(100, 'never');

      await expect(
        withRetry(() => withTimeout(alwaysSlow(), 20, 'test-persistent-slow'), {
          ...TEST_RETRY_OPTIONS,
          maxAttempts: 2,
          retryableErrors: ['timed out'],
        })
      ).rejects.toThrow(TimeoutError);
    });

    it('should identify TimeoutError correctly', async () => {
      const slowFn = createSlowFunction(100, 'value');

      try {
        await withTimeout(slowFn(), 10, 'timeout-test-op');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(TimeoutError);
        expect((error as TimeoutError).operation).toBe('timeout-test-op');
        expect((error as TimeoutError).timeoutMs).toBe(10);
      }
    });

    it('should handle successful retry after transient error', async () => {
      const fn = createFailThenSucceed(
        2, // Fail twice
        'recovered',
        () => createErrorWithCode('ECONNRESET', 'Connection reset')
      );

      const result = await withRetry(fn, {
        ...TEST_RETRY_OPTIONS,
        maxAttempts: 3,
        retryableErrors: ['ECONNRESET'],
      });

      expect(result).toBe('recovered');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Circuit Breaker State Transition Tests
  // ─────────────────────────────────────────────────────────────

  describe('Circuit Breaker State Transitions', () => {
    it('should open circuit after threshold failures (CLOSED -> OPEN)', async () => {
      const failingFn = createAlwaysFail(() => new Error('Service down'));
      // Use volumeThreshold: 3 so circuit stays CLOSED until 3rd failure
      const breaker = getCircuitBreaker('transition-test-closed-open', failingFn, {
        ...TEST_CIRCUIT_OPTIONS,
        volumeThreshold: 3, // Need 3 requests before calculating percentage
      });

      // First failure - circuit stays CLOSED (volumeThreshold not met)
      await expect(breaker.fire()).rejects.toThrow('Service down');
      let status = getCircuitStatus();
      expect(status['transition-test-closed-open'].state).toBe('CLOSED');

      // Second failure - circuit stays CLOSED (volumeThreshold not met)
      await expect(breaker.fire()).rejects.toThrow('Service down');
      status = getCircuitStatus();
      expect(status['transition-test-closed-open'].state).toBe('CLOSED');

      // Third failure - circuit should OPEN (volumeThreshold met, 100% > 50%)
      await expect(breaker.fire()).rejects.toThrow('Service down');
      status = getCircuitStatus();
      expect(status['transition-test-closed-open'].state).toBe('OPEN');
    });

    it('should transition to HALF_OPEN after resetTimeout', async () => {
      const failingFn = createAlwaysFail(() => new Error('Service down'));
      const shortResetOptions: Partial<CircuitBreakerOptions> = {
        ...TEST_CIRCUIT_OPTIONS,
        resetTimeout: 50, // Very short for testing
        volumeThreshold: 1,
        errorThresholdPercentage: 1,
      };

      const breaker = getCircuitBreaker('transition-test-half-open', failingFn, shortResetOptions);

      // Trip the circuit
      await expect(breaker.fire()).rejects.toThrow();
      await expect(breaker.fire()).rejects.toThrow();

      // Verify circuit is open
      let status = getCircuitStatus();
      expect(status['transition-test-half-open'].state).toBe('OPEN');

      // Wait for reset timeout
      await sleep(100);

      // Next request should trigger half-open test
      // (opossum automatically transitions to HALF_OPEN on next request after resetTimeout)
      try {
        await breaker.fire();
      } catch {
        // Expected to fail, but circuit should now be half-open or re-open
      }

      // The circuit should have attempted half-open
      status = getCircuitStatus();
      // After failed half-open test, circuit goes back to OPEN
      expect(['HALF_OPEN', 'OPEN']).toContain(status['transition-test-half-open'].state);
    });

    it('should close circuit after successful HALF_OPEN request', async () => {
      let shouldFail = true;
      const conditionalFn = jest.fn(async () => {
        if (shouldFail) {
          throw new Error('Service down');
        }
        return 'success';
      });

      const shortResetOptions: Partial<CircuitBreakerOptions> = {
        ...TEST_CIRCUIT_OPTIONS,
        resetTimeout: 50,
        volumeThreshold: 1,
        errorThresholdPercentage: 1,
      };

      const breaker = getCircuitBreaker(
        'transition-test-recovery',
        conditionalFn,
        shortResetOptions
      );

      // Trip the circuit
      await expect(breaker.fire()).rejects.toThrow();
      await expect(breaker.fire()).rejects.toThrow();

      let status = getCircuitStatus();
      expect(status['transition-test-recovery'].state).toBe('OPEN');

      // Wait for reset timeout
      await sleep(100);

      // Make the service "recover"
      shouldFail = false;

      // This should succeed and close the circuit
      const result = await breaker.fire();
      expect(result).toBe('success');

      status = getCircuitStatus();
      expect(status['transition-test-recovery'].state).toBe('CLOSED');
    });

    it('should return correct status for multiple breakers', () => {
      getCircuitBreaker('multi-test-a', createAlwaysSucceed('a'), TEST_CIRCUIT_OPTIONS);
      getCircuitBreaker('multi-test-b', createAlwaysSucceed('b'), TEST_CIRCUIT_OPTIONS);
      getCircuitBreaker('multi-test-c', createAlwaysSucceed('c'), TEST_CIRCUIT_OPTIONS);

      const status = getCircuitStatus();
      expect(Object.keys(status)).toHaveLength(3);
      expect(status['multi-test-a']).toBeDefined();
      expect(status['multi-test-b']).toBeDefined();
      expect(status['multi-test-c']).toBeDefined();
      expect(status['multi-test-a'].state).toBe('CLOSED');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Fallback Behavior Tests
  // ─────────────────────────────────────────────────────────────

  describe('Fallback Behavior', () => {
    it('should detect EOPENBREAKER error code when circuit is open', async () => {
      const failingFn = createAlwaysFail(() => new Error('Service down'));
      const breaker = getCircuitBreaker('fallback-test-eopenbreaker', failingFn, {
        ...TEST_CIRCUIT_OPTIONS,
        volumeThreshold: 1,
        errorThresholdPercentage: 1,
      });

      // Trip the circuit
      await expect(breaker.fire()).rejects.toThrow();
      await expect(breaker.fire()).rejects.toThrow();

      // Verify circuit is open
      const status = getCircuitStatus();
      expect(status['fallback-test-eopenbreaker'].state).toBe('OPEN');

      // Next request should get EOPENBREAKER
      let receivedOpenBreakerError = false;
      try {
        await breaker.fire();
      } catch (error) {
        if ((error as { code?: string }).code === 'EOPENBREAKER') {
          receivedOpenBreakerError = true;
        }
      }

      expect(receivedOpenBreakerError).toBe(true);
    });

    it('should enable fallback patterns when circuit is open', async () => {
      const primaryFn = createAlwaysFail(() => new Error('Primary down'));
      const fallbackValue = 'fallback-result';

      const breaker = getCircuitBreaker('fallback-test-pattern', primaryFn, {
        ...TEST_CIRCUIT_OPTIONS,
        volumeThreshold: 1,
        errorThresholdPercentage: 1,
      });

      // Trip the circuit
      await expect(breaker.fire()).rejects.toThrow();
      await expect(breaker.fire()).rejects.toThrow();

      // Use fallback pattern
      let result: string;
      try {
        result = await breaker.fire();
      } catch (error) {
        if ((error as { code?: string }).code === 'EOPENBREAKER') {
          result = fallbackValue;
        } else {
          throw error;
        }
      }

      expect(result).toBe(fallbackValue);
    });

    it('should allow checking circuit state before making request', async () => {
      const failingFn = createAlwaysFail(() => new Error('Service down'));
      const breaker = getCircuitBreaker('fallback-test-precheck', failingFn, {
        ...TEST_CIRCUIT_OPTIONS,
        volumeThreshold: 1,
        errorThresholdPercentage: 1,
      });

      // Initially closed
      let status = getCircuitStatus();
      expect(status['fallback-test-precheck'].state).toBe('CLOSED');

      // Trip the circuit
      await expect(breaker.fire()).rejects.toThrow();
      await expect(breaker.fire()).rejects.toThrow();

      // Now check before making request
      status = getCircuitStatus();
      const isCircuitOpen = status['fallback-test-precheck'].state === 'OPEN';
      expect(isCircuitOpen).toBe(true);

      // Use fallback if circuit is open
      const result = isCircuitOpen ? 'using-fallback' : 'using-primary';
      expect(result).toBe('using-fallback');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Defense in Depth Tests (Combined Patterns)
  // ─────────────────────────────────────────────────────────────

  describe('Defense in Depth', () => {
    it('should combine timeout + retry + circuit breaker', async () => {
      let attemptCount = 0;

      // A function that fails twice with timeout, then succeeds
      const unreliableFn = async (): Promise<string> => {
        attemptCount++;
        if (attemptCount <= 2) {
          // Simulate timeout
          await sleep(100);
          return 'timeout';
        }
        return 'success';
      };

      // Create circuit breaker wrapping the function
      const breaker = getCircuitBreaker('defense-in-depth-test', unreliableFn, {
        timeout: 50, // Circuit breaker's internal timeout
        volumeThreshold: 5, // High threshold to not trip during retries
        errorThresholdPercentage: 80,
        resetTimeout: 1000,
      });

      // Wrap with retry and timeout
      const result = await withRetry(
        async () => {
          try {
            return await breaker.fire();
          } catch (error) {
            // Convert circuit breaker timeout to retryable error
            throw createErrorWithCode('ETIMEDOUT', 'Operation timed out');
          }
        },
        {
          ...TEST_RETRY_OPTIONS,
          maxAttempts: 4,
          retryableErrors: ['ETIMEDOUT'],
        }
      );

      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should maintain independent breaker stats', async () => {
      // Create two breakers with different behaviors
      const successFn = createAlwaysSucceed('ok');
      const failFn = createAlwaysFail(() => new Error('fail'));

      const successBreaker = getCircuitBreaker(
        'independent-success',
        successFn,
        TEST_CIRCUIT_OPTIONS
      );
      const failBreaker = getCircuitBreaker('independent-fail', failFn, {
        ...TEST_CIRCUIT_OPTIONS,
        volumeThreshold: 1,
        errorThresholdPercentage: 1,
      });

      // Make successful calls
      await successBreaker.fire();
      await successBreaker.fire();
      await successBreaker.fire();

      // Make failing calls to trip the other breaker
      await expect(failBreaker.fire()).rejects.toThrow();
      await expect(failBreaker.fire()).rejects.toThrow();

      const status = getCircuitStatus();

      // Success breaker should be closed with successes
      expect(status['independent-success'].state).toBe('CLOSED');
      expect(status['independent-success'].stats.successes).toBe(3);

      // Fail breaker should be open with failures
      expect(status['independent-fail'].state).toBe('OPEN');
      expect(status['independent-fail'].stats.failures).toBeGreaterThan(0);
    });

    it('should clear all breakers correctly', () => {
      // Create multiple breakers
      getCircuitBreaker('clear-test-1', createAlwaysSucceed('1'), TEST_CIRCUIT_OPTIONS);
      getCircuitBreaker('clear-test-2', createAlwaysSucceed('2'), TEST_CIRCUIT_OPTIONS);
      getCircuitBreaker('clear-test-3', createAlwaysSucceed('3'), TEST_CIRCUIT_OPTIONS);

      expect(getBreakerCount()).toBe(3);

      // Clear all
      clearBreakers();

      expect(getBreakerCount()).toBe(0);
      expect(Object.keys(getCircuitStatus())).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Edge Cases
  // ─────────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('should handle void return from circuit breaker', async () => {
      const voidFn = jest.fn(async () => {
        // Do something without returning
      });

      const breaker = getCircuitBreaker('void-test', voidFn, TEST_CIRCUIT_OPTIONS);

      const result = await breaker.fire();
      expect(result).toBeUndefined();
      expect(voidFn).toHaveBeenCalledTimes(1);
    });

    it('should preserve return types through retry', async () => {
      interface ComplexResult {
        id: number;
        data: { nested: string };
      }

      const complexFn = createFailThenSucceed<ComplexResult>(
        1,
        { id: 42, data: { nested: 'value' } },
        () => createErrorWithCode('ECONNRESET')
      );

      const result = await withRetry(complexFn, {
        ...TEST_RETRY_OPTIONS,
        maxAttempts: 3,
        retryableErrors: ['ECONNRESET'],
      });

      expect(result.id).toBe(42);
      expect(result.data.nested).toBe('value');
    });

    it('should handle synchronous throws in wrapped function', async () => {
      const syncThrowFn = () => {
        throw new Error('Sync error');
      };

      // Wrap in circuit breaker
      const breaker = getCircuitBreaker(
        'sync-throw-test',
        async () => syncThrowFn(),
        TEST_CIRCUIT_OPTIONS
      );

      await expect(breaker.fire()).rejects.toThrow('Sync error');
    });
  });
});
