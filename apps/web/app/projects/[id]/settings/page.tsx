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

  const tokens = await prisma.projectToken.findMany({
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
  });

  return { project, tokens };
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

  const { project, tokens } = data;

  // MCP endpoint (configurable via env, fallback to localhost)
  const mcpEndpoint = process.env.NEXT_PUBLIC_MCP_URL || 'http://192.168.1.15:3001/mcp';

  return (
    <ProjectSettingsClient
      project={project}
      tokens={tokens}
      mcpEndpoint={mcpEndpoint}
    />
  );
}
