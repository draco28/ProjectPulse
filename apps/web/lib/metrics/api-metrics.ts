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
 * IMPORTANT: This module runs in Edge Runtime (middleware context).
 * Cannot import Pino logger - use console methods with JSON output.
 * Log format matches Pino for consistency with server-side logs.
 *
 * @module lib/metrics/api-metrics
 */

// Log message constants (duplicated to avoid importing from logger which pulls pino)
const LOG_MESSAGES = {
  API_REQUEST_SLOW: 'api.request.slow',
  API_METRICS_BATCH: 'api.metrics.batch',
} as const;

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
 *
 * Uses console.log with JSON for Edge Runtime compatibility.
 * Format matches Pino output for log aggregation consistency.
 */
function performFlush(): void {
  if (metricsBuffer.length === 0) return;

  const batch = metricsBuffer.splice(0);
  const batchSize = batch.length;

  // Calculate batch statistics
  const durations = batch.map((m) => m.durationMs);
  const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / batchSize);
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);

  // Log batch summary (JSON format for log aggregation)
  console.log(
    JSON.stringify({
      level: 'info',
      time: Date.now(),
      msg: `API metrics batch: ${batchSize} requests (avg ${avgDuration}ms)`,
      metric: LOG_MESSAGES.API_METRICS_BATCH,
      batchSize,
      avgDurationMs: avgDuration,
      maxDurationMs: maxDuration,
      minDurationMs: minDuration,
    })
  );

  // Individual metrics are logged at batch level only to reduce log volume
  // Debug-level logging would spam in Edge Runtime context

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
  // Uses console.warn with JSON for Edge Runtime compatibility
  if (metric.durationMs > SLOW_REQUEST_THRESHOLD_MS) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        time: Date.now(),
        msg: `Slow request: ${metric.method} ${metric.path} took ${metric.durationMs}ms (threshold: ${SLOW_REQUEST_THRESHOLD_MS}ms)`,
        metric: LOG_MESSAGES.API_REQUEST_SLOW,
        requestId: metric.requestId,
        path: metric.path,
        method: metric.method,
        durationMs: metric.durationMs,
        threshold: SLOW_REQUEST_THRESHOLD_MS,
      })
    );
  }

  // Add to buffer
  metricsBuffer.push(metric);

  // Enforce hard cap to prevent unbounded memory growth
  if (metricsBuffer.length > BUFFER_HARD_CAP) {
    // Drop oldest entries to stay under cap
    const overflow = metricsBuffer.length - BUFFER_HARD_CAP;
    metricsBuffer.splice(0, overflow);
    console.warn(
      JSON.stringify({
        level: 'warn',
        time: Date.now(),
        msg: `API metrics buffer overflow: dropped ${overflow} oldest entries`,
        metric: 'api_metrics_overflow',
        dropped: overflow,
        bufferSize: metricsBuffer.length,
      })
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
