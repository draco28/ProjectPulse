/**
 * Timeout Utilities
 *
 * Promise timeout wrapper with structured logging.
 * Part of Phase 3: Resilience Patterns (Ticket #140)
 *
 * Provides a withTimeout() wrapper that races a promise against
 * a timeout, throwing TimeoutError if the operation exceeds the limit.
 *
 * @module lib/utils/timeout
 */

import { createLogger } from '@/lib/logger';
import { LogMessages } from '@/lib/logger/standards';

const log = createLogger({ module: 'Timeout' });

/**
 * Custom error thrown when an operation exceeds its timeout.
 *
 * Includes operation context for debugging and logging.
 *
 * @example
 * ```typescript
 * try {
 *   await withTimeout(slowOperation(), 5000, 'slow-op');
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *     console.log(`${error.operation} timed out after ${error.timeoutMs}ms`);
 *   }
 * }
 * ```
 */
export class TimeoutError extends Error {
  /**
   * Creates a new TimeoutError.
   *
   * @param message - Human-readable error message
   * @param operation - Name of the operation that timed out
   * @param timeoutMs - Timeout value in milliseconds
   */
  constructor(
    message: string,
    public readonly operation: string,
    public readonly timeoutMs: number
  ) {
    super(message);
    this.name = 'TimeoutError';

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError);
    }
  }
}

/**
 * Wrap a promise with a timeout.
 *
 * Races the provided promise against a timeout. If the promise
 * resolves before the timeout, returns the result. If the timeout
 * fires first, throws a TimeoutError with operation context.
 *
 * Timeout events are logged at warn level via Pino.
 *
 * @typeParam T - The type of the promise result
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds (must be positive)
 * @param operation - Name of the operation (for error context and logging)
 * @returns The promise result if it resolves before timeout
 * @throws {TimeoutError} If the operation exceeds the timeout
 * @throws {Error} If timeoutMs is not positive
 *
 * @example
 * ```typescript
 * import { withTimeout } from '@/lib/utils/timeout';
 * import { TIMEOUTS } from '@/lib/config/timeouts';
 *
 * // Wrap a database query
 * const tickets = await withTimeout(
 *   prisma.ticket.findMany({ where }),
 *   TIMEOUTS.external.database,
 *   'ticket.findMany'
 * );
 *
 * // Wrap an embedding call
 * const embedding = await withTimeout(
 *   generateEmbedding(text),
 *   TIMEOUTS.external.embedding,
 *   'embedding.generate'
 * );
 * ```
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  // Validate timeout value
  if (timeoutMs <= 0) {
    throw new Error(`timeoutMs must be positive, got ${timeoutMs}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          log.warn({ operation, timeoutMs }, LogMessages.TIMEOUT_OCCURRED);
          reject(
            new TimeoutError(
              `Operation '${operation}' timed out after ${timeoutMs}ms`,
              operation,
              timeoutMs
            )
          );
        });
      }),
    ]);

    return result;
  } finally {
    // Always clear timeout to prevent memory leaks
    clearTimeout(timeoutId);
  }
}
