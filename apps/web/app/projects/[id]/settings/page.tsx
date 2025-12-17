/**
 * Project Settings Page (Sprint 9: Agent OAuth & Settings)
 *
 * Manage project-scoped agent tokens and settings.
 * Owner-only access.
 */

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { ProjectSettingsClient } from './ProjectSettingsClient';

interface PageProps {
  params: { id: string };
  searchParams: { project?: string };
}

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

export default async function ProjectSettingsPage({ params, searchParams }: PageProps) {
  const user = await requireUser();
  const projectId = parseInt(params.id, 10);

  if (isNaN(projectId)) {
    redirect('/app');
  }

  const data = await getProjectSettings(projectId, user.id);

  if (!data) {
    redirect('/app');
  }

  const { project, tokens, labels } = data;

  // MCP endpoint (configurable via env, fallback to production URL)
  const mcpEndpoint = process.env.NEXT_PUBLIC_MCP_URL || 'https://projectpulsemcp.dracodev.dev/mcp';

  return (
    <ProjectSettingsClient
      project={project}
      tokens={tokens}
      labels={labels}
      mcpEndpoint={mcpEndpoint}
    />
  );
}
