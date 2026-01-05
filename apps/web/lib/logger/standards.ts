/**
 * Log Message Standards
 *
 * Standardized event names for structured logging.
 * Part of Phase 2: Observability Infrastructure (Ticket #134)
 *
 * Using consistent event names enables:
 * - Log aggregation and filtering
 * - Dashboard creation and alerting
 * - Easier debugging and correlation
 *
 * Naming convention: {domain}.{entity}.{action}
 * Examples: api.request.start, auth.login.success, ticket.created
 *
 * @module lib/logger/standards
 */

/**
 * Standardized log message constants.
 *
 * Use these constants instead of free-form strings to ensure
 * consistent event naming across the codebase.
 *
 * @example
 * ```typescript
 * import { logger } from '@/lib/logger';
 * import { LogMessages } from '@/lib/logger/standards';
 *
 * logger.info({ ticketId: 123 }, LogMessages.TICKET_CREATED);
 * logger.error({ error, userId }, LogMessages.AUTH_LOGIN_FAILURE);
 * ```
 */
export const LogMessages = {
  // ─────────────────────────────────────────────────────────────
  // API Events
  // ─────────────────────────────────────────────────────────────

  /** API request started (log at debug level) */
  API_REQUEST_START: 'api.request.start',

  /** API request completed successfully */
  API_REQUEST_END: 'api.request.end',

  /** API request failed with error */
  API_ERROR: 'api.error',

  /** API validation failed (4xx response) */
  API_VALIDATION_ERROR: 'api.validation.error',

  // ─────────────────────────────────────────────────────────────
  // Authentication Events
  // ─────────────────────────────────────────────────────────────

  /** User logged in successfully */
  AUTH_LOGIN_SUCCESS: 'auth.login.success',

  /** Login attempt failed */
  AUTH_LOGIN_FAILURE: 'auth.login.failure',

  /** User logged out */
  AUTH_LOGOUT: 'auth.logout',

  /** API token validated successfully */
  AUTH_TOKEN_VALIDATED: 'auth.token.validated',

  /** API token validation failed */
  AUTH_TOKEN_INVALID: 'auth.token.invalid',

  /** Session created or refreshed */
  AUTH_SESSION_CREATED: 'auth.session.created',

  // ─────────────────────────────────────────────────────────────
  // Ticket Events (Business)
  // ─────────────────────────────────────────────────────────────

  /** Ticket created */
  TICKET_CREATED: 'ticket.created',

  /** Ticket updated */
  TICKET_UPDATED: 'ticket.updated',

  /** Ticket status changed */
  TICKET_STATUS_CHANGED: 'ticket.status.changed',

  /** Ticket deleted */
  TICKET_DELETED: 'ticket.deleted',

  /** Comment added to ticket */
  TICKET_COMMENT_ADDED: 'ticket.comment.added',

  // ─────────────────────────────────────────────────────────────
  // Agent Session Events (Business)
  // ─────────────────────────────────────────────────────────────

  /** Agent work session started */
  SESSION_STARTED: 'session.started',

  /** Agent session updated (checkpoint) */
  SESSION_UPDATED: 'session.updated',

  /** Agent session paused */
  SESSION_PAUSED: 'session.paused',

  /** Agent session resumed */
  SESSION_RESUMED: 'session.resumed',

  /** Agent session ended */
  SESSION_ENDED: 'session.ended',

  // ─────────────────────────────────────────────────────────────
  // Wiki Events (Business)
  // ─────────────────────────────────────────────────────────────

  /** Wiki page created */
  WIKI_PAGE_CREATED: 'wiki.page.created',

  /** Wiki page updated */
  WIKI_PAGE_UPDATED: 'wiki.page.updated',

  /** Wiki search performed */
  WIKI_SEARCH: 'wiki.search',

  // ─────────────────────────────────────────────────────────────
  // Knowledge Base Events (Business)
  // ─────────────────────────────────────────────────────────────

  /** Knowledge item created */
  KNOWLEDGE_CREATED: 'knowledge.created',

  /** Knowledge search performed */
  KNOWLEDGE_SEARCH: 'knowledge.search',

  /** Embedding generated */
  KNOWLEDGE_EMBEDDING_GENERATED: 'knowledge.embedding.generated',

  // ─────────────────────────────────────────────────────────────
  // Database Events (System)
  // ─────────────────────────────────────────────────────────────

  /** Database query took longer than threshold */
  DB_QUERY_SLOW: 'db.query.slow',

  /** Database connection established */
  DB_CONNECTED: 'db.connected',

  /** Database connection lost */
  DB_DISCONNECTED: 'db.disconnected',

  /** Database query error */
  DB_ERROR: 'db.error',

  // ─────────────────────────────────────────────────────────────
  // Cache Events (System)
  // ─────────────────────────────────────────────────────────────

  /** Cache hit */
  CACHE_HIT: 'cache.hit',

  /** Cache miss */
  CACHE_MISS: 'cache.miss',

  /** Cache entry set */
  CACHE_SET: 'cache.set',

  /** Cache entry evicted */
  CACHE_EVICTED: 'cache.evicted',

  // ─────────────────────────────────────────────────────────────
  // Rate Limiting Events (System)
  // ─────────────────────────────────────────────────────────────

  /** Rate limit exceeded (429 response) */
  RATE_LIMIT_EXCEEDED: 'ratelimit.exceeded',

  /** Rate limit warning (approaching limit) */
  RATE_LIMIT_WARNING: 'ratelimit.warning',

  // ─────────────────────────────────────────────────────────────
  // MCP Events (System)
  // ─────────────────────────────────────────────────────────────

  /** MCP tool executed */
  MCP_TOOL_EXECUTED: 'mcp.tool.executed',

  /** MCP tool error */
  MCP_TOOL_ERROR: 'mcp.tool.error',

  /** MCP session created */
  MCP_SESSION_CREATED: 'mcp.session.created',

  /** MCP session closed */
  MCP_SESSION_CLOSED: 'mcp.session.closed',

  // ─────────────────────────────────────────────────────────────
  // Health & Startup Events (System)
  // ─────────────────────────────────────────────────────────────

  /** Application started */
  APP_STARTED: 'app.started',

  /** Application shutting down */
  APP_SHUTDOWN: 'app.shutdown',

  /** Health check performed */
  HEALTH_CHECK: 'health.check',

  /** Health check failed */
  HEALTH_CHECK_FAILED: 'health.check.failed',
} as const;

/**
 * Type for log message values.
 *
 * @example
 * ```typescript
 * function logEvent(msg: LogMessage, data: Record<string, unknown>) {
 *   logger.info(data, msg);
 * }
 * ```
 */
export type LogMessage = (typeof LogMessages)[keyof typeof LogMessages];

/**
 * Type for log message keys.
 *
 * @example
 * ```typescript
 * const event: LogMessageKey = 'TICKET_CREATED';
 * logger.info({}, LogMessages[event]);
 * ```
 */
export type LogMessageKey = keyof typeof LogMessages;
