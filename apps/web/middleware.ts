/**
 * Next.js Middleware
 * Sprint 8.9: Route protection and authentication
 * 
 * Protected routes: /app, /dashboard, /issues, /wiki, etc.
 * Public routes: /login, /api/auth/*, /api/health
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicPaths = ['/login', '/api/auth/signup', '/api/health'];
const publicApiPrefixes = ['/api/auth/', '/api/agent-auth/'];
const projectRoutes = ['/dashboard', '/issues', '/wiki', '/knowledge', '/health', '/agents', '/roadmap'];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Allow public paths
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (publicApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect to login if not authenticated
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Enforce project context on project-scoped routes
  const requiresProject = projectRoutes.some((route) => pathname.startsWith(route));
  
  // Exception: Wiki detail pages (e.g., /wiki/project-slug/page-slug) derive context from the URL path
  // We allow these to bypass the query param check because the page component will resolve the project
  const isWikiDetailPage = pathname.startsWith('/wiki/') && pathname.split('/').length > 2;
  
  if (requiresProject && !isWikiDetailPage) {
    const projectId = searchParams.get('project');
    if (!projectId) {
      // Redirect to project selector when project context is missing
      return NextResponse.redirect(new URL('/app', request.url));
    }
  }

  // Allow authenticated requests
  return NextResponse.next();
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
