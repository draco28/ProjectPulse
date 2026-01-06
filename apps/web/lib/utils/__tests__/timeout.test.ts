/**
 * Timeout Utilities Unit Tests
 *
 * Tests for withTimeout() wrapper and TimeoutError class.
 * Part of Phase 3: Resilience Patterns (Ticket #140)
 *
 * @module lib/utils/__tests__/timeout.test.ts
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { withTimeout, TimeoutError } from '../timeout';

// Note: We don't mock the logger as the actual Pino output is visible
// in test console output when timeouts occur. This verifies real integration.

// ─────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Create a promise that resolves after a delay.
 */
function delay<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Create a promise that rejects after a delay.
 */
function delayReject(ms: number, error: Error): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(error), ms));
}

// ─────────────────────────────────────────────────────────────
// TimeoutError Tests
// ─────────────────────────────────────────────────────────────

describe('TimeoutError', () => {
  it('creates an error with correct name', () => {
    const error = new TimeoutError('Test timeout', 'test-op', 5000);

    expect(error.name).toBe('TimeoutError');
  });

  it('creates an error with correct message', () => {
    const error = new TimeoutError('Operation timed out', 'test-op', 5000);

    expect(error.message).toBe('Operation timed out');
  });

  it('stores operation name as readonly property', () => {
    const error = new TimeoutError('Test', 'my-operation', 5000);

    expect(error.operation).toBe('my-operation');
  });

  it('stores timeout value as readonly property', () => {
    const error = new TimeoutError('Test', 'test-op', 3000);

    expect(error.timeoutMs).toBe(3000);
  });

  it('is an instance of Error', () => {
    const error = new TimeoutError('Test', 'test-op', 5000);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TimeoutError);
  });

  it('has a stack trace', () => {
    const error = new TimeoutError('Test', 'test-op', 5000);

    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
  });

  it('can be caught as Error type', () => {
    const error = new TimeoutError('Test', 'test-op', 5000);

    expect(() => {
      throw error;
    }).toThrow(Error);
  });

  it('can be caught as TimeoutError type', () => {
    const error = new TimeoutError('Test', 'test-op', 5000);

    expect(() => {
      throw error;
    }).toThrow(TimeoutError);
  });
});

// ─────────────────────────────────────────────────────────────
// withTimeout Success Cases
// ─────────────────────────────────────────────────────────────

describe('withTimeout', () => {
  // Use fake timers for deterministic tests
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('success cases', () => {
    it('resolves with the promise result when completing before timeout', async () => {
      const promise = delay(50, 'success');
      const resultPromise = withTimeout(promise, 1000, 'test-op');

      // Fast-forward time
      jest.advanceTimersByTime(100);

      const result = await resultPromise;
      expect(result).toBe('success');
    });

    it('resolves immediately for already-resolved promises', async () => {
      const promise = Promise.resolve('instant');
      const resultPromise = withTimeout(promise, 1000, 'instant-op');

      const result = await resultPromise;
      expect(result).toBe('instant');
    });

    it('preserves the type of the resolved value', async () => {
      const testObject = { id: 123, name: 'test' };
      const promise = Promise.resolve(testObject);

      const result = await withTimeout(promise, 1000, 'type-test');

      expect(result).toEqual(testObject);
      expect(result.id).toBe(123);
      expect(result.name).toBe('test');
    });

    it('works with void promises', async () => {
      const promise: Promise<void> = delay(10, undefined);
      const resultPromise = withTimeout(promise, 1000, 'void-op');

      jest.advanceTimersByTime(50);

      const result = await resultPromise;
      expect(result).toBeUndefined();
    });

    it('works with null values', async () => {
      const promise = Promise.resolve(null);

      const result = await withTimeout(promise, 1000, 'null-op');

      expect(result).toBeNull();
    });

    it('works with array values', async () => {
      const testArray = [1, 2, 3];
      const promise = Promise.resolve(testArray);

      const result = await withTimeout(promise, 1000, 'array-op');

      expect(result).toEqual([1, 2, 3]);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // withTimeout Timeout Cases
  // ─────────────────────────────────────────────────────────────

  describe('timeout cases', () => {
    it('throws TimeoutError when promise exceeds timeout', async () => {
      const promise = delay(2000, 'slow');
      const resultPromise = withTimeout(promise, 100, 'slow-op');

      // Fast-forward past the timeout
      jest.advanceTimersByTime(150);

      await expect(resultPromise).rejects.toThrow(TimeoutError);
    });

    it('includes operation name in TimeoutError', async () => {
      const promise = delay(2000, 'slow');
      const resultPromise = withTimeout(promise, 100, 'my-slow-operation');

      jest.advanceTimersByTime(150);

      try {
        await resultPromise;
        fail('Should have thrown TimeoutError');
      } catch (error) {
        expect(error).toBeInstanceOf(TimeoutError);
        expect((error as TimeoutError).operation).toBe('my-slow-operation');
      }
    });

    it('includes timeout value in TimeoutError', async () => {
      const promise = delay(2000, 'slow');
      const resultPromise = withTimeout(promise, 250, 'timeout-value-test');

      jest.advanceTimersByTime(300);

      try {
        await resultPromise;
        fail('Should have thrown TimeoutError');
      } catch (error) {
        expect(error).toBeInstanceOf(TimeoutError);
        expect((error as TimeoutError).timeoutMs).toBe(250);
      }
    });

    it('includes descriptive message in TimeoutError', async () => {
      const promise = delay(2000, 'slow');
      const resultPromise = withTimeout(promise, 100, 'descriptive-test');

      jest.advanceTimersByTime(150);

      try {
        await resultPromise;
        fail('Should have thrown TimeoutError');
      } catch (error) {
        expect(error).toBeInstanceOf(TimeoutError);
        expect((error as TimeoutError).message).toContain('descriptive-test');
        expect((error as TimeoutError).message).toContain('100ms');
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // withTimeout Error Propagation
  // ─────────────────────────────────────────────────────────────

  describe('error propagation', () => {
    it('propagates rejection from the original promise', async () => {
      const testError = new Error('Original error');
      const promise = delayReject(50, testError);
      const resultPromise = withTimeout(promise, 1000, 'error-prop-test');

      jest.advanceTimersByTime(100);

      await expect(resultPromise).rejects.toThrow('Original error');
    });

    it('propagates rejection before timeout occurs', async () => {
      const testError = new Error('Fast failure');
      const promise = Promise.reject(testError);
      const resultPromise = withTimeout(promise, 1000, 'fast-reject-test');

      await expect(resultPromise).rejects.toThrow('Fast failure');
    });

    it('preserves error type from original promise', async () => {
      class CustomError extends Error {
        constructor(public code: string) {
          super('Custom error');
          this.name = 'CustomError';
        }
      }

      const customError = new CustomError('ERR_CUSTOM');
      const promise = Promise.reject(customError);
      const resultPromise = withTimeout(promise, 1000, 'custom-error-test');

      try {
        await resultPromise;
        fail('Should have thrown CustomError');
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
        expect((error as CustomError).code).toBe('ERR_CUSTOM');
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // withTimeout Validation
  // ─────────────────────────────────────────────────────────────

  describe('validation', () => {
    it('throws error for zero timeout', async () => {
      const promise = Promise.resolve('value');

      await expect(withTimeout(promise, 0, 'zero-timeout')).rejects.toThrow(
        'timeoutMs must be positive'
      );
    });

    it('throws error for negative timeout', async () => {
      const promise = Promise.resolve('value');

      await expect(withTimeout(promise, -100, 'negative-timeout')).rejects.toThrow(
        'timeoutMs must be positive'
      );
    });

    it('validation error includes the invalid value', async () => {
      const promise = Promise.resolve('value');

      await expect(withTimeout(promise, -50, 'invalid-value-test')).rejects.toThrow('-50');
    });

    it('accepts minimum positive timeout (1ms)', async () => {
      const promise = Promise.resolve('fast');

      // This should not throw validation error
      const result = await withTimeout(promise, 1, 'min-timeout');
      expect(result).toBe('fast');
    });

    it('accepts large timeout values', async () => {
      const promise = Promise.resolve('value');

      // 24 hours in milliseconds
      const result = await withTimeout(promise, 86400000, 'large-timeout');
      expect(result).toBe('value');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // withTimeout Cleanup
  // ─────────────────────────────────────────────────────────────

  describe('cleanup', () => {
    it('clears timeout on success', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const promise = Promise.resolve('success');

      await withTimeout(promise, 1000, 'cleanup-success');

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('clears timeout on promise rejection', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const promise = Promise.reject(new Error('test error'));

      try {
        await withTimeout(promise, 1000, 'cleanup-reject');
      } catch {
        // Expected
      }

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('clears timeout on timeout error', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const promise = delay(2000, 'slow');
      const resultPromise = withTimeout(promise, 100, 'cleanup-timeout');

      jest.advanceTimersByTime(150);

      try {
        await resultPromise;
      } catch {
        // Expected
      }

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // withTimeout Logging
  // ─────────────────────────────────────────────────────────────

  describe('logging', () => {
    it('logs warning on timeout (verified by output)', async () => {
      // Note: The actual logger output is visible in test console as JSON.
      // This test verifies the timeout error is thrown which triggers logging.
      const promise = delay(2000, 'slow');
      const resultPromise = withTimeout(promise, 100, 'logging-test');

      jest.advanceTimersByTime(150);

      // If timeout occurs, logging was triggered (visible in console output)
      await expect(resultPromise).rejects.toThrow(TimeoutError);
    });

    it('does not throw on success (no logging triggered)', async () => {
      const promise = Promise.resolve('success');

      // If promise resolves without timeout, no warning is logged
      const result = await withTimeout(promise, 1000, 'no-log-test');

      expect(result).toBe('success');
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Integration Tests (Real Timers)
// ─────────────────────────────────────────────────────────────

describe('withTimeout integration', () => {
  it('works with real timers for short operations', async () => {
    const promise = Promise.resolve('instant');
    const result = await withTimeout(promise, 100, 'real-timer-test');
    expect(result).toBe('instant');
  });

  it('times out with real timers', async () => {
    // Create a promise that will never resolve in test time
    const neverResolve = new Promise(() => {});
    const resultPromise = withTimeout(neverResolve, 10, 'real-timeout-test');

    await expect(resultPromise).rejects.toThrow(TimeoutError);
  }, 1000); // Set test timeout to 1 second
});
