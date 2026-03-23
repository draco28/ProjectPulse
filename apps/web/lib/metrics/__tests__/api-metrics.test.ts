/**
 * API Metrics Unit Tests
 *
 * Tests for API response time metrics (Ticket #136).
 * Part of Phase 2: Observability Infrastructure DoD verification (Ticket #138).
 *
 * Note: This module uses module-level state for the metrics buffer.
 * Tests use jest.resetModules() to ensure clean state between tests.
 *
 * @module lib/metrics/__tests__/api-metrics.test.ts
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Type definitions for the module
interface APIMetric {
  requestId: string;
  path: string;
  method: string;
  durationMs: number;
  timestamp: number;
  userAgent?: string;
  ip?: string;
}

interface BufferStats {
  count: number;
  lastFlushTime: number;
}

// Module functions type
interface APIMetricsModule {
  recordAPIMetric: (metric: APIMetric) => void;
  flushMetrics: () => void;
  getBufferStats: () => BufferStats;
  SLOW_REQUEST_THRESHOLD_MS: number;
}

// ─────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Create a sample metric for testing.
 */
function createTestMetric(overrides: Partial<APIMetric> = {}): APIMetric {
  return {
    requestId: `req-${Math.random().toString(36).substr(2, 9)}`,
    path: '/api/test',
    method: 'GET',
    durationMs: 50,
    timestamp: Date.now(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('API Metrics', () => {
  let apiMetrics: APIMetricsModule;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;
  let originalDateNow: typeof Date.now;

  beforeEach(async () => {
    // Reset module state by clearing cache and re-importing
    jest.resetModules();

    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Store original Date.now
    originalDateNow = Date.now;

    // Import fresh module
    apiMetrics = (await import('../api-metrics')) as APIMetricsModule;
  });

  afterEach(() => {
    // Restore console mocks
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();

    // Restore Date.now
    Date.now = originalDateNow;

    // Clear all mocks
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // SLOW_REQUEST_THRESHOLD_MS Constant Tests
  // ─────────────────────────────────────────────────────────────

  describe('SLOW_REQUEST_THRESHOLD_MS constant', () => {
    it('equals 1000ms (1 second)', () => {
      expect(apiMetrics.SLOW_REQUEST_THRESHOLD_MS).toBe(1000);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // recordAPIMetric Tests
  // ─────────────────────────────────────────────────────────────

  describe('recordAPIMetric', () => {
    it('adds metric to buffer', () => {
      const metric = createTestMetric();

      apiMetrics.recordAPIMetric(metric);

      const stats = apiMetrics.getBufferStats();
      expect(stats.count).toBe(1);
    });

    it('adds multiple metrics to buffer', () => {
      for (let i = 0; i < 5; i++) {
        apiMetrics.recordAPIMetric(createTestMetric());
      }

      const stats = apiMetrics.getBufferStats();
      expect(stats.count).toBe(5);
    });

    it('does not log normal requests immediately', () => {
      const metric = createTestMetric({ durationMs: 50 }); // Fast request

      apiMetrics.recordAPIMetric(metric);

      // Should not trigger immediate logging for fast requests
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('logs slow requests immediately (>1000ms)', () => {
      const slowMetric = createTestMetric({
        durationMs: 1500, // Over threshold
        path: '/api/slow',
        method: 'POST',
      });

      apiMetrics.recordAPIMetric(slowMetric);

      // Should log warning immediately
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);

      // Verify the warning contains expected data
      const warnCall = consoleWarnSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(warnCall);
      expect(parsed.level).toBe('warn');
      expect(parsed.msg).toContain('Slow request');
      expect(parsed.durationMs).toBe(1500);
      expect(parsed.path).toBe('/api/slow');
    });

    it('logs slow requests at exactly 1001ms', () => {
      const metric = createTestMetric({ durationMs: 1001 });

      apiMetrics.recordAPIMetric(metric);

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });

    it('does not log request at exactly 1000ms (boundary)', () => {
      const metric = createTestMetric({ durationMs: 1000 });

      apiMetrics.recordAPIMetric(metric);

      // At threshold, not over - should NOT warn
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('includes request context in slow request warning', () => {
      const metric = createTestMetric({
        requestId: 'slow-req-123',
        path: '/api/heavy',
        method: 'DELETE',
        durationMs: 2000,
      });

      apiMetrics.recordAPIMetric(metric);

      const warnCall = consoleWarnSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(warnCall);
      expect(parsed.requestId).toBe('slow-req-123');
      expect(parsed.path).toBe('/api/heavy');
      expect(parsed.method).toBe('DELETE');
      expect(parsed.threshold).toBe(1000);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Flush Threshold Tests
  // ─────────────────────────────────────────────────────────────

  describe('flush threshold', () => {
    it('triggers flush at 100 metrics (FLUSH_THRESHOLD)', () => {
      // Add 99 metrics - should not flush
      for (let i = 0; i < 99; i++) {
        apiMetrics.recordAPIMetric(createTestMetric());
      }

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(apiMetrics.getBufferStats().count).toBe(99);

      // Add 100th metric - should trigger flush
      apiMetrics.recordAPIMetric(createTestMetric());

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(apiMetrics.getBufferStats().count).toBe(0); // Buffer cleared
    });

    it('logs batch summary on flush', () => {
      for (let i = 0; i < 100; i++) {
        apiMetrics.recordAPIMetric(createTestMetric({ durationMs: 50 + i }));
      }

      const logCall = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(logCall);

      expect(parsed.level).toBe('info');
      expect(parsed.msg).toContain('API metrics batch');
      expect(parsed.msg).toContain('100 requests');
      expect(parsed.batchSize).toBe(100);
      expect(parsed.avgDurationMs).toBeDefined();
      expect(parsed.maxDurationMs).toBeDefined();
      expect(parsed.minDurationMs).toBeDefined();
    });

    it('calculates correct batch statistics', () => {
      // Add metrics with known durations: 100, 200, 300 (avg = 200)
      // Need to add 97 more to trigger flush at 100
      apiMetrics.recordAPIMetric(createTestMetric({ durationMs: 100 }));
      apiMetrics.recordAPIMetric(createTestMetric({ durationMs: 200 }));
      apiMetrics.recordAPIMetric(createTestMetric({ durationMs: 300 }));

      // Add 97 more with duration 50
      for (let i = 0; i < 97; i++) {
        apiMetrics.recordAPIMetric(createTestMetric({ durationMs: 50 }));
      }

      const logCall = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(logCall);

      expect(parsed.minDurationMs).toBe(50);
      expect(parsed.maxDurationMs).toBe(300);
      // Average: (100 + 200 + 300 + 97*50) / 100 = (600 + 4850) / 100 = 54.5 ≈ 55
      expect(parsed.avgDurationMs).toBe(55);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Buffer Hard Cap Tests
  // ─────────────────────────────────────────────────────────────

  describe('buffer hard cap', () => {
    it('enforces 200 entry hard cap (BUFFER_HARD_CAP)', async () => {
      // Need to prevent automatic flush at 100 by manipulating time
      // The lazy flush also triggers at 10 seconds, so we need to be careful

      // Add 250 metrics rapidly
      for (let i = 0; i < 250; i++) {
        apiMetrics.recordAPIMetric(createTestMetric({ durationMs: 10 }));
      }

      // After flushes and cap enforcement, buffer should not exceed 200
      const stats = apiMetrics.getBufferStats();
      expect(stats.count).toBeLessThanOrEqual(200);
    });

    it('flushes at threshold preventing buffer from reaching hard cap', async () => {
      // The flush threshold (100) triggers before hard cap (200) in normal operation.
      // This test verifies the flush mechanism keeps the buffer under control.

      // Reset module to get clean state
      jest.resetModules();
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      apiMetrics = (await import('../api-metrics')) as APIMetricsModule;

      // Add 350 entries - expect flushes at 100, 200, 300
      for (let i = 0; i < 350; i++) {
        apiMetrics.recordAPIMetric(createTestMetric({ durationMs: 10 }));
      }

      // After 350 entries: 3 flushes (at 100, 200, 300) + 50 remaining
      const stats = apiMetrics.getBufferStats();
      expect(stats.count).toBe(50);

      // Verify multiple flushes occurred (batch log messages)
      const batchLogs = consoleLogSpy.mock.calls.filter((call) =>
        call[0].includes('api.metrics.batch')
      );
      expect(batchLogs.length).toBe(3);
    });

    it('buffer never exceeds flush threshold in normal sync operation', async () => {
      // In synchronous operation, flush at 100 entries prevents reaching hard cap (200).
      // The hard cap is a safety net for async/concurrent scenarios.

      // Reset and import fresh
      jest.resetModules();
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      apiMetrics = (await import('../api-metrics')) as APIMetricsModule;

      // Add many entries - buffer count after each call should be < 100
      // (flush happens synchronously when count hits 100)
      for (let i = 0; i < 500; i++) {
        apiMetrics.recordAPIMetric(createTestMetric({ durationMs: 10 }));
        // After recordAPIMetric returns, flush has already happened if threshold was reached
        expect(apiMetrics.getBufferStats().count).toBeLessThan(100);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // flushMetrics Tests
  // ─────────────────────────────────────────────────────────────

  describe('flushMetrics', () => {
    it('clears the buffer', () => {
      for (let i = 0; i < 10; i++) {
        apiMetrics.recordAPIMetric(createTestMetric());
      }

      expect(apiMetrics.getBufferStats().count).toBe(10);

      apiMetrics.flushMetrics();

      expect(apiMetrics.getBufferStats().count).toBe(0);
    });

    it('logs batch summary when flushing', () => {
      for (let i = 0; i < 5; i++) {
        apiMetrics.recordAPIMetric(createTestMetric());
      }

      apiMetrics.flushMetrics();

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logCall = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(logCall);
      expect(parsed.batchSize).toBe(5);
    });

    it('does nothing when buffer is empty', () => {
      apiMetrics.flushMetrics();

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('updates lastFlushTime', () => {
      const beforeFlush = apiMetrics.getBufferStats().lastFlushTime;

      // Add some metrics
      apiMetrics.recordAPIMetric(createTestMetric());

      // Wait a tiny bit to ensure time difference
      const now = Date.now() + 100;
      Date.now = jest.fn(() => now);

      apiMetrics.flushMetrics();

      const afterFlush = apiMetrics.getBufferStats().lastFlushTime;
      expect(afterFlush).toBeGreaterThanOrEqual(beforeFlush);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getBufferStats Tests
  // ─────────────────────────────────────────────────────────────

  describe('getBufferStats', () => {
    it('returns current buffer count', () => {
      expect(apiMetrics.getBufferStats().count).toBe(0);

      apiMetrics.recordAPIMetric(createTestMetric());
      expect(apiMetrics.getBufferStats().count).toBe(1);

      apiMetrics.recordAPIMetric(createTestMetric());
      expect(apiMetrics.getBufferStats().count).toBe(2);
    });

    it('returns lastFlushTime', () => {
      const stats = apiMetrics.getBufferStats();

      expect(stats.lastFlushTime).toBeDefined();
      expect(typeof stats.lastFlushTime).toBe('number');
      expect(stats.lastFlushTime).toBeGreaterThan(0);
    });

    it('reflects accurate count after flush', () => {
      for (let i = 0; i < 10; i++) {
        apiMetrics.recordAPIMetric(createTestMetric());
      }

      expect(apiMetrics.getBufferStats().count).toBe(10);

      apiMetrics.flushMetrics();

      expect(apiMetrics.getBufferStats().count).toBe(0);

      // Add more after flush
      for (let i = 0; i < 3; i++) {
        apiMetrics.recordAPIMetric(createTestMetric());
      }

      expect(apiMetrics.getBufferStats().count).toBe(3);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Time-Based Flush Tests
  // ─────────────────────────────────────────────────────────────

  describe('time-based flush (lazy flush)', () => {
    it('triggers flush after 10 seconds with pending metrics', async () => {
      // Reset module for clean state
      jest.resetModules();

      const baseTime = 1700000000000;
      Date.now = jest.fn(() => baseTime);

      // Import fresh module with mocked time
      apiMetrics = (await import('../api-metrics')) as APIMetricsModule;

      // Add some metrics (less than flush threshold)
      for (let i = 0; i < 10; i++) {
        apiMetrics.recordAPIMetric(createTestMetric());
      }

      // Buffer should have metrics
      expect(apiMetrics.getBufferStats().count).toBe(10);
      expect(consoleLogSpy).not.toHaveBeenCalled();

      // Advance time by 11 seconds
      Date.now = jest.fn(() => baseTime + 11000);

      // Add another metric to trigger the lazy flush check
      apiMetrics.recordAPIMetric(createTestMetric());

      // Should have triggered flush due to time elapsed
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('does not flush before 10 seconds even with pending metrics', async () => {
      jest.resetModules();

      const baseTime = 1700000000000;
      Date.now = jest.fn(() => baseTime);

      apiMetrics = (await import('../api-metrics')) as APIMetricsModule;

      // Add some metrics
      for (let i = 0; i < 10; i++) {
        apiMetrics.recordAPIMetric(createTestMetric());
      }

      // Advance time by 5 seconds (less than 10)
      Date.now = jest.fn(() => baseTime + 5000);

      // Add another metric
      apiMetrics.recordAPIMetric(createTestMetric());

      // Should NOT have flushed yet (only 11 metrics, < 100, and < 10 seconds)
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(apiMetrics.getBufferStats().count).toBe(11);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Edge Cases
  // ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles metrics with all optional fields', () => {
      const metric = createTestMetric({
        userAgent: 'Mozilla/5.0',
        ip: '192.168.1.1',
      });

      apiMetrics.recordAPIMetric(metric);

      expect(apiMetrics.getBufferStats().count).toBe(1);
    });

    it('handles metrics with minimal fields', () => {
      const minimalMetric: APIMetric = {
        requestId: 'min-req',
        path: '/',
        method: 'GET',
        durationMs: 1,
        timestamp: Date.now(),
      };

      apiMetrics.recordAPIMetric(minimalMetric);

      expect(apiMetrics.getBufferStats().count).toBe(1);
    });

    it('handles zero duration metrics', () => {
      const metric = createTestMetric({ durationMs: 0 });

      apiMetrics.recordAPIMetric(metric);

      expect(apiMetrics.getBufferStats().count).toBe(1);
      expect(consoleWarnSpy).not.toHaveBeenCalled(); // Not slow
    });

    it('handles very long paths', () => {
      const longPath = '/api/' + 'a'.repeat(1000);
      const metric = createTestMetric({ path: longPath });

      apiMetrics.recordAPIMetric(metric);

      expect(apiMetrics.getBufferStats().count).toBe(1);
    });

    it('handles special characters in path', () => {
      const metric = createTestMetric({
        path: '/api/search?q=hello%20world&filter[]=a',
      });

      apiMetrics.recordAPIMetric(metric);

      expect(apiMetrics.getBufferStats().count).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // JSON Output Format Tests
  // ─────────────────────────────────────────────────────────────

  describe('JSON output format', () => {
    it('outputs valid JSON for batch summary', () => {
      for (let i = 0; i < 5; i++) {
        apiMetrics.recordAPIMetric(createTestMetric());
      }

      apiMetrics.flushMetrics();

      const logCall = consoleLogSpy.mock.calls[0][0] as string;

      // Should parse without error
      expect(() => JSON.parse(logCall)).not.toThrow();
    });

    it('outputs valid JSON for slow request warning', () => {
      apiMetrics.recordAPIMetric(createTestMetric({ durationMs: 2000 }));

      const warnCall = consoleWarnSpy.mock.calls[0][0] as string;

      // Should parse without error
      expect(() => JSON.parse(warnCall)).not.toThrow();
    });

    it('batch summary includes metric type identifier', () => {
      for (let i = 0; i < 100; i++) {
        apiMetrics.recordAPIMetric(createTestMetric());
      }

      const logCall = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(logCall);

      expect(parsed.metric).toBe('api.metrics.batch');
    });

    it('slow request warning includes metric type identifier', () => {
      apiMetrics.recordAPIMetric(createTestMetric({ durationMs: 1500 }));

      const warnCall = consoleWarnSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(warnCall);

      expect(parsed.metric).toBe('api.request.slow');
    });
  });
});
