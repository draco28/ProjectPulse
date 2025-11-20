/**
 * Server-side Auth Utilities
 * Sprint 8.9: Get current user in Server Components and API routes
 */

import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  // Type assertion: we add userId in auth callbacks
  const userId = (session.user as any).id as string;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * Get current user or throw error
 * Use in protected API routes
 */
export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Get first project owned by user
 * Used as fallback when ?project param is missing
 */
export async function getFirstOwnedProjectId(userId: string): Promise<number | null> {
  const project = await prisma.project.findFirst({
    where: { ownerId: userId },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  return project?.id ?? null;
}

/**
 * Verify user owns the project
 * Throws error if unauthorized
 */
export async function verifyProjectOwnership(projectId: number, userId: string): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project || project.ownerId !== userId) {
    throw new Error('Unauthorized: Project not found or access denied');
  }
}

/**
 * Get project with ownership check
 * Returns project if authorized, null if not found or unauthorized
 */
export async function getAuthorizedProject(
  projectId: number | undefined,
  userId: string
): Promise<{ id: number; name: string } | null> {
  // If no projectId provided, get first owned project
  const resolvedId = projectId ?? (await getFirstOwnedProjectId(userId));

  if (!resolvedId) {
    return null; // No projects
  }

  // Verify ownership
  const project = await prisma.project.findUnique({
    where: { id: resolvedId },
    select: { id: true, name: true, ownerId: true },
  });

  if (!project || project.ownerId !== userId) {
    return null; // Unauthorized
  }

  return { id: project.id, name: project.name };
}
