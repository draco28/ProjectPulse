/**
 * Projects API Route
 * Sprint 8.9: Create and list user projects
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth-server';
import { cloneWikiTemplates } from '@/lib/wiki/system-templates';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name too long').trim(),
  description: z.string().max(1000, 'Description too long').optional(),
  repository: z.string().url('Invalid repository URL').optional().or(z.literal('')),
});

/**
 * GET /api/projects
 * List all projects owned by the current user
 */
export async function GET() {
  try {
    const user = await requireUser();

    const projects = await prisma.project.findMany({
      where: { ownerId: user.id },
      include: {
        onboardingSessions: {
          select: {
            id: true,
            sessionNumber: true,
            status: true,
            completedAt: true,
          },
          orderBy: { sessionNumber: 'asc' },
        },
        _count: {
          select: {
            issues: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate onboarding progress for each project
    const projectsWithProgress = projects.map((project) => {
      const sessions = project.onboardingSessions;
      const completedSessions = sessions.filter((s) => s.status === 'complete').length;
      const totalSessions = 3; // Sprint 9: 3-session onboarding
      const onboardingProgress = sessions.length > 0 ? (completedSessions / totalSessions) * 100 : 0;
      const onboardingComplete = completedSessions === totalSessions;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        repository: project.repository,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        issueCount: project._count.issues,
        onboarding: {
          progress: onboardingProgress,
          complete: onboardingComplete,
          sessions: sessions.length,
          completedSessions,
        },
      };
    });

    return NextResponse.json({ projects: projectsWithProgress });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('GET /api/projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/projects
 * Create a new project owned by the current user
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const body = await request.json();
    const validationResult = createProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, description, repository } = validationResult.data;

    // Check for duplicate project name (per user)
    const existing = await prisma.project.findFirst({
      where: {
        name,
        ownerId: user.id,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A project with this name already exists' },
        { status: 409 }
      );
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        repository: repository || null,
        ownerId: user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        repository: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Clone default wiki templates (non-blocking, but awaited for simplicity in this route)
    await cloneWikiTemplates(project.id, project.name);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('POST /api/projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
