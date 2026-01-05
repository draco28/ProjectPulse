/**
 * Pino Logger Infrastructure
 *
 * Structured logging singleton for ProjectPulse.
 * Part of Phase 2: Observability Infrastructure (Ticket #134)
 *
 * Features:
 * - ISO timestamp formatting
 * - Sensitive data redaction
 * - Pretty printing in development
 * - JSON output in production
 * - Child logger factories for context injection
 *
 * @module lib/logger
 */

import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Main Pino logger singleton.
 *
 * Configuration:
 * - Level: LOG_LEVEL env var, or 'debug' (dev) / 'info' (prod)
 * - Format: JSON in production, pretty-printed in development
 * - Redaction: Sensitive fields are automatically censored
 *
 * @example
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * logger.info({ userId: 123 }, 'User logged in');
 * logger.error({ error, ticketId: 456 }, 'Failed to update ticket');
 * ```
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),

  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      host: bindings.hostname,
      node_version: process.version,
    }),
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  // Redact sensitive fields to prevent accidental logging of secrets
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

  // Pretty print in development for readability
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

/**
 * Create a child logger with additional context.
 *
 * Use this to create loggers scoped to a specific component or module.
 * The context is automatically included in all log entries.
 *
 * @param context - Key-value pairs to include in all log entries
 * @returns A child logger with the provided context
 *
 * @example
 * ```typescript
 * const mcpLogger = createLogger({ component: 'mcp-server' });
 * mcpLogger.info({ tool: 'ticket_create' }, 'Tool executed');
 * // Output: { component: 'mcp-server', tool: 'ticket_create', msg: 'Tool executed', ... }
 * ```
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

/**
 * Create a request-scoped logger.
 *
 * Use this for API route handlers to include request correlation ID
 * and optional user ID in all log entries for the request lifecycle.
 *
 * @param requestId - Unique request identifier (X-Request-ID)
 * @param userId - Optional user identifier for authenticated requests
 * @returns A child logger with request context
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
 *   const log = createRequestLogger(requestId, session?.user?.id);
 *
 *   log.info({ path: '/api/tickets' }, 'Request started');
 *   // ... handle request
 *   log.info({ count: tickets.length, durationMs: 42 }, 'Request completed');
 * }
 * ```
 */
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({
    requestId,
    ...(userId && { userId }),
  });
}

/**
 * Log levels reference:
 *
 * | Level  | When to Use                      | Example                          |
 * |--------|----------------------------------|----------------------------------|
 * | fatal  | App cannot continue              | Database connection lost         |
 * | error  | Operation failed                 | API error response               |
 * | warn   | Potential issue                  | Deprecated API usage             |
 * | info   | Business events                  | Ticket created, user logged in   |
 * | debug  | Development detail               | SQL queries, cache hits          |
 * | trace  | Fine-grained detail              | Request/response bodies          |
 */

// Re-export pino types for convenience
export type { Logger } from 'pino';
