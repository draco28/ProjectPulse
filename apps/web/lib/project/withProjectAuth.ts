/**
 * Unified Server-Side Auth + Project Resolution
 *
 * USAGE in Server Components:
 *
 * export default async function MyPage({ searchParams }) {
 *   const params = await searchParams;
 *   const { user, project, projectId } = await withProjectAuth(params.project);
 *   // ... render with project context
 * }
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-server';
import { getActiveProjectForUser, type ProjectContext } from '@/lib/project-context';

export interface ProjectAuthContext {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  project: {
    id: number;
    name: string;
    ownerId: string;
  };
  projectId: number;
}

export interface WithProjectAuthOptions {
  /** Require admin role */
  requireAdmin?: boolean;
}

/**
 * Unified page-level authentication and project resolution.
 *
 * This is the SINGLE SOURCE OF TRUTH for server components.
 * Replaces the pattern of calling getCurrentUser() + getActiveProjectForUser() separately.
 *
 * @param searchParamsProject - The `project` query parameter from searchParams
 * @param options - Optional configuration
 * @returns ProjectAuthContext with user and project data
 * @throws Redirects to /login if not authenticated
 * @throws Redirects to /app if project invalid or unauthorized
 *
 * @example
 * // In a page.tsx
 * const { user, project, projectId } = await withProjectAuth(params.project);
 */
export async function withProjectAuth(
  searchParamsProject?: string,
  options: WithProjectAuthOptions = {}
): Promise<ProjectAuthContext> {
  // Step 1: Authenticate user
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Step 2: Check admin requirement if specified
  if (options.requireAdmin && user.role !== 'ADMIN') {
    redirect('/app');
  }

  // Step 3: Resolve project with ownership validation
  const { project, projectId } = await getActiveProjectForUser(user.id, searchParamsProject);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    project,
    projectId,
  };
}

/**
 * Lightweight version that only validates project access.
 * Use when you already have user context.
 */
export async function withProjectOnly(
  userId: string,
  searchParamsProject?: string
): Promise<ProjectContext> {
  return getActiveProjectForUser(userId, searchParamsProject);
}
