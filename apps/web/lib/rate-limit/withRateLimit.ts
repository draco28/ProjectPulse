/**
 * Rate Limit HOC for Route Handlers
 * Sprint 17: Global Rate Limiting (Ticket #130)
 *
 * Wraps Next.js route handlers with rate limiting.
 *
 * Usage:
 *   // Auto-detect tier from pathname and method
 *   export const POST = withRateLimit(handler);
 *
 *   // Override tier
 *   export const POST = withRateLimit(handler, { tier: 'auth' });
 *
 *   // Skip rate limiting for specific route
 *   export const GET = withRateLimit(handler, { tier: 'health' });
 */

import { NextRequest, NextResponse } from 'next/server';
import type { RateLimitTier, WithRateLimitOptions, RateLimitKeyContext } from './types';
import { getTierForRoute } from './tiers';
import { getClientIp } from './key-generator';
import {
  checkRateLimit,
  rateLimitResponse,
  addRateLimitHeaders,
  isRateLimitEnabled,
} from './index';

/**
 * Type for Next.js route handler
 */
type RouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string | string[]> }
) => Promise<NextResponse> | NextResponse;

/**
 * Extract auth context from request for key generation
 * This is a simplified version - in practice, you might want to
 * pass auth context from the handler itself
 */
function extractKeyContext(request: NextRequest): RateLimitKeyContext {
  const ip = getClientIp(request);

  // Try to extract user/token context from headers
  const sessionId = request.headers.get('mcp-session-id') || undefined;

  // Note: For full auth context, the handler should pass userId/tokenId
  // This HOC only has access to request headers
  return {
    ip,
    sessionId,
  };
}

/**
 * Higher-Order Component for rate limiting route handlers
 *
 * Features:
 * - Auto-detects tier from pathname and HTTP method
 * - Adds X-RateLimit-* headers to all responses
 * - Returns 429 with Retry-After when limit exceeded
 * - Supports tier override via options
 * - Skips rate limiting when disabled via env
 *
 * @param handler - The route handler to wrap
 * @param options - Optional configuration
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit(
  handler: RouteHandler,
  options?: WithRateLimitOptions
): RouteHandler {
  return async (request: NextRequest, routeContext?: { params?: Record<string, string | string[]> }) => {
    // Skip if rate limiting disabled
    if (!isRateLimitEnabled()) {
      return handler(request, routeContext);
    }

    const pathname = request.nextUrl.pathname;
    const method = request.method;

    // Determine tier (override or auto-detect)
    const tier = options?.tier || getTierForRoute(pathname, method);

    // Skip rate limiting for exempt routes (health endpoint)
    if (tier === null || tier === 'health') {
      return handler(request, routeContext);
    }

    // Build key context
    const keyContext = options?.keyGenerator
      ? { ip: getClientIp(request) } // Custom generator will override
      : extractKeyContext(request);

    // Check rate limit
    const result = await checkRateLimit(tier, keyContext);

    if (!result.success) {
      return rateLimitResponse(result);
    }

    // Call the actual handler
    const response = await handler(request, routeContext);

    // Add rate limit headers to response
    return addRateLimitHeaders(response, result);
  };
}

/**
 * Create a rate limit checker for use inside handlers
 * Useful when you need to check rate limit with full auth context
 *
 * @param request - The NextRequest object
 * @param tier - Rate limit tier (or null for auto-detect)
 * @param authContext - Additional auth context (userId, tokenId)
 * @returns Rate limit result
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   const auth = await getAuth(request);
 *   const rateLimitResult = await checkRequestRateLimit(request, null, {
 *     userId: auth.userId,
 *   });
 *
 *   if (!rateLimitResult.success) {
 *     return rateLimitResponse(rateLimitResult);
 *   }
 *
 *   // ... handler logic
 * }
 */
export async function checkRequestRateLimit(
  request: NextRequest,
  tier?: RateLimitTier | null,
  authContext?: { userId?: string; tokenId?: number }
) {
  const actualTier = tier ?? getTierForRoute(request.nextUrl.pathname, request.method);

  if (actualTier === null || actualTier === 'health') {
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      reset: Date.now(),
    };
  }

  const keyContext: RateLimitKeyContext = {
    ip: getClientIp(request),
    sessionId: request.headers.get('mcp-session-id') || undefined,
    ...authContext,
  };

  return checkRateLimit(actualTier, keyContext);
}

/**
 * Decorator-style rate limiting for class methods (future use)
 * Currently not used but available for class-based handlers
 */
export function RateLimit(tierOrOptions?: RateLimitTier | WithRateLimitOptions) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const options: WithRateLimitOptions =
      typeof tierOrOptions === 'string' ? { tier: tierOrOptions } : tierOrOptions || {};

    descriptor.value = withRateLimit(originalMethod, options);
    return descriptor;
  };
}
