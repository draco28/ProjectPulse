/**
 * Project Detail API (Sprint 9)
 *
 * Manage individual project settings.
 * - PATCH: Update project settings (mcpWriteFiles, etc.)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth-server';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

const updateProjectSchema = z.object({
  mcpWriteFiles: z.boolean().optional(),
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(1000).optional(),
  repository: z.string().url('Invalid repository URL').optional().or(z.literal('')),
});

/**
 * PATCH /api/projects/[id]
 *
 * Update project settings (owner only).
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const log = createRequestLogger(getRequestId(request));

  try {
    const user = await requireUser();
    const projectId = parseInt(params.id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Verify ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this project' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updates,
      select: {
        id: true,
        name: true,
        description: true,
        repository: true,
        mcpWriteFiles: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ project: updatedProject }, { status: 200 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Project update failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
