/**
 * Rate Limit Tiers Configuration
 * Sprint 17: Global Rate Limiting (Ticket #130)
 *
 * Tiers based on PRODUCTION-HARDENING-SPEC.md section 1.1
 */

import type { RateLimitTier, TierConfig } from './types';

/**
 * Rate limit configuration per tier
 *
 * | Tier   | Routes              | Limit    | Window  |
 * |--------|---------------------|----------|---------|
 * | auth   | /api/auth/*         | 5 req    | 15 min  |
 * | write  | POST/PUT/DELETE     | 100 req  | 1 min   |
 * | read   | GET                 | 300 req  | 1 min   |
 * | mcp    | /api/mcp/*          | 60 req   | 1 min   |
 * | bulk   | /api/batch/*        | 10 req   | 1 min   |
 * | health | /api/health         | Unlimited| -       |
 */
export const RATE_LIMIT_TIERS: Record<RateLimitTier, TierConfig> = {
  auth: {
    limit: 5,
    windowSeconds: 900, // 15 minutes
    keyPrefix: 'rl:auth',
  },
  write: {
    limit: 100,
    windowSeconds: 60, // 1 minute
    keyPrefix: 'rl:write',
  },
  read: {
    limit: 300,
    windowSeconds: 60, // 1 minute
    keyPrefix: 'rl:read',
  },
  mcp: {
    limit: 60,
    windowSeconds: 60, // 1 minute
    keyPrefix: 'rl:mcp',
  },
  bulk: {
    limit: 10,
    windowSeconds: 60, // 1 minute
    keyPrefix: 'rl:bulk',
  },
  health: {
    limit: Infinity, // Unlimited
    windowSeconds: 0,
    keyPrefix: 'rl:health',
  },
};

/**
 * HTTP methods considered as "write" operations
 */
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Determine the rate limit tier for a given route
 *
 * @param pathname - Request pathname (e.g., /api/tickets)
 * @param method - HTTP method (GET, POST, etc.)
 * @returns The tier to use, or null if rate limiting should be skipped
 */
export function getTierForRoute(pathname: string, method: string): RateLimitTier | null {
  // Health endpoint is exempt from rate limiting
  if (pathname === '/api/health') {
    return null;
  }

  // Auth routes get strict limits (5 req/15min)
  if (pathname.startsWith('/api/auth/')) {
    return 'auth';
  }

  // Agent auth also uses auth tier
  if (pathname.startsWith('/api/agent-auth/')) {
    return 'auth';
  }

  // MCP routes get dedicated tier
  if (pathname.startsWith('/api/mcp')) {
    return 'mcp';
  }

  // Batch/bulk operations get strict limits
  if (pathname.startsWith('/api/batch/') || pathname.includes('/bulk')) {
    return 'bulk';
  }

  // Remaining routes: write vs read based on HTTP method
  if (WRITE_METHODS.includes(method.toUpperCase())) {
    return 'write';
  }

  // Default: read tier for GET and other safe methods
  return 'read';
}

/**
 * Get the tier config for a given tier
 */
export function getTierConfig(tier: RateLimitTier): TierConfig {
  return RATE_LIMIT_TIERS[tier];
}
