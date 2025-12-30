/**
 * Rate Limit Key Generator
 * Sprint 17: Global Rate Limiting (Ticket #130)
 *
 * Generates composite keys for rate limiting based on tier and context.
 * Key patterns ensure fair rate limiting across different authentication contexts.
 */

import type { RateLimitTier, RateLimitKeyContext } from './types';
import { RATE_LIMIT_TIERS } from './tiers';

/**
 * Generate a rate limit key for the given tier and context
 *
 * Key patterns per tier:
 * - auth: rl:auth:{ip} (IP only - auth not yet known)
 * - write: rl:write:{ip}:{userId|tokenId} (composite for fairness)
 * - read: rl:read:{ip}:{userId|tokenId}
 * - mcp: rl:mcp:{sessionId|tokenId}:{ip} (session-scoped)
 * - bulk: rl:bulk:{userId|tokenId}:{ip}
 *
 * @param tier - The rate limit tier
 * @param context - Context containing IP, user ID, token ID, session ID
 * @returns A unique key for the rate limit bucket
 */
export function generateKey(tier: RateLimitTier, context: RateLimitKeyContext): string {
  const { keyPrefix } = RATE_LIMIT_TIERS[tier];

  switch (tier) {
    case 'auth':
      // Auth tier: IP only (user identity not yet established)
      return `${keyPrefix}:${context.ip}`;

    case 'mcp':
      // MCP tier: Prefer session ID, then token ID, fallback to IP
      if (context.sessionId) {
        return `${keyPrefix}:s:${context.sessionId}`;
      }
      if (context.tokenId) {
        return `${keyPrefix}:t:${context.tokenId}`;
      }
      return `${keyPrefix}:ip:${context.ip}`;

    case 'bulk':
      // Bulk tier: Prefer token/user, fallback to IP
      if (context.tokenId) {
        return `${keyPrefix}:t:${context.tokenId}`;
      }
      if (context.userId) {
        return `${keyPrefix}:u:${context.userId}`;
      }
      return `${keyPrefix}:ip:${context.ip}`;

    case 'write':
    case 'read':
      // Write/Read tiers: Composite key (IP + identity)
      // This prevents one user from consuming another's quota when sharing IP
      return buildCompositeKey(keyPrefix, context);

    case 'health':
      // Health tier is exempt, but if called, use IP
      return `${keyPrefix}:${context.ip}`;

    default:
      // Fallback: IP-based key
      return `${keyPrefix}:${context.ip}`;
  }
}

/**
 * Build a composite key combining IP with user/token identity
 *
 * Format: {prefix}:{ip}:{identity_type}:{identity_value}
 * Examples:
 *   rl:write:192.168.1.5:u:abc123  (user)
 *   rl:write:192.168.1.5:t:42      (token)
 *   rl:write:192.168.1.5:anon      (anonymous)
 */
function buildCompositeKey(prefix: string, context: RateLimitKeyContext): string {
  const { ip, userId, tokenId } = context;

  if (userId) {
    return `${prefix}:${ip}:u:${userId}`;
  }

  if (tokenId) {
    return `${prefix}:${ip}:t:${tokenId}`;
  }

  // Anonymous (no auth context yet)
  return `${prefix}:${ip}:anon`;
}

/**
 * Extract client IP from request headers
 *
 * Supports:
 * - x-forwarded-for (Cloudflare, reverse proxies)
 * - x-real-ip (nginx)
 * - Fallback to 'unknown'
 *
 * @param request - The incoming request
 * @returns Client IP address
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;

  // Cloudflare and most proxies use x-forwarded-for
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    // Take the first IP (client IP before proxies)
    const ip = forwarded.split(',')[0];
    return ip ? ip.trim() : 'unknown';
  }

  // nginx often uses x-real-ip
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Cloudflare-specific header
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  return 'unknown';
}
