/**
 * Request Context Utilities
 *
 * Provides request ID extraction and context utilities for API routes.
 * Part of Phase 2: Observability Infrastructure (Ticket #135)
 *
 * The request ID is injected by middleware and can be used to correlate
 * all log entries for a single request across the application.
 *
 * @module lib/request-context
 */

/**
 * Standard header name for request correlation ID.
 * Used by middleware to inject and by API routes to extract.
 */
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Extract request ID from request headers.
 *
 * The middleware injects X-Request-ID into all requests, so this
 * should always return a valid UUID. Falls back to empty string
 * if header is missing (shouldn't happen with middleware active).
 *
 * @param request - The incoming request object
 * @returns The request ID from headers, or empty string if missing
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const requestId = getRequestId(request);
 *   const log = createRequestLogger(requestId);
 *   // ... handle request
 * }
 * ```
 */
export function getRequestId(request: Request): string {
  return request.headers.get(REQUEST_ID_HEADER) || '';
}

/**
 * Request context object containing correlation and client information.
 */
export interface RequestContext {
  /** Unique request identifier for log correlation */
  requestId: string;
  /** Client user agent string */
  userAgent: string | null;
  /** Client IP address (from proxy headers or direct connection) */
  ip: string | null;
  /** Request path (e.g., '/api/tickets') */
  path: string;
  /** HTTP method (GET, POST, etc.) */
  method: string;
}

/**
 * Extract full request context for structured logging.
 *
 * Provides all relevant request metadata in a single call,
 * suitable for passing to createRequestLogger or including
 * in log entries.
 *
 * @param request - The incoming request object
 * @returns Request context object with ID, client info, and request details
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const ctx = getRequestContext(request);
 *   const log = createRequestLogger(ctx.requestId);
 *
 *   log.info({
 *     ip: ctx.ip,
 *     userAgent: ctx.userAgent,
 *     path: ctx.path,
 *     method: ctx.method,
 *   }, 'Request started');
 * }
 * ```
 */
export function getRequestContext(request: Request): RequestContext {
  const url = new URL(request.url);

  return {
    requestId: getRequestId(request),
    userAgent: request.headers.get('user-agent'),
    ip: getClientIp(request),
    path: url.pathname,
    method: request.method,
  };
}

/**
 * Extract client IP address from request headers.
 *
 * Checks multiple headers in order of preference:
 * 1. X-Forwarded-For (standard proxy header, first IP in chain)
 * 2. X-Real-IP (nginx proxy header)
 * 3. CF-Connecting-IP (Cloudflare)
 *
 * @param request - The incoming request object
 * @returns Client IP address or null if not available
 */
function getClientIp(request: Request): string | null {
  // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
  // The first one is the original client
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  // Fallback to other common headers
  return request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || null;
}
