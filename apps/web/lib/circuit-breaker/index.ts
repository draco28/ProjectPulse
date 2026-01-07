/**
 * Circuit Breaker Infrastructure
 *
 * Generic circuit breaker wrapper using opossum library.
 * Part of Phase 3: Resilience Patterns (Ticket #142)
 *
 * Provides a getCircuitBreaker() factory that creates/retrieves breakers
 * with automatic state transition logging and registry tracking.
 *
 * Circuit Breaker States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failures exceeded threshold, requests fail fast
 * - HALF_OPEN: Testing if service recovered after reset timeout
 *
 * @module lib/circuit-breaker
 */

import CircuitBreaker from 'opossum';
import { createLogger } from '@/lib/logger';
import { LogMessages } from '@/lib/logger/standards';

const log = createLogger({ module: 'CircuitBreaker' });

// =============================================================================
// Types and Interfaces
// =============================================================================

/**
 * Configuration for circuit breaker behavior.
 *
 * @example
 * ```typescript
 * const options: Partial<CircuitBreakerOptions> = {
 *   timeout: 5000,
 *   errorThresholdPercentage: 30,
 *   resetTimeout: 15000,
 * };
 * ```
 */
export interface CircuitBreakerOptions {
  /** Timeout in milliseconds for the protected function (default: 10000) */
  timeout: number;

  /** Percentage of failures before opening circuit (default: 50) */
  errorThresholdPercentage: number;

  /** Time in ms before attempting to close circuit (default: 30000) */
  resetTimeout: number;

  /** Minimum number of requests before calculating failure percentage (default: 5) */
  volumeThreshold: number;
}

/**
 * Circuit breaker state representation.
 */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Statistics from a circuit breaker.
 */
export interface CircuitBreakerStats {
  failures: number;
  successes: number;
  fallbacks: number;
  timeouts: number;
  cacheHits: number;
}

/**
 * Status information for a single circuit breaker.
 */
export interface CircuitBreakerStatus {
  state: CircuitState;
  stats: CircuitBreakerStats;
}

/**
 * Default circuit breaker configuration.
 *
 * Tuned for typical external service calls:
 * - 10s timeout per call
 * - Opens at 50% failure rate
 * - Tests recovery after 30s
 * - Requires 5 requests before tripping
 */
export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: CircuitBreakerOptions = {
  timeout: 10_000,
  errorThresholdPercentage: 50,
  resetTimeout: 30_000,
  volumeThreshold: 5,
};

// =============================================================================
// Circuit Breaker Registry
// =============================================================================

/**
 * Registry of all created circuit breakers.
 * Used for status reporting and test cleanup.
 */
const breakers = new Map<string, CircuitBreaker>();

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Get or create a circuit breaker for a named operation.
 *
 * If a breaker with the given name already exists, returns the existing instance.
 * This ensures the same breaker is used across multiple calls to the same service.
 *
 * @typeParam TArgs - Argument types for the protected function
 * @typeParam TResult - Return type of the protected function
 * @param name - Unique identifier for this circuit breaker
 * @param fn - Function to protect with circuit breaker
 * @param options - Circuit breaker configuration (partial, merged with defaults)
 * @returns The circuit breaker instance
 *
 * @example
 * ```typescript
 * // Create a breaker for Redis operations
 * const redisBreaker = getCircuitBreaker(
 *   'redis',
 *   async (key: string) => redis.get(key),
 *   { timeout: 3000, errorThresholdPercentage: 30 }
 * );
 *
 * // Execute with circuit breaker protection
 * const value = await redisBreaker.fire('my-key');
 * ```
 *
 * @example
 * ```typescript
 * // Create a breaker for embedding service
 * const embeddingBreaker = getCircuitBreaker(
 *   'embedding',
 *   async (text: string) => generateEmbedding(text),
 *   { timeout: 15000, resetTimeout: 60000 }
 * );
 * ```
 */
export function getCircuitBreaker<TArgs extends unknown[], TResult>(
  name: string,
  fn: (...args: TArgs) => Promise<TResult>,
  options: Partial<CircuitBreakerOptions> = {}
): CircuitBreaker<TArgs, TResult> {
  // Return existing breaker if already created
  if (breakers.has(name)) {
    return breakers.get(name) as CircuitBreaker<TArgs, TResult>;
  }

  const opts: CircuitBreakerOptions = {
    ...DEFAULT_CIRCUIT_BREAKER_OPTIONS,
    ...options,
  };

  // Create new circuit breaker with opossum
  const breaker = new CircuitBreaker<TArgs, TResult>(fn, {
    timeout: opts.timeout,
    errorThresholdPercentage: opts.errorThresholdPercentage,
    resetTimeout: opts.resetTimeout,
    volumeThreshold: opts.volumeThreshold,
    name,
  });

  // Register event listeners for state transitions
  breaker.on('open', () => {
    log.warn(
      {
        circuit: name,
        stats: {
          failures: breaker.stats.failures,
          successes: breaker.stats.successes,
        },
      },
      LogMessages.CIRCUIT_OPENED
    );
  });

  breaker.on('halfOpen', () => {
    log.info(
      {
        circuit: name,
      },
      LogMessages.CIRCUIT_HALF_OPEN
    );
  });

  breaker.on('close', () => {
    log.info(
      {
        circuit: name,
        stats: {
          failures: breaker.stats.failures,
          successes: breaker.stats.successes,
        },
      },
      LogMessages.CIRCUIT_CLOSED
    );
  });

  breaker.on('fallback', () => {
    log.debug(
      {
        circuit: name,
      },
      LogMessages.CIRCUIT_FALLBACK
    );
  });

  // Register in breakers map
  breakers.set(name, breaker as unknown as CircuitBreaker);

  return breaker;
}

// =============================================================================
// Status and Utility Functions
// =============================================================================

/**
 * Get the current state of a circuit breaker.
 *
 * @param breaker - The circuit breaker instance
 * @returns The circuit state: CLOSED, OPEN, or HALF_OPEN
 */
function getCircuitState(breaker: CircuitBreaker): CircuitState {
  if (breaker.opened) {
    return 'OPEN';
  }
  if (breaker.halfOpen) {
    return 'HALF_OPEN';
  }
  return 'CLOSED';
}

/**
 * Get status of all registered circuit breakers.
 *
 * Use this for health endpoint integration to expose circuit state.
 *
 * @returns Object mapping breaker names to their status
 *
 * @example
 * ```typescript
 * // In health endpoint
 * const circuitStatus = getCircuitStatus();
 * // Returns:
 * // {
 * //   redis: { state: 'CLOSED', stats: { failures: 0, successes: 42, ... } },
 * //   embedding: { state: 'HALF_OPEN', stats: { failures: 3, successes: 15, ... } },
 * // }
 * ```
 */
export function getCircuitStatus(): Record<string, CircuitBreakerStatus> {
  const status: Record<string, CircuitBreakerStatus> = {};

  for (const [name, breaker] of breakers) {
    status[name] = {
      state: getCircuitState(breaker),
      stats: {
        failures: breaker.stats.failures,
        successes: breaker.stats.successes,
        fallbacks: breaker.stats.fallbacks,
        timeouts: breaker.stats.timeouts,
        cacheHits: breaker.stats.cacheHits,
      },
    };
  }

  return status;
}

/**
 * Clear all registered circuit breakers.
 *
 * Use this in tests to reset state between test cases.
 * In production, this should never be called.
 *
 * @example
 * ```typescript
 * // In test teardown
 * afterEach(() => {
 *   clearBreakers();
 * });
 * ```
 */
export function clearBreakers(): void {
  for (const breaker of breakers.values()) {
    breaker.shutdown();
  }
  breakers.clear();
}

/**
 * Get the number of registered circuit breakers.
 *
 * Useful for testing to verify breaker registration.
 *
 * @returns Number of registered breakers
 */
export function getBreakerCount(): number {
  return breakers.size;
}
