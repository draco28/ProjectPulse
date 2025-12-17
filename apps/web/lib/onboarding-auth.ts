/**
 * Onboarding API Authentication Helper
 * Sprint 12: Security fix - dual auth for onboarding APIs
 *
 * Supports BOTH:
 * - Session auth (web users via NextAuth)
 * - Bearer token auth (MCP agents via project tokens)
 *
 * Usage in routes:
 *   const { projectId } = validation.data;
 *   await requireOnboardingAuth(request, projectId);
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';
import { validateProjectToken } from './agent-tokens';

export interface OnboardingAuthResult {
  type: 'session' | 'agent';
  userId?: string;
  tokenId?: number;
  projectId: number;
}

/**
 * Authenticate onboarding API request
 *
 * Tries session auth first, then bearer token auth.
 * Verifies the authenticated identity has access to the requested project.
 *
 * @param request - NextRequest object
 * @param projectId - Project ID from request params/body
 * @returns Auth result with type and identity info
 * @throws Error with status code if authentication fails
 */
export async function requireOnboardingAuth(
  request: NextRequest,
  projectId: number
): Promise<OnboardingAuthResult> {
  // Try session auth first (web users)
  const session = await getServerSession(authOptions);

  if (session?.user) {
    const userId = (session.user as any).id as string;

    if (userId) {
      // Verify project ownership
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerId: true },
      });

      if (project?.ownerId === userId) {
        return { type: 'session', userId, projectId };
      }

      // User is logged in but doesn't own this project
      throw createAuthError('Forbidden: You do not own this project', 403);
    }
  }

  // Try bearer token auth (MCP agents)
  const authHeader = request.headers.get('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const rawToken = authHeader.slice(7);

    try {
      const validation = await validateProjectToken(rawToken);

      // Verify token is for the requested project
      if (validation.projectId === projectId) {
        return {
          type: 'agent',
          tokenId: validation.tokenId,
          projectId,
        };
      }

      // Token is valid but for a different project
      throw createAuthError('Forbidden: Token not valid for this project', 403);
    } catch (error) {
      // Token validation failed
      if (error instanceof AuthError) throw error;
      throw createAuthError('Invalid or expired token', 401);
    }
  }

  // No valid authentication provided
  throw createAuthError('Authentication required', 401);
}

/**
 * Custom error class for auth failures
 */
export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

function createAuthError(message: string, status: number): AuthError {
  return new AuthError(message, status);
}

/**
 * Handle auth errors and return appropriate response
 * Use in catch blocks of route handlers
 */
export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  // Re-throw unexpected errors
  throw error;
}

/**
 * Optional: Get auth info without throwing
 * Returns null if not authenticated (useful for optional auth scenarios)
 */
export async function getOnboardingAuth(
  request: NextRequest,
  projectId: number
): Promise<OnboardingAuthResult | null> {
  try {
    return await requireOnboardingAuth(request, projectId);
  } catch {
    return null;
  }
}
