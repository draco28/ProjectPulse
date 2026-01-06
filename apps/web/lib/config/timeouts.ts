/**
 * Centralized Timeout Configuration
 *
 * Standardized timeout values for all operations in ProjectPulse.
 * Part of Phase 3: Resilience Patterns (Ticket #140)
 *
 * These values are used by withTimeout() to enforce consistent
 * timeout behavior across the application.
 *
 * @module lib/config/timeouts
 */

/**
 * Centralized timeout configuration for all operations.
 * Values in milliseconds.
 *
 * @example
 * ```typescript
 * import { TIMEOUTS } from '@/lib/config/timeouts';
 * import { withTimeout } from '@/lib/utils/timeout';
 *
 * const result = await withTimeout(
 *   prisma.ticket.findMany({ where }),
 *   TIMEOUTS.external.database,
 *   'ticket.findMany'
 * );
 * ```
 */
export const TIMEOUTS = {
  // ─────────────────────────────────────────────────────────────
  // API Route Timeouts
  // ─────────────────────────────────────────────────────────────

  api: {
    /** Default timeout for most API routes (30s) */
    default: 30_000,

    /** Extended timeout for bulk operations (60s) */
    bulk: 60_000,

    /** Timeout for search operations (15s) */
    search: 15_000,

    /** Short timeout for health checks (5s) */
    health: 5_000,
  },

  // ─────────────────────────────────────────────────────────────
  // External Service Timeouts
  // ─────────────────────────────────────────────────────────────

  external: {
    /** Redis operations timeout (3s) */
    redis: 3_000,

    /** Embedding generation timeout (10s) */
    embedding: 10_000,

    /** Database query timeout (20s) */
    database: 20_000,
  },

  // ─────────────────────────────────────────────────────────────
  // MCP Server Timeouts
  // ─────────────────────────────────────────────────────────────

  mcp: {
    /** Single MCP tool call timeout (30s) */
    toolCall: 30_000,

    /** Session operations timeout (60s) */
    session: 60_000,
  },
} as const;

/**
 * Type representing the top-level timeout categories.
 *
 * @example
 * ```typescript
 * function getTimeout(tier: TimeoutTier, key: string): number {
 *   return TIMEOUTS[tier][key as keyof typeof TIMEOUTS[typeof tier]];
 * }
 * ```
 */
export type TimeoutTier = keyof typeof TIMEOUTS;

/**
 * Type representing all possible timeout values.
 * Useful for type-safe timeout selection.
 */
export type TimeoutValue = (typeof TIMEOUTS)[TimeoutTier][keyof (typeof TIMEOUTS)[TimeoutTier]];
