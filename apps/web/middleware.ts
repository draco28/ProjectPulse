/**
 * Next.js Middleware
 * Sprint 8.9: Route protection and authentication
 * Sprint 11.5: Added admin route protection with role checking
 * Sprint 17: Added request ID correlation (Ticket #135)
 * Sprint 18: Added API response time metrics (Ticket #136)
 *
 * Protected routes: /app, /dashboard, /issues, /wiki, etc.
 * Admin routes: /admin/* (requires ADMIN role)
 * Public routes: /login, /api/auth/*, /api/health
 *
 * Request ID Flow:
 * 1. Check for incoming X-Request-ID header
 * 2. Generate UUID if missing (honors client-provided IDs)
 * 3. Inject into request headers for downstream API routes
 * 4. Include in response headers for client correlation
 *
 * Response Time Tracking:
 * 1. Capture start time at middleware entry
 * 2. Calculate duration before returning response
 * 3. Add X-Response-Time header to all responses
 * 4. Record metrics for API routes (batched logging)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { recordAPIMetric } from '@/lib/metrics';

// Request ID header name (matches lib/request-context.ts)
const REQUEST_ID_HEADER = 'x-request-id';

// Response time header name
const RESPONSE_TIME_HEADER = 'x-response-time';

const publicPaths = ['/login', '/api/auth/signup', '/api/health'];
const publicApiPrefixes = [
  '/api/auth/',
  '/api/agent-auth/',
  // Sprint 12: REMOVED '/api/onboarding/' - now requires dual auth (session OR bearer token)
  '/api/batch/',
  // Sprint 11.5: REMOVED '/api/admin/' - admin routes require authentication
];

// Sprint 10 Security Architecture: REMOVED mcpApiPaths whitelist
// All API routes now handle their own authentication via:
// - User session (NextAuth) for web app users
// - Bearer token (project-scoped) for MCP agents
// The whitelist approach was a security vulnerability - anyone with curl could access APIs
// Sprint 10: Removed '/issues' - it's a redirect page to /tickets, project context enforced there
// Sprint 11.7: Added '/tickets' - requires project context for proper filtering
const projectRoutes = [
  '/dashboard',
  '/wiki',
  '/knowledge',
  '/health',
  '/agents',
  '/roadmap',
  '/tickets',
];

/**
 * Create a NextResponse.next() with request ID and response time injected.
 *
 * Injects the request ID into both:
 * - Request headers (for downstream API routes to read)
 * - Response headers (for client correlation)
 *
 * Also adds X-Response-Time header for performance visibility.
 */
function nextWithRequestId(
  request: NextRequest,
  requestId: string,
  durationMs: number
): NextResponse {
  // Clone request headers and add request ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  // Create response with modified request headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add headers for client visibility and correlation
  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.headers.set(RESPONSE_TIME_HEADER, `${durationMs}ms`);

  return response;
}

/**
 * Create a NextResponse.redirect() with request ID and response time in headers.
 *
 * Redirects don't need request header injection (no downstream processing),
 * but include the request ID and response time in headers for client correlation.
 */
function redirectWithRequestId(
  url: URL,
  requestId: string,
  durationMs: number
): NextResponse {
  const response = NextResponse.redirect(url);
  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.headers.set(RESPONSE_TIME_HEADER, `${durationMs}ms`);
  return response;
}

export async function middleware(request: NextRequest) {
  // Sprint 18: Capture start time for response time metrics
  const startTime = Date.now();

  const { pathname, searchParams } = request.nextUrl;

  // Sprint 17: Generate or preserve request ID for correlation
  // Honor client-provided IDs (useful for distributed tracing)
  const incomingRequestId = request.headers.get(REQUEST_ID_HEADER);
  const requestId = incomingRequestId || crypto.randomUUID();

  // Sprint 18: Extract client info for metrics
  const userAgent = request.headers.get('user-agent') || undefined;
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    undefined;

  /**
   * Helper to calculate duration and record API metrics.
   * Only records metrics for /api/* routes.
   */
  const getDurationAndRecordMetric = (): number => {
    const durationMs = Date.now() - startTime;

    if (pathname.startsWith('/api/')) {
      recordAPIMetric({
        requestId,
        path: pathname,
        method: request.method,
        durationMs,
        timestamp: Date.now(),
        userAgent,
        ip,
      });
    }

    return durationMs;
  };

  // Allow public paths
  if (publicPaths.includes(pathname)) {
    return nextWithRequestId(request, requestId, getDurationAndRecordMetric());
  }

  // Allow public API routes
  if (publicApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return nextWithRequestId(request, requestId, getDurationAndRecordMetric());
  }

  // Sprint 10: All /api/* routes handle their own authentication
  // This allows both session auth (web users) and bearer token auth (MCP agents)
  // Routes will return 401/403 if auth fails
  if (pathname.startsWith('/api/')) {
    return nextWithRequestId(request, requestId, getDurationAndRecordMetric());
  }

  // Check authentication for protected web routes (pages, not APIs)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect to login if not authenticated (only for web pages)
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return redirectWithRequestId(
      loginUrl,
      requestId,
      getDurationAndRecordMetric()
    );
  }

  // Sprint 11.5: Admin route protection
  // Check if user is accessing /admin/* pages and verify ADMIN role
  if (pathname.startsWith('/admin')) {
    const userRole = token.role as string | undefined;
    if (userRole !== 'ADMIN') {
      // Non-admin users get redirected to /app
      return redirectWithRequestId(
        new URL('/app', request.url),
        requestId,
        getDurationAndRecordMetric()
      );
    }
  }

  // Enforce project context on project-scoped routes
  const requiresProject = projectRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Exception: Wiki detail pages (e.g., /wiki/project-slug/page-slug) derive context from the URL path
  // We allow these to bypass the query param check because the page component will resolve the project
  const isWikiDetailPage =
    pathname.startsWith('/wiki/') && pathname.split('/').length > 2;

  if (requiresProject && !isWikiDetailPage) {
    const projectId = searchParams.get('project');
    if (!projectId) {
      // Redirect to project selector when project context is missing
      return redirectWithRequestId(
        new URL('/app', request.url),
        requestId,
        getDurationAndRecordMetric()
      );
    }
  }

  // Allow authenticated requests
  return nextWithRequestId(request, requestId, getDurationAndRecordMetric());
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
