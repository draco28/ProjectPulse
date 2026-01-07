/**
 * Service-Specific Circuit Breakers
 *
 * Pre-configured circuit breakers for external services.
 * Part of Phase 3: Resilience Patterns (Ticket #143)
 *
 * This module provides circuit breaker wrappers for critical services:
 * - Embedding generation (Ollama/OpenAI)
 *
 * @module lib/circuit-breaker/services
 */

import {
  getCircuitBreaker,
  getCircuitStatus,
  type CircuitBreakerOptions,
  type CircuitBreakerStatus,
} from './index';
import {
  generateEmbedding,
  type EmbeddingServiceOptions,
  type EmbeddingResult,
} from '@/lib/embeddings';
import { createLogger } from '@/lib/logger';

const log = createLogger({ module: 'CircuitBreaker:Services' });

// =============================================================================
// Embedding Service Circuit Breaker
// =============================================================================

/**
 * Circuit breaker options for embedding service.
 *
 * Tuned for embedding workload characteristics:
 * - 15s timeout: Allows for Ollama cold start retry (3 attempts × 2-5s)
 * - 50% error threshold: Standard threshold
 * - 60s reset: Embeddings are expensive, wait for proper recovery
 * - 3 volume threshold: Trip quickly on embedding failures
 */
export const EMBEDDING_CIRCUIT_OPTIONS: Partial<CircuitBreakerOptions> = {
  timeout: 15_000, // 15s - allows Ollama cold start retry
  errorThresholdPercentage: 50, // Trip at 50% failure rate
  resetTimeout: 60_000, // 60s before testing recovery
  volumeThreshold: 3, // Need 3 requests before calculating percentage
};

/**
 * Generate embedding with circuit breaker protection.
 *
 * Wraps generateEmbedding() with circuit breaker that:
 * - Fails fast when embedding services are unavailable
 * - Tracks failure rate across all embedding calls
 * - Allows half-open testing after reset timeout
 *
 * The circuit breaker protects the entire embedding service (both Ollama
 * and OpenAI providers). This is intentional because:
 * 1. generateEmbedding() already has Ollama → OpenAI fallback logic
 * 2. If both providers fail, we want to trip the circuit
 * 3. A single breaker simplifies monitoring and configuration
 *
 * @param text - Text to embed (max ~8000 tokens)
 * @param options - Embedding configuration options
 * @returns Embedding result with 768-dimensional vector
 * @throws Circuit breaker error if circuit is open (code: 'EOPENBREAKER')
 *
 * @example
 * ```typescript
 * try {
 *   const result = await generateEmbeddingProtected('PostgreSQL indexing');
 *   console.log(result.embedding.length); // 768
 * } catch (error) {
 *   if (error.code === 'EOPENBREAKER') {
 *     // Circuit is open, use fallback
 *     return fullTextSearch(query);
 *   }
 *   throw error;
 * }
 * ```
 */
export async function generateEmbeddingProtected(
  text: string,
  options: EmbeddingServiceOptions = {}
): Promise<EmbeddingResult> {
  // Get or create the embedding circuit breaker
  // Uses factory pattern - same breaker instance returned for 'embedding' name
  const breaker = getCircuitBreaker(
    'embedding',
    (t: string, opts: EmbeddingServiceOptions) => generateEmbedding(t, opts),
    EMBEDDING_CIRCUIT_OPTIONS
  );

  return breaker.fire(text, options);
}

/**
 * Check if embedding circuit breaker is currently open.
 *
 * Use this to make fallback decisions BEFORE attempting embedding generation.
 * This avoids the overhead of calling the breaker when it's already open.
 *
 * @returns true if circuit is open (embedding service unavailable)
 *
 * @example
 * ```typescript
 * if (isEmbeddingCircuitOpen()) {
 *   log.info('Embedding circuit open, using fulltext fallback');
 *   return fullTextSearch(query, options);
 * }
 * // Circuit closed, attempt semantic search
 * const results = await semanticSearch(query, options);
 * ```
 */
export function isEmbeddingCircuitOpen(): boolean {
  const status = getCircuitStatus();
  const embeddingStatus = status['embedding'];

  if (!embeddingStatus) {
    // Circuit not yet created - service not yet called
    // Return false to allow first call to proceed
    return false;
  }

  return embeddingStatus.state === 'OPEN';
}

/**
 * Get embedding circuit breaker status for health checks.
 *
 * Returns detailed status including state and statistics.
 * Use this in health endpoints to expose circuit breaker state.
 *
 * @returns Circuit status object or null if not yet created
 *
 * @example
 * ```typescript
 * // In /api/health route
 * const embeddingStatus = getEmbeddingCircuitStatus();
 * return {
 *   status: 'healthy',
 *   circuits: {
 *     embedding: embeddingStatus ?? { state: 'NOT_INITIALIZED' }
 *   }
 * };
 * ```
 */
export function getEmbeddingCircuitStatus(): CircuitBreakerStatus | null {
  const status = getCircuitStatus();
  return status['embedding'] ?? null;
}

/**
 * Check if embedding circuit is in half-open state (testing recovery).
 *
 * In half-open state, the circuit allows a single test request through.
 * If it succeeds, the circuit closes. If it fails, the circuit reopens.
 *
 * @returns true if circuit is in half-open state
 */
export function isEmbeddingCircuitHalfOpen(): boolean {
  const status = getCircuitStatus();
  const embeddingStatus = status['embedding'];

  if (!embeddingStatus) {
    return false;
  }

  return embeddingStatus.state === 'HALF_OPEN';
}
