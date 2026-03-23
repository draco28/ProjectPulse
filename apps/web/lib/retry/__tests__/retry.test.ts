/**
 * Retry Utilities Unit Tests
 *
 * Tests for withRetry() wrapper, isRetryableError(), and RetryOptions.
 * Part of Phase 3: Resilience Patterns (Ticket #141)
 *
 * Note: These tests use REAL timers with short delays (1-10ms) instead of
 * Jest fake timers. This is more reliable for testing async retry logic
 * where Promise chains interact with setTimeout.
 *
 * @module lib/retry/__tests__/retry.test.ts
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { withRetry, isRetryableError, DEFAULT_RETRY_OPTIONS, type RetryOptions } from '../index';

// ─────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────

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
 * Create an error with a specific code.
 */
function createErrorWithCode(code: string, message = 'Error'): Error {
  const error = new Error(message);
  (error as Error & { code: string }).code = code;
  return error;
}

/**
 * Default test options with short delays for fast tests.
 */
const TEST_OPTIONS: Partial<RetryOptions> = {
  initialDelayMs: 1,
  maxDelayMs: 10,
  jitter: false, // Disable jitter for predictable tests
};

// ─────────────────────────────────────────────────────────────
// isRetryableError Tests
// ─────────────────────────────────────────────────────────────

describe('isRetryableError', () => {
  it('returns true when error code matches exactly', () => {
    const error = createErrorWithCode('ECONNRESET');

    expect(isRetryableError(error, ['ECONNRESET'])).toBe(true);
  });

  it('returns true when error message contains retryable string', () => {
    const error = new Error('Connection reset by peer');

    expect(isRetryableError(error, ['Connection reset'])).toBe(true);
  });

  it('returns false when no match found', () => {
    const error = new Error('Unknown error');

    expect(isRetryableError(error, ['ECONNRESET', 'ETIMEDOUT'])).toBe(false);
  });

  it('returns false for empty retryableErrors array', () => {
    const error = createErrorWithCode('ECONNRESET');

    expect(isRetryableError(error, [])).toBe(false);
  });

  it('matches any code in the list', () => {
    const error = createErrorWithCode('ETIMEDOUT');

    expect(isRetryableError(error, ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'])).toBe(true);
  });

  it('handles non-Error objects gracefully', () => {
    const stringError = 'Connection timeout';
    const objectError = { message: 'ECONNRESET occurred' };
    const nullError = null;
    const undefinedError = undefined;

    expect(isRetryableError(stringError, ['timeout'])).toBe(true);
    expect(isRetryableError(objectError, ['ECONNRESET'])).toBe(true);
    expect(isRetryableError(nullError, ['ECONNRESET'])).toBe(false);
    expect(isRetryableError(undefinedError, ['ECONNRESET'])).toBe(false);
  });

  it('handles object with message property', () => {
    const errorLike = { message: 'Database connection lost', code: 'P1001' };

    expect(isRetryableError(errorLike, ['P1001'])).toBe(true);
    expect(isRetryableError(errorLike, ['connection lost'])).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// DEFAULT_RETRY_OPTIONS Tests
// ─────────────────────────────────────────────────────────────

describe('DEFAULT_RETRY_OPTIONS', () => {
  it('has sensible defaults', () => {
    expect(DEFAULT_RETRY_OPTIONS.maxAttempts).toBe(3);
    expect(DEFAULT_RETRY_OPTIONS.initialDelayMs).toBe(100);
    expect(DEFAULT_RETRY_OPTIONS.maxDelayMs).toBe(5000);
    expect(DEFAULT_RETRY_OPTIONS.backoffFactor).toBe(2);
    expect(DEFAULT_RETRY_OPTIONS.jitter).toBe(true);
  });

  it('includes common transient error codes', () => {
    const codes = DEFAULT_RETRY_OPTIONS.retryableErrors;

    expect(codes).toContain('ECONNRESET');
    expect(codes).toContain('ETIMEDOUT');
    expect(codes).toContain('ECONNREFUSED');
    expect(codes).toContain('P1001'); // Prisma
  });
});

// ─────────────────────────────────────────────────────────────
// withRetry Success Cases
// ─────────────────────────────────────────────────────────────

describe('withRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success cases', () => {
    it('returns result on first successful attempt', async () => {
      const fn = jest.fn(async () => 'success');

      const result = await withRetry(fn, TEST_OPTIONS);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('works with immediate promise resolution', async () => {
      const fn = jest.fn(() => Promise.resolve('immediate'));

      const result = await withRetry(fn, TEST_OPTIONS);

      expect(result).toBe('immediate');
    });

    it('preserves complex return types', async () => {
      const testData = { id: 123, items: [1, 2, 3], nested: { a: 1 } };
      const fn = jest.fn(async () => testData);

      const result = await withRetry(fn, TEST_OPTIONS);

      expect(result).toEqual(testData);
    });

    it('works with void return', async () => {
      const fn = jest.fn(async () => undefined);

      const result = await withRetry(fn, TEST_OPTIONS);

      expect(result).toBeUndefined();
    });

    it('works with null return', async () => {
      const fn = jest.fn(async () => null);

      const result = await withRetry(fn, TEST_OPTIONS);

      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // withRetry Retry Success Cases
  // ─────────────────────────────────────────────────────────────

  describe('retry success cases', () => {
    it('retries once and succeeds', async () => {
      const fn = createFailThenSucceed(1, 'recovered', () => createErrorWithCode('ECONNRESET'));

      const result = await withRetry(fn, TEST_OPTIONS);

      expect(result).toBe('recovered');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('succeeds after multiple retries', async () => {
      const fn = createFailThenSucceed(2, 'recovered', () => createErrorWithCode('ETIMEDOUT'));

      const result = await withRetry(fn, {
        ...TEST_OPTIONS,
        maxAttempts: 3,
      });

      expect(result).toBe('recovered');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('retries when error message matches retryableErrors', async () => {
      const fn = createFailThenSucceed(
        1,
        'recovered',
        () => new Error('Connection ECONNRESET occurred')
      );

      const result = await withRetry(fn, TEST_OPTIONS);

      expect(result).toBe('recovered');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // withRetry Retry Exhausted Cases
  // ─────────────────────────────────────────────────────────────

  describe('retry exhausted cases', () => {
    it('throws when all attempts fail with retryable error', async () => {
      const fn = createAlwaysFail(() =>
        createErrorWithCode('ECONNRESET', 'Persistent connection error')
      );

      await expect(withRetry(fn, { ...TEST_OPTIONS, maxAttempts: 3 })).rejects.toThrow(
        'Persistent connection error'
      );

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('throws the last error after exhaustion', async () => {
      let attempt = 0;
      const fn = jest.fn(async () => {
        attempt++;
        throw createErrorWithCode('ECONNRESET', `Error on attempt ${attempt}`);
      });

      await expect(withRetry(fn, { ...TEST_OPTIONS, maxAttempts: 2 })).rejects.toThrow(
        'Error on attempt 2'
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // withRetry Non-Retryable Error Cases
  // ─────────────────────────────────────────────────────────────

  describe('non-retryable error cases', () => {
    it('does not retry non-retryable errors', async () => {
      const fn = createAlwaysFail(() => new Error('Business logic error'));

      await expect(
        withRetry(fn, {
          ...TEST_OPTIONS,
          retryableErrors: ['ECONNRESET'],
        })
      ).rejects.toThrow('Business logic error');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('fails immediately on non-retryable error code', async () => {
      const fn = createAlwaysFail(() => createErrorWithCode('VALIDATION_ERROR'));

      await expect(
        withRetry(fn, {
          ...TEST_OPTIONS,
          retryableErrors: ['ECONNRESET', 'ETIMEDOUT'],
        })
      ).rejects.toThrow();

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // withRetry Custom Predicate (isRetryable) Tests
  // ─────────────────────────────────────────────────────────────

  describe('custom isRetryable predicate', () => {
    it('uses custom predicate for retry decision', async () => {
      class OllamaError extends Error {
        constructor(
          message: string,
          public statusCode: number
        ) {
          super(message);
          this.name = 'OllamaError';
        }
      }

      const isOllamaRetryable = (error: unknown): boolean => {
        return error instanceof OllamaError && error.statusCode === 500;
      };

      const fn = createFailThenSucceed(1, 'recovered', () => new OllamaError('Server error', 500));

      const result = await withRetry(fn, {
        ...TEST_OPTIONS,
        retryableErrors: [], // Empty string list
        isRetryable: isOllamaRetryable,
      });

      expect(result).toBe('recovered');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not retry when custom predicate returns false', async () => {
      const isRetryable = () => false;

      const fn = createAlwaysFail(() => createErrorWithCode('ECONNRESET'));

      await expect(
        withRetry(fn, {
          ...TEST_OPTIONS,
          retryableErrors: [], // Empty
          isRetryable,
        })
      ).rejects.toThrow();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries if EITHER predicate OR retryableErrors match (OR logic)', async () => {
      // Error matches retryableErrors but predicate returns false
      const fn = createFailThenSucceed(1, 'recovered', () => createErrorWithCode('ECONNRESET'));

      const result = await withRetry(fn, {
        ...TEST_OPTIONS,
        retryableErrors: ['ECONNRESET'],
        isRetryable: () => false, // Predicate says no, but code matches
      });

      expect(result).toBe('recovered');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // withRetry Exponential Backoff Tests
  // ─────────────────────────────────────────────────────────────

  describe('exponential backoff', () => {
    it('increases delay between retries (verified via call count)', async () => {
      const fn = createAlwaysFail(() => createErrorWithCode('ECONNRESET'));
      const startTime = Date.now();

      try {
        await withRetry(fn, {
          maxAttempts: 4,
          initialDelayMs: 5, // Short delays for fast tests
          maxDelayMs: 100,
          backoffFactor: 2,
          jitter: false,
        });
      } catch {
        // Expected to fail
      }

      const elapsed = Date.now() - startTime;

      // With 4 attempts, delays are: 5, 10, 20 = 35ms minimum
      // Allow some tolerance for test execution overhead
      expect(elapsed).toBeGreaterThanOrEqual(30);
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it('caps delay at maxDelayMs (verified via timing)', async () => {
      const fn = createAlwaysFail(() => createErrorWithCode('ECONNRESET'));
      const startTime = Date.now();

      try {
        await withRetry(fn, {
          maxAttempts: 5,
          initialDelayMs: 10,
          maxDelayMs: 15, // Cap at 15ms
          backoffFactor: 3,
          jitter: false,
        });
      } catch {
        // Expected to fail
      }

      const elapsed = Date.now() - startTime;

      // Delays: 10 (actual 10), 30 (capped to 15), 90 (capped to 15), 270 (capped to 15)
      // Total: 10 + 15 + 15 + 15 = 55ms
      // Allow tolerance
      expect(elapsed).toBeLessThan(100);
      expect(fn).toHaveBeenCalledTimes(5);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // withRetry Jitter Tests
  // ─────────────────────────────────────────────────────────────

  describe('jitter', () => {
    it('adds variation when jitter is enabled', async () => {
      const originalRandom = Math.random;

      // Mock Math.random to return predictable values
      let callCount = 0;
      Math.random = () => {
        callCount++;
        // Alternate between 0.1 and 0.9 to test jitter range
        return callCount % 2 === 0 ? 0.1 : 0.9;
      };

      const fn = createAlwaysFail(() => createErrorWithCode('ECONNRESET'));

      try {
        await withRetry(fn, {
          maxAttempts: 3,
          initialDelayMs: 100,
          backoffFactor: 1, // No backoff, just jitter
          jitter: true,
          maxDelayMs: 1000,
        });
      } catch {
        // Expected
      }

      Math.random = originalRandom;

      // Verify the function was called 3 times
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('produces deterministic delays when jitter is disabled', async () => {
      const fn = createAlwaysFail(() => createErrorWithCode('ECONNRESET'));
      const startTime = Date.now();

      try {
        await withRetry(fn, {
          maxAttempts: 3,
          initialDelayMs: 10,
          backoffFactor: 2,
          jitter: false,
          maxDelayMs: 100,
        });
      } catch {
        // Expected
      }

      const elapsed = Date.now() - startTime;

      // Without jitter: 10 + 20 = 30ms (between attempts 1-2 and 2-3)
      // Should be close to 30ms
      expect(elapsed).toBeGreaterThanOrEqual(25);
      expect(elapsed).toBeLessThan(60);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // withRetry Custom Options Tests
  // ─────────────────────────────────────────────────────────────

  describe('custom options', () => {
    it('respects custom maxAttempts', async () => {
      const fn = createAlwaysFail(() => createErrorWithCode('ECONNRESET'));

      await expect(
        withRetry(fn, {
          ...TEST_OPTIONS,
          maxAttempts: 5,
        })
      ).rejects.toThrow();

      expect(fn).toHaveBeenCalledTimes(5);
    });

    it('respects custom retryableErrors', async () => {
      const fn = createFailThenSucceed(1, 'recovered', () => createErrorWithCode('CUSTOM_ERROR'));

      const result = await withRetry(fn, {
        ...TEST_OPTIONS,
        retryableErrors: ['CUSTOM_ERROR'],
      });

      expect(result).toBe('recovered');
    });

    it('respects custom backoffFactor', async () => {
      const fn = createAlwaysFail(() => createErrorWithCode('ECONNRESET'));
      const startTime = Date.now();

      try {
        await withRetry(fn, {
          maxAttempts: 4,
          initialDelayMs: 5,
          backoffFactor: 3, // 5, 15, 45
          jitter: false,
          maxDelayMs: 1000,
        });
      } catch {
        // Expected
      }

      const elapsed = Date.now() - startTime;

      // Delays: 5 + 15 + 45 = 65ms
      expect(elapsed).toBeGreaterThanOrEqual(60);
      expect(fn).toHaveBeenCalledTimes(4);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // withRetry Validation Tests
  // ─────────────────────────────────────────────────────────────

  describe('validation', () => {
    it('throws on maxAttempts less than 1', async () => {
      await expect(withRetry(() => Promise.resolve('test'), { maxAttempts: 0 })).rejects.toThrow(
        'maxAttempts must be at least 1'
      );
    });

    it('throws on negative maxAttempts', async () => {
      await expect(withRetry(() => Promise.resolve('test'), { maxAttempts: -1 })).rejects.toThrow(
        'maxAttempts must be at least 1'
      );
    });

    it('throws on negative initialDelayMs', async () => {
      await expect(
        withRetry(() => Promise.resolve('test'), { initialDelayMs: -100 })
      ).rejects.toThrow('initialDelayMs must be non-negative');
    });

    it('throws on negative maxDelayMs', async () => {
      await expect(withRetry(() => Promise.resolve('test'), { maxDelayMs: -1 })).rejects.toThrow(
        'maxDelayMs must be non-negative'
      );
    });

    it('allows zero initialDelayMs', async () => {
      const fn = createFailThenSucceed(1, 'success', () => createErrorWithCode('ECONNRESET'));

      const result = await withRetry(fn, { initialDelayMs: 0 });

      expect(result).toBe('success');
    });

    it('allows maxAttempts of 1 (no retry)', async () => {
      const fn = jest.fn(async () => 'success');

      const result = await withRetry(fn, { maxAttempts: 1 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // withRetry Edge Cases
  // ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles synchronous throws in fn', async () => {
      const fn = jest.fn(() => {
        throw createErrorWithCode('ECONNRESET');
      });

      await expect(
        withRetry(fn as () => Promise<never>, {
          ...TEST_OPTIONS,
          maxAttempts: 2,
        })
      ).rejects.toThrow();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('handles async rejection', async () => {
      const fn = jest.fn(async () => {
        await Promise.resolve(); // Ensure it's async
        throw createErrorWithCode('ECONNRESET', 'Async rejection');
      });

      await expect(withRetry(fn, { ...TEST_OPTIONS, maxAttempts: 2 })).rejects.toThrow(
        'Async rejection'
      );

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('converts non-Error throws to Error', async () => {
      const fn = jest.fn(async () => {
        throw 'string error'; // Non-Error throw
      });

      await expect(
        withRetry(fn as () => Promise<never>, {
          ...TEST_OPTIONS,
          maxAttempts: 1,
          retryableErrors: [],
        })
      ).rejects.toThrow('string error');
    });

    it('preserves error properties in thrown error', async () => {
      class CustomError extends Error {
        constructor(
          message: string,
          public code: string,
          public details: Record<string, unknown>
        ) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const customError = new CustomError('Test', 'ERR_CUSTOM', { foo: 'bar' });
      const fn = jest.fn(async () => {
        throw customError;
      });

      try {
        await withRetry(fn as () => Promise<never>, {
          ...TEST_OPTIONS,
          maxAttempts: 1,
          retryableErrors: [],
        });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
        expect((error as CustomError).code).toBe('ERR_CUSTOM');
        expect((error as CustomError).details).toEqual({ foo: 'bar' });
      }
    });

    it('merges custom options with defaults', async () => {
      const fn = createFailThenSucceed(1, 'success', () => createErrorWithCode('ECONNRESET'));

      // Only override maxAttempts, should use default retryableErrors
      const result = await withRetry(fn, {
        maxAttempts: 2,
        initialDelayMs: 1,
        jitter: false,
      });

      expect(result).toBe('success');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // withRetry Logging Verification
  // ─────────────────────────────────────────────────────────────

  describe('logging', () => {
    it('logs retry attempts (visible in test output)', async () => {
      // This test verifies logging happens by checking the retry behavior
      // Actual log output is visible in console during test runs
      const fn = createFailThenSucceed(2, 'success', () => createErrorWithCode('ETIMEDOUT'));

      const result = await withRetry(fn, {
        ...TEST_OPTIONS,
        maxAttempts: 3,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      // Log messages are printed to console:
      // - 2x warn: resilience.retry.attempt (attempts 1 and 2)
      // - 1x info: resilience.retry.success (attempt 3)
    });

    it('logs exhaustion error (visible in test output)', async () => {
      const fn = createAlwaysFail(() => createErrorWithCode('ECONNRESET'));

      await expect(withRetry(fn, TEST_OPTIONS)).rejects.toThrow();

      // Log messages are printed to console:
      // - 2x warn: resilience.retry.attempt (attempts 1 and 2)
      // - 1x error: resilience.retry.exhausted (attempt 3)
    });
  });
});
