/**
 * API Response Time Metrics
 *
 * Tracks API response times with structured logging.
 * Part of Phase 2: Observability Infrastructure (Ticket #136)
 *
 * Features:
 * - In-memory buffer with lazy flush (Edge Runtime compatible)
 * - Immediate slow request warnings (>1s threshold)
 * - Batch logging to prevent log spam
 * - Memory-safe with hard cap on buffer size
 *
 * @module lib/metrics/api-metrics
 */

import { logger } from '@/lib/logger';
import { LogMessages } from '@/lib/logger/standards';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

/** Threshold for slow request warnings (1 second) */
export const SLOW_REQUEST_THRESHOLD_MS = 1000;

/** Number of metrics to buffer before flushing */
const FLUSH_THRESHOLD = 100;

/** Time interval for lazy flush check (10 seconds) */
const FLUSH_INTERVAL_MS = 10000;

/** Hard cap on buffer size to prevent unbounded memory growth */
const BUFFER_HARD_CAP = 200;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/**
 * Metric data captured for each API request.
 *
 * Note: statusCode is not included because Next.js middleware runs
 * before route handlers - we don't know the final response code.
 * Timing captures middleware overhead (auth, routing, header manipulation).
 */
export interface APIMetric {
  /** Request correlation ID (from X-Request-ID header) */
  requestId: string;

  /** API route path (e.g., '/api/tickets') */
  path: string;

  /** HTTP method (GET, POST, PUT, DELETE, PATCH) */
  method: string;

  /** Middleware duration in milliseconds */
  durationMs: number;

  /** Unix timestamp when metric was recorded */
  timestamp: number;

  /** Client user agent (optional) */
  userAgent?: string;

  /** Client IP address (optional) */
  ip?: string;
}

// ─────────────────────────────────────────────────────────────
// Module State
// ─────────────────────────────────────────────────────────────

/**
 * In-memory buffer for metrics.
 *
 * Note: In Edge Runtime, module state persists within a worker's
 * lifetime but is NOT shared across workers. State resets on
 * worker recycle (acceptable - minor data loss).
 */
const metricsBuffer: APIMetric[] = [];

/** Timestamp of last flush operation */
let lastFlushTime = Date.now();

// ─────────────────────────────────────────────────────────────
// Internal Functions
// ─────────────────────────────────────────────────────────────

/**
 * Check if flush conditions are met.
 * Uses lazy flush strategy (no setInterval) for Edge Runtime compatibility.
 */
function shouldFlush(): boolean {
  const now = Date.now();
  const timeSinceLastFlush = now - lastFlushTime;

  return (
    metricsBuffer.length >= FLUSH_THRESHOLD ||
    (metricsBuffer.length > 0 && timeSinceLastFlush >= FLUSH_INTERVAL_MS)
  );
}

/**
 * Perform the actual flush of metrics to logs.
 * Logs each metric as a structured JSON entry.
 */
function performFlush(): void {
  if (metricsBuffer.length === 0) return;

  const batch = metricsBuffer.splice(0);
  const batchSize = batch.length;

  // Calculate batch statistics
  const durations = batch.map((m) => m.durationMs);
  const avgDuration = Math.round(
    durations.reduce((a, b) => a + b, 0) / batchSize
  );
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);

  // Log batch summary
  logger.info(
    {
      metric: LogMessages.API_METRICS_BATCH,
      batchSize,
      avgDurationMs: avgDuration,
      maxDurationMs: maxDuration,
      minDurationMs: minDuration,
    },
    `API metrics batch: ${batchSize} requests (avg ${avgDuration}ms)`
  );

  // Log individual metrics at debug level for detailed analysis
  batch.forEach((m) => {
    logger.debug(
      {
        metric: 'api_response_time',
        requestId: m.requestId,
        path: m.path,
        method: m.method,
        durationMs: m.durationMs,
        timestamp: m.timestamp,
      },
      `${m.method} ${m.path}: ${m.durationMs}ms`
    );
  });

  lastFlushTime = Date.now();
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Record an API metric.
 *
 * Adds to buffer and triggers flush if threshold reached.
 * Logs warning immediately for slow requests (>1s).
 *
 * @param metric - The API metric data to record
 *
 * @example
 * ```typescript
 * recordAPIMetric({
 *   requestId: 'abc-123',
 *   path: '/api/tickets',
 *   method: 'GET',
 *   durationMs: 42,
 *   timestamp: Date.now(),
 * });
 * ```
 */
export function recordAPIMetric(metric: APIMetric): void {
  // Log slow requests immediately (don't wait for batch)
  if (metric.durationMs > SLOW_REQUEST_THRESHOLD_MS) {
    logger.warn(
      {
        metric: LogMessages.API_REQUEST_SLOW,
        requestId: metric.requestId,
        path: metric.path,
        method: metric.method,
        durationMs: metric.durationMs,
        threshold: SLOW_REQUEST_THRESHOLD_MS,
      },
      `Slow request: ${metric.method} ${metric.path} took ${metric.durationMs}ms (threshold: ${SLOW_REQUEST_THRESHOLD_MS}ms)`
    );
  }

  // Add to buffer
  metricsBuffer.push(metric);

  // Enforce hard cap to prevent unbounded memory growth
  if (metricsBuffer.length > BUFFER_HARD_CAP) {
    // Drop oldest entries to stay under cap
    const overflow = metricsBuffer.length - BUFFER_HARD_CAP;
    metricsBuffer.splice(0, overflow);
    logger.warn(
      {
        metric: 'api_metrics_overflow',
        dropped: overflow,
        bufferSize: metricsBuffer.length,
      },
      `API metrics buffer overflow: dropped ${overflow} oldest entries`
    );
  }

  // Check lazy flush conditions
  if (shouldFlush()) {
    performFlush();
  }
}

/**
 * Force flush the metrics buffer.
 *
 * Useful for graceful shutdown or testing scenarios.
 * Called automatically by lazy flush, but can be invoked manually.
 *
 * @example
 * ```typescript
 * // In graceful shutdown handler
 * flushMetrics();
 * ```
 */
export function flushMetrics(): void {
  performFlush();
}

/**
 * Get current buffer statistics for monitoring/debugging.
 *
 * @returns Buffer count and last flush timestamp
 *
 * @example
 * ```typescript
 * const stats = getBufferStats();
 * console.log(`Buffer: ${stats.count} entries, last flush: ${stats.lastFlushTime}`);
 * ```
 */
export function getBufferStats(): { count: number; lastFlushTime: number } {
  return {
    count: metricsBuffer.length,
    lastFlushTime,
  };
}
