/**
 * Metrics Module
 *
 * Re-exports API metrics functionality for cleaner imports.
 * Part of Phase 2: Observability Infrastructure.
 *
 * @module lib/metrics
 *
 * @example
 * ```typescript
 * import { recordAPIMetric, flushMetrics } from '@/lib/metrics';
 * ```
 */

export {
  recordAPIMetric,
  flushMetrics,
  getBufferStats,
  SLOW_REQUEST_THRESHOLD_MS,
  type APIMetric,
} from './api-metrics';
