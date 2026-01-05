/**
 * MCP Server Pino Logger
 *
 * Structured logging for the MCP server process.
 * Migrated from console-based logging to Pino for consistency
 * with the main web application (Ticket #137).
 *
 * @module mcp-server/logger
 */

import pino from 'pino';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Base Pino logger for MCP server.
 *
 * Configuration matches the web app logger for unified log aggregation:
 * - Level: LOG_LEVEL env var, or 'debug' (dev) / 'info' (prod)
 * - Format: JSON in production, pretty-printed in development
 * - Redaction: Sensitive fields are automatically censored
 */
const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),

  formatters: {
    level: (label) => ({ level: label }),
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'token',
      'secret',
      'apiKey',
      'api_key',
      'accessToken',
      'refreshToken',
      'authorization',
    ],
    censor: '[REDACTED]',
  },

  // Base context for all MCP server logs
  base: {
    service: 'mcp-server',
  },
});

/**
 * Logger interface for backwards compatibility.
 *
 * Note: Pino uses (context, message) order, but our existing code
 * uses (message, context). This interface maintains the existing API.
 */
export interface Logger {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
}

/**
 * Create a logger instance.
 *
 * For backwards compatibility, accepts a level parameter but this
 * is now controlled via LOG_LEVEL environment variable.
 *
 * @param _level - Deprecated, use LOG_LEVEL env var instead
 * @returns Logger instance with debug, info, warn, error methods
 *
 * @example
 * ```typescript
 * const logger = createLogger();
 * logger.info('Tool executed', { tool: 'ticket_create', duration: 42 });
 * ```
 */
export const createLogger = (_level: LogLevel = 'info'): Logger => {
  return {
    debug: (message, context) => {
      if (context) {
        pinoLogger.debug(context, message);
      } else {
        pinoLogger.debug(message);
      }
    },
    info: (message, context) => {
      if (context) {
        pinoLogger.info(context, message);
      } else {
        pinoLogger.info(message);
      }
    },
    warn: (message, context) => {
      if (context) {
        pinoLogger.warn(context, message);
      } else {
        pinoLogger.warn(message);
      }
    },
    error: (message, context) => {
      if (context) {
        pinoLogger.error(context, message);
      } else {
        pinoLogger.error(message);
      }
    },
  };
};

/**
 * Direct access to Pino logger for advanced use cases.
 *
 * Use createLogger() for standard logging. This export is for
 * cases where you need child loggers or direct Pino features.
 */
export const logger = pinoLogger;
