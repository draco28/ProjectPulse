/**
 * Next.js Middleware
 * Sprint 8.9: Route protection and authentication
 * Sprint 11.5: Added admin route protection with role checking
 * Sprint 17: Added request ID correlation (Ticket #135)
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
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Request ID header name (matches lib/request-context.ts)
const REQUEST_ID_HEADER = 'x-request-id';

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
 * Create a NextResponse.next() with request ID injected.
 *
 * Injects the request ID into both:
 * - Request headers (for downstream API routes to read)
 * - Response headers (for client correlation)
 */
function nextWithRequestId(
  request: NextRequest,
  requestId: string
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

  // Also add to response headers for client visibility
  response.headers.set(REQUEST_ID_HEADER, requestId);

  return response;
}

/**
 * Create a NextResponse.redirect() with request ID in response headers.
 *
 * Redirects don't need request header injection (no downstream processing),
 * but include the request ID in response for client correlation.
 */
function redirectWithRequestId(url: URL, requestId: string): NextResponse {
  const response = NextResponse.redirect(url);
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Sprint 17: Generate or preserve request ID for correlation
  // Honor client-provided IDs (useful for distributed tracing)
  const incomingRequestId = request.headers.get(REQUEST_ID_HEADER);
  const requestId = incomingRequestId || crypto.randomUUID();

  // Allow public paths
  if (publicPaths.includes(pathname)) {
    return nextWithRequestId(request, requestId);
  }

  // Allow public API routes
  if (publicApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return nextWithRequestId(request, requestId);
  }

  // Sprint 10: All /api/* routes handle their own authentication
  // This allows both session auth (web users) and bearer token auth (MCP agents)
  // Routes will return 401/403 if auth fails
  if (pathname.startsWith('/api/')) {
    return nextWithRequestId(request, requestId);
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
    return redirectWithRequestId(loginUrl, requestId);
  }

  // Sprint 11.5: Admin route protection
  // Check if user is accessing /admin/* pages and verify ADMIN role
  if (pathname.startsWith('/admin')) {
    const userRole = token.role as string | undefined;
    if (userRole !== 'ADMIN') {
      // Non-admin users get redirected to /app
      return redirectWithRequestId(new URL('/app', request.url), requestId);
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
      return redirectWithRequestId(new URL('/app', request.url), requestId);
    }
  }

  // Allow authenticated requests
  return nextWithRequestId(request, requestId);
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
