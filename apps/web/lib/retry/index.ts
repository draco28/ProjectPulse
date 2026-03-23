/**
 * Retry Utilities
 *
 * Generic retry wrapper with exponential backoff and jitter.
 * Part of Phase 3: Resilience Patterns (Ticket #141)
 *
 * Provides a withRetry() wrapper that automatically retries failed operations
 * with configurable backoff, jitter, and error classification.
 *
 * @module lib/retry
 */

import { createLogger } from '@/lib/logger';
import { LogMessages } from '@/lib/logger/standards';

const log = createLogger({ module: 'Retry' });

// =============================================================================
// Types and Interfaces
// =============================================================================

/**
 * Configuration for retry behavior.
 *
 * @example
 * ```typescript
 * const options: Partial<RetryOptions> = {
 *   maxAttempts: 5,
 *   initialDelayMs: 200,
 *   retryableErrors: ['ECONNRESET', 'ETIMEDOUT'],
 * };
 * ```
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts: number;

  /** Initial delay between retries in ms (default: 100) */
  initialDelayMs: number;

  /** Maximum delay between retries in ms (default: 5000) */
  maxDelayMs: number;

  /** Backoff multiplier (default: 2) */
  backoffFactor: number;

  /**
   * Error codes/messages that should trigger retry.
   * Matches against error.code or error.message substring.
   */
  retryableErrors: string[];

  /** Add jitter to prevent thundering herd (default: true) */
  jitter: boolean;

  /**
   * Custom predicate function for complex retry logic.
   * If provided, error is retryable if EITHER this returns true
   * OR the error matches retryableErrors.
   *
   * @example
   * ```typescript
   * isRetryable: (error) => error instanceof OllamaError && error.statusCode === 500
   * ```
   */
  isRetryable?: (error: unknown) => boolean;
}

/**
 * Default retry configuration.
 *
 * Tuned for typical network operations:
 * - 3 attempts total (initial + 2 retries)
 * - 100ms initial delay, doubling each retry
 * - Max 5 second delay between retries
 * - Common transient error codes
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffFactor: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'EPIPE',
    'ENOTFOUND',
    'P1001', // Prisma: Can't reach database server
    'P1002', // Prisma: Database server timeout
  ],
  jitter: true,
};

// =============================================================================
// Error Classification
// =============================================================================

/**
 * Check if an error is retryable based on error codes/messages.
 *
 * Matches against:
 * 1. error.code property (exact match)
 * 2. error.message substring (case-sensitive)
 *
 * @param error - The error to check
 * @param retryableErrors - List of error codes/messages to match
 * @returns true if the error is retryable
 *
 * @example
 * ```typescript
 * const error = new Error('Connection reset by peer');
 * error.code = 'ECONNRESET';
 *
 * isRetryableError(error, ['ECONNRESET']); // true (code match)
 * isRetryableError(error, ['reset']); // true (message substring)
 * isRetryableError(error, ['ETIMEOUT']); // false (no match)
 * ```
 */
export function isRetryableError(error: unknown, retryableErrors: string[]): boolean {
  if (retryableErrors.length === 0) {
    return false;
  }

  // Handle null/undefined early - they can't match any error codes
  if (error === null || error === undefined) {
    return false;
  }

  const errorCode = (error as { code?: string }).code;

  // Get message from Error instance, or convert to string for other types
  let errorMessage: string;
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    errorMessage = String((error as { message: unknown }).message);
  } else {
    errorMessage = String(error);
  }

  return retryableErrors.some((code) => errorCode === code || errorMessage.includes(code));
}

// =============================================================================
// Delay Calculation
// =============================================================================

/**
 * Calculate delay with exponential backoff and optional jitter.
 *
 * Formula: min(initialDelayMs * backoffFactor^attempt, maxDelayMs)
 * Jitter: +/- 25% randomization to prevent thundering herd
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param options - Retry options with delay configuration
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const exponentialDelay = options.initialDelayMs * Math.pow(options.backoffFactor, attempt);
  const cappedDelay = Math.min(exponentialDelay, options.maxDelayMs);

  if (options.jitter) {
    // Add +/- 25% jitter to prevent thundering herd
    const jitterRange = cappedDelay * 0.25;
    const jitter = (Math.random() * 2 - 1) * jitterRange;
    return Math.round(cappedDelay + jitter);
  }

  return cappedDelay;
}

/**
 * Sleep for a specified duration.
 *
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Main Retry Function
// =============================================================================

/**
 * Execute a function with automatic retry on failure.
 *
 * Implements exponential backoff with optional jitter. Errors are classified
 * as retryable based on:
 * 1. Match against retryableErrors list (code or message substring)
 * 2. Custom isRetryable predicate function (if provided)
 *
 * Either condition triggers a retry (OR logic).
 *
 * @typeParam T - Return type of the function
 * @param fn - Function to execute (called on each attempt)
 * @param options - Retry configuration (partial, merged with defaults)
 * @returns The function result if successful
 * @throws The last error if all retries exhausted or error is not retryable
 *
 * @example
 * ```typescript
 * // Simple retry with default options
 * const result = await withRetry(() => fetchExternalAPI());
 *
 * // Custom configuration
 * const result = await withRetry(
 *   () => fetchExternalAPI(),
 *   {
 *     maxAttempts: 5,
 *     initialDelayMs: 200,
 *     retryableErrors: ['ECONNRESET', 'RATE_LIMITED'],
 *   }
 * );
 *
 * // Custom predicate for complex logic
 * const result = await withRetry(
 *   () => callOllama(text),
 *   {
 *     initialDelayMs: 2000, // Ollama cold start needs longer delay
 *     isRetryable: isOllamaColdStartError,
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };

  // Validate options
  if (opts.maxAttempts < 1) {
    throw new Error(`maxAttempts must be at least 1, got ${opts.maxAttempts}`);
  }
  if (opts.initialDelayMs < 0) {
    throw new Error(`initialDelayMs must be non-negative, got ${opts.initialDelayMs}`);
  }
  if (opts.maxDelayMs < 0) {
    throw new Error(`maxDelayMs must be non-negative, got ${opts.maxDelayMs}`);
  }

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const result = await fn();

      // Log success if we recovered from a previous failure
      if (attempt > 1) {
        log.info({ attempt, maxAttempts: opts.maxAttempts }, LogMessages.RETRY_SUCCESS);
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable via either mechanism
      const isRetryableByCode = isRetryableError(error, opts.retryableErrors);
      const isRetryableByPredicate = opts.isRetryable?.(error) ?? false;
      const shouldRetry = isRetryableByCode || isRetryableByPredicate;

      const hasMoreAttempts = attempt < opts.maxAttempts;

      // If not retryable or no more attempts, fail immediately
      if (!shouldRetry || !hasMoreAttempts) {
        log.error(
          {
            attempt,
            maxAttempts: opts.maxAttempts,
            error: lastError.message,
            errorCode: (error as { code?: string }).code,
            isRetryable: shouldRetry,
          },
          LogMessages.RETRY_EXHAUSTED
        );
        throw lastError;
      }

      // Calculate delay and log retry attempt
      const delay = calculateDelay(attempt - 1, opts);

      log.warn(
        {
          attempt,
          maxAttempts: opts.maxAttempts,
          nextAttempt: attempt + 1,
          nextDelayMs: delay,
          error: lastError.message,
          errorCode: (error as { code?: string }).code,
        },
        LogMessages.RETRY_ATTEMPT
      );

      await sleep(delay);
    }
  }

  // This should never happen due to the throw in the catch block,
  // but TypeScript needs it for type safety
  throw lastError!;
}
