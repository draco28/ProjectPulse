/**
 * Logger Unit Tests
 *
 * Tests for Pino logger infrastructure (Ticket #134).
 * Part of Phase 2: Observability Infrastructure DoD verification (Ticket #138).
 *
 * Note: Pino's singleton logger writes to stdout which can't be easily redirected.
 * For output testing, we create fresh Pino instances with custom destinations.
 *
 * @module lib/logger/__tests__/logger.test.ts
 */

import { describe, it, expect } from '@jest/globals';
import pino from 'pino';
import { Writable } from 'stream';

// We'll test the actual exports
import { logger, createLogger, createRequestLogger } from '../index';

// ─────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Create a writable stream that captures log output as parsed JSON objects.
 */
function createLogCapture(): { stream: Writable; logs: Array<Record<string, unknown>> } {
  const logs: Array<Record<string, unknown>> = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      try {
        const line = chunk.toString().trim();
        if (line) {
          logs.push(JSON.parse(line));
        }
      } catch {
        // Ignore non-JSON lines
      }
      callback();
    },
  });
  return { stream, logs };
}

/**
 * Create a test logger that writes to a capture stream.
 * This mirrors the production logger config but with a custom destination.
 */
function createTestLogger(stream: Writable) {
  return pino(
    {
      level: 'trace', // Capture all levels in tests
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'password',
          'token',
          'secret',
          'apiKey',
          'api_key',
          'accessToken',
          'refreshToken',
        ],
        censor: '[REDACTED]',
      },
    },
    stream
  );
}

// ─────────────────────────────────────────────────────────────
// Logger Singleton Tests
// ─────────────────────────────────────────────────────────────

describe('Logger', () => {
  describe('logger singleton', () => {
    it('exports a logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger).toBe('object');
    });

    it('has all standard log level methods', () => {
      expect(typeof logger.fatal).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.trace).toBe('function');
    });

    it('has child method for creating child loggers', () => {
      expect(typeof logger.child).toBe('function');
    });

    it('has level property', () => {
      expect(typeof logger.level).toBe('string');
      // Default level should be 'debug' in test environment (non-production)
      expect(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).toContain(logger.level);
    });

    it('outputs JSON format', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);

      testLogger.info({ test: true }, 'Test message');
      stream.end();

      expect(logs.length).toBeGreaterThanOrEqual(1);
      const logEntry = logs[0];
      expect(logEntry).toHaveProperty('level');
      expect(logEntry).toHaveProperty('time');
      expect(logEntry).toHaveProperty('msg', 'Test message');
      expect(logEntry).toHaveProperty('test', true);
    });

    it('includes ISO timestamp in logs', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);

      testLogger.info('Timestamp test');
      stream.end();

      expect(logs.length).toBeGreaterThanOrEqual(1);
      const logEntry = logs[0];
      // ISO timestamp format check
      expect(logEntry).toHaveProperty('time');
      expect(typeof logEntry.time).toBe('string');
      // ISO 8601 format: 2024-01-01T00:00:00.000Z
      expect(logEntry.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // createLogger Tests
  // ─────────────────────────────────────────────────────────────

  describe('createLogger', () => {
    it('returns a child logger', () => {
      const moduleLogger = createLogger({ module: 'TestModule' });

      expect(moduleLogger).toBeDefined();
      expect(typeof moduleLogger.info).toBe('function');
      expect(typeof moduleLogger.error).toBe('function');
      expect(typeof moduleLogger.child).toBe('function');
    });

    it('returns child logger with provided context (via test logger)', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);
      const moduleLogger = testLogger.child({ module: 'TestModule' });

      moduleLogger.info('Module log message');
      stream.end();

      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0]).toHaveProperty('module', 'TestModule');
      expect(logs[0]).toHaveProperty('msg', 'Module log message');
    });

    it('creates independent child loggers for different contexts', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);

      const logger1 = testLogger.child({ module: 'Module1' });
      const logger2 = testLogger.child({ module: 'Module2' });

      logger1.info('From module 1');
      logger2.info('From module 2');
      stream.end();

      expect(logs.length).toBe(2);
      expect(logs[0]).toHaveProperty('module', 'Module1');
      expect(logs[1]).toHaveProperty('module', 'Module2');
    });

    it('supports multiple context fields', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);
      const contextLogger = testLogger.child({
        module: 'MultiContext',
        component: 'TestComponent',
        version: '1.0.0',
      });

      contextLogger.info('Multi-context message');
      stream.end();

      expect(logs[0]).toHaveProperty('module', 'MultiContext');
      expect(logs[0]).toHaveProperty('component', 'TestComponent');
      expect(logs[0]).toHaveProperty('version', '1.0.0');
    });

    it('allows additional fields in log calls', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);
      const moduleLogger = testLogger.child({ module: 'AdditionalFields' });

      moduleLogger.info({ extra: 'field', count: 42 }, 'Message with extras');
      stream.end();

      expect(logs[0]).toHaveProperty('module', 'AdditionalFields');
      expect(logs[0]).toHaveProperty('extra', 'field');
      expect(logs[0]).toHaveProperty('count', 42);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // createRequestLogger Tests
  // ─────────────────────────────────────────────────────────────

  describe('createRequestLogger', () => {
    it('returns a child logger', () => {
      const reqLogger = createRequestLogger('test-request-123');

      expect(reqLogger).toBeDefined();
      expect(typeof reqLogger.info).toBe('function');
      expect(typeof reqLogger.error).toBe('function');
    });

    it('includes requestId in child logger (via test logger)', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);
      const reqLogger = testLogger.child({ requestId: 'test-request-123' });

      reqLogger.info('Request log');
      stream.end();

      expect(logs[0]).toHaveProperty('requestId', 'test-request-123');
    });

    it('includes userId when provided (via test logger)', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);
      const reqLogger = testLogger.child({ requestId: 'req-456', userId: 'user-789' });

      reqLogger.info('Authenticated request');
      stream.end();

      expect(logs[0]).toHaveProperty('requestId', 'req-456');
      expect(logs[0]).toHaveProperty('userId', 'user-789');
    });

    it('omits userId when not provided (via test logger)', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);
      const reqLogger = testLogger.child({ requestId: 'req-no-user' });

      reqLogger.info('Anonymous request');
      stream.end();

      expect(logs[0]).toHaveProperty('requestId', 'req-no-user');
      expect(logs[0]).not.toHaveProperty('userId');
    });

    it('works with UUID format request IDs (via test logger)', () => {
      const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);
      const reqLogger = testLogger.child({ requestId: uuid });

      reqLogger.info('UUID request');
      stream.end();

      expect(logs[0]).toHaveProperty('requestId', uuid);
    });

    it('supports all log levels (via test logger)', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);
      const reqLogger = testLogger.child({ requestId: 'multi-level-test' });

      reqLogger.trace('Trace message');
      reqLogger.debug('Debug message');
      reqLogger.info('Info message');
      reqLogger.warn('Warn message');
      reqLogger.error('Error message');
      stream.end();

      // All should have requestId
      logs.forEach((log) => {
        expect(log).toHaveProperty('requestId', 'multi-level-test');
      });

      // Check levels are correct
      const levels = logs.map((l) => l.level);
      expect(levels).toContain('trace');
      expect(levels).toContain('debug');
      expect(levels).toContain('info');
      expect(levels).toContain('warn');
      expect(levels).toContain('error');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Redaction Tests
  // ─────────────────────────────────────────────────────────────

  describe('redaction', () => {
    it('redacts password field', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);

      testLogger.info({ password: 'secret123' }, 'Login attempt');
      stream.end();

      expect(logs[0]).toHaveProperty('password', '[REDACTED]');
    });

    it('redacts token field', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);

      testLogger.info({ token: 'jwt-token-here' }, 'Token used');
      stream.end();

      expect(logs[0]).toHaveProperty('token', '[REDACTED]');
    });

    it('redacts secret field', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);

      testLogger.info({ secret: 'my-secret-value' }, 'Secret field');
      stream.end();

      expect(logs[0]).toHaveProperty('secret', '[REDACTED]');
    });

    it('redacts apiKey field', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);

      testLogger.info({ apiKey: 'sk-123456' }, 'API key used');
      stream.end();

      expect(logs[0]).toHaveProperty('apiKey', '[REDACTED]');
    });

    it('redacts api_key field (snake_case)', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);

      testLogger.info({ api_key: 'key-value' }, 'Snake case key');
      stream.end();

      expect(logs[0]).toHaveProperty('api_key', '[REDACTED]');
    });

    it('redacts accessToken field', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);

      testLogger.info({ accessToken: 'access-token-value' }, 'Access token');
      stream.end();

      expect(logs[0]).toHaveProperty('accessToken', '[REDACTED]');
    });

    it('redacts refreshToken field', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);

      testLogger.info({ refreshToken: 'refresh-token-value' }, 'Refresh token');
      stream.end();

      expect(logs[0]).toHaveProperty('refreshToken', '[REDACTED]');
    });

    it('redacts nested req.headers.authorization', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);

      testLogger.info(
        {
          req: {
            headers: {
              authorization: 'Bearer secret-token',
              'content-type': 'application/json',
            },
          },
        },
        'Request with auth'
      );
      stream.end();

      expect(logs[0].req).toEqual({
        headers: {
          authorization: '[REDACTED]',
          'content-type': 'application/json',
        },
      });
    });

    it('redacts nested req.headers.cookie', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);

      testLogger.info(
        {
          req: {
            headers: {
              cookie: 'session=abc123; other=value',
            },
          },
        },
        'Request with cookie'
      );
      stream.end();

      const reqObj = logs[0].req as Record<string, unknown>;
      expect(reqObj).toHaveProperty('headers');
      const headers = reqObj.headers as Record<string, unknown>;
      expect(headers).toHaveProperty('cookie', '[REDACTED]');
    });

    it('does not redact non-sensitive fields', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);

      testLogger.info(
        {
          username: 'john',
          email: 'john@example.com',
          action: 'login',
        },
        'Normal fields'
      );
      stream.end();

      expect(logs[0]).toHaveProperty('username', 'john');
      expect(logs[0]).toHaveProperty('email', 'john@example.com');
      expect(logs[0]).toHaveProperty('action', 'login');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Error Logging Tests
  // ─────────────────────────────────────────────────────────────

  describe('error logging', () => {
    it('logs Error objects with stack trace', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);

      const testError = new Error('Test error message');
      testLogger.error({ err: testError }, 'An error occurred');
      stream.end();

      expect(logs[0]).toHaveProperty('msg', 'An error occurred');
      expect(logs[0]).toHaveProperty('err');
      const errObj = logs[0].err as Record<string, unknown>;
      expect(errObj).toHaveProperty('message', 'Test error message');
      expect(errObj).toHaveProperty('stack');
    });

    it('logs error with additional context', () => {
      const { stream, logs } = createLogCapture();
      const testLogger = createTestLogger(stream);

      testLogger.error(
        {
          err: new Error('DB connection failed'),
          database: 'postgres',
          retryCount: 3,
        },
        'Database error'
      );
      stream.end();

      expect(logs[0]).toHaveProperty('database', 'postgres');
      expect(logs[0]).toHaveProperty('retryCount', 3);
      const errObj = logs[0].err as Record<string, unknown>;
      expect(errObj).toHaveProperty('message', 'DB connection failed');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Production Logger Export Tests
  // ─────────────────────────────────────────────────────────────

  describe('production logger exports', () => {
    it('createLogger returns a functional child logger', () => {
      const moduleLogger = createLogger({ module: 'ExportTest' });

      // Should not throw when logging
      expect(() => moduleLogger.info('Test log')).not.toThrow();
      expect(() => moduleLogger.error({ err: new Error('test') }, 'Error')).not.toThrow();
    });

    it('createRequestLogger returns a functional child logger', () => {
      const reqLogger = createRequestLogger('req-export-test');

      // Should not throw when logging
      expect(() => reqLogger.info('Request log')).not.toThrow();
      expect(() => reqLogger.warn({ slow: true }, 'Slow request')).not.toThrow();
    });

    it('createRequestLogger with userId returns a functional child logger', () => {
      const reqLogger = createRequestLogger('req-user-test', 'user-123');

      // Should not throw when logging
      expect(() => reqLogger.info('Authenticated log')).not.toThrow();
    });

    it('logger can create nested child loggers', () => {
      const child1 = logger.child({ level1: true });
      const child2 = child1.child({ level2: true });

      expect(() => child2.info('Nested log')).not.toThrow();
    });
  });
});
