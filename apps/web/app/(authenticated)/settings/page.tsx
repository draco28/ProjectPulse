/**
 * Project Settings Page (Sprint 15: Migrated to Authenticated Layout)
 *
 * Manage project-scoped agent tokens and settings.
 * Uses query param pattern: /settings?project=6
 *
 * Owner-only access enforced via getActiveProjectForUser.
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-server';
import { getActiveProjectForUser } from '@/lib/project-context';
import { prisma } from '@/lib/prisma';
import { SettingsClient } from './SettingsClient';

async function getProjectSettings(projectId: number, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      mcpWriteFiles: true,
      repository: true,
    },
  });

  if (!project) {
    return null;
  }

  if (project.ownerId !== userId) {
    return null; // Forbidden
  }

  // Fetch tokens and labels in parallel
  const [tokens, labels] = await Promise.all([
    prisma.projectToken.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        expiresAt: true,
        lastUsedAt: true,
        isRevoked: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Sprint 11.7: Fetch labels with usage counts
    prisma.label.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return { project, tokens, labels };
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const { projectId } = await getActiveProjectForUser(user.id, params.project);

  const data = await getProjectSettings(projectId, user.id);

  if (!data) {
    redirect('/app');
  }

  const { project, tokens, labels } = data;

  // MCP endpoint (configurable via env, fallback to production URL)
  const mcpEndpoint =
    process.env.NEXT_PUBLIC_MCP_URL || 'https://projectpulsemcp.dracodev.dev/mcp';

  return (
    <SettingsClient
      project={project}
      tokens={tokens}
      labels={labels}
      mcpEndpoint={mcpEndpoint}
    />
  );
}
