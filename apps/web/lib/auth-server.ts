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
