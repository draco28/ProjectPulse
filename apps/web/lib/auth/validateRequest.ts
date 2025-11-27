/**
 * API Request Authentication & Authorization (Sprint 10: Security Architecture)
 *
 * Unified authentication for ALL API routes:
 * - Web app users: NextAuth session cookie
 * - MCP agents: Bearer token (project-scoped)
 *
 * Security principles:
 * - All API routes MUST authenticate (no whitelist bypass)
 * - Agent tokens enforce project isolation
 * - Defense in depth: token validated at both MCP and API layers
 */

import { getCurrentUser } from '@/lib/auth-server';
import { validateProjectToken } from '@/lib/agent-tokens';
import { prisma } from '@/lib/prisma';

/**
 * Authentication result types
 */
export type AuthResult =
  | { type: 'user'; userId: string }
  | { type: 'agent'; projectId: number; tokenId: number; tokenName: string }
  | { type: 'none' };

/**
 * Custom error class for authentication failures
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string = 'AUTH_ERROR'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Get authentication context from request
 * Tries session auth first, then bearer token
 *
 * @param request - The incoming request
 * @returns AuthResult indicating auth type and context
 */
export async function getAuthContext(request: Request): Promise<AuthResult> {
  // 1. Try NextAuth session (web app users)
  try {
    const user = await getCurrentUser();
    if (user) {
      return { type: 'user', userId: user.id };
    }
  } catch {
    // Session check failed, continue to token auth
  }

  // 2. Try Bearer token (MCP agents)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const result = await validateProjectToken(token);
      return {
        type: 'agent',
        projectId: result.projectId,
        tokenId: result.tokenId,
        tokenName: result.name,
      };
    } catch {
      // Invalid token
    }
  }

  return { type: 'none' };
}

/**
 * Require authentication for an API request
 * Throws AuthError if not authenticated
 *
 * @param request - The incoming request
 * @returns AuthResult with user or agent context
 * @throws AuthError if authentication fails
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  const auth = await getAuthContext(request);

  if (auth.type === 'none') {
    throw new AuthError('Authentication required', 401, 'UNAUTHORIZED');
  }

  return auth;
}

/**
 * Require authentication AND project access
 * Enforces project isolation for agent tokens
 *
 * @param request - The incoming request
 * @param projectId - The project being accessed
 * @returns AuthResult with validated context
 * @throws AuthError if auth fails or project access denied
 */
export async function requireProjectAccess(
  request: Request,
  projectId: number
): Promise<AuthResult> {
  const auth = await getAuthContext(request);

  if (auth.type === 'none') {
    throw new AuthError('Authentication required', 401, 'UNAUTHORIZED');
  }

  if (auth.type === 'agent') {
    // CRITICAL: Enforce project scope for agent tokens
    if (auth.projectId !== projectId) {
      throw new AuthError(
        `Access denied: token is scoped to project ${auth.projectId}, not ${projectId}`,
        403,
        'PROJECT_ACCESS_DENIED'
      );
    }
  }

  if (auth.type === 'user') {
    // Verify user owns or has access to the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      throw new AuthError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    if (project.ownerId !== auth.userId) {
      throw new AuthError(
        'Access denied: you do not own this project',
        403,
        'PROJECT_ACCESS_DENIED'
      );
    }
  }

  return auth;
}

/**
 * Get project ID with authentication
 * For routes where projectId might be optional/defaulted
 *
 * @param request - The incoming request
 * @param requestedProjectId - Optional project ID from request
 * @returns Validated project ID
 * @throws AuthError if access denied
 */
export async function getAuthorizedProjectId(
  request: Request,
  requestedProjectId?: number
): Promise<{ auth: AuthResult; projectId: number }> {
  const auth = await requireAuth(request);

  // If projectId provided, validate access
  if (requestedProjectId !== undefined) {
    await requireProjectAccess(request, requestedProjectId);
    return { auth, projectId: requestedProjectId };
  }

  // No projectId provided - determine from auth context
  if (auth.type === 'agent') {
    // Agent must use their token's project
    return { auth, projectId: auth.projectId };
  }

  if (auth.type === 'user') {
    // User can use their first project as default
    const project = await prisma.project.findFirst({
      where: { ownerId: auth.userId },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!project) {
      throw new AuthError('No projects found', 404, 'NO_PROJECTS');
    }

    return { auth, projectId: project.id };
  }

  // Should not reach here
  throw new AuthError('Unable to determine project', 400, 'PROJECT_REQUIRED');
}

/**
 * Helper to create error response from AuthError
 */
export function authErrorResponse(error: AuthError) {
  return Response.json(
    {
      error: error.message,
      code: error.code,
    },
    { status: error.status }
  );
}
