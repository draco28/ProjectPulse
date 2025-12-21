/**
 * POST /api/onboarding/sync-session3
 *
 * Sprint 12: Sync Session 3 completion status
 *
 * Counts bootstrap artifacts (personas, skills, workflows, SOPs) and
 * creates/updates the Session 3 OnboardingSession record.
 *
 * Use Case: When agents create artifacts via batch MCP tools instead of
 * the bootstrap API, Session 3 record is never created. This endpoint
 * allows syncing the session state with actual artifact counts.
 *
 * Request Body:
 * - projectId: number (required)
 *
 * Response:
 * - 200: Session 3 synced successfully
 * - 400: No artifacts found / validation error
 * - 401/403: Authentication error
 * - 404: Project not found
 * - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireOnboardingAuth, handleAuthError, AuthError } from '@/lib/onboarding-auth';

const requestSchema = z.object({
  projectId: z.number().int().positive('Project ID must be positive'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { projectId } = validation.data;

    // Sprint 12: Require authentication (session OR bearer token)
    await requireOnboardingAuth(request, projectId);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Count existing bootstrap artifacts
    const [personas, skills, workflows, sops] = await Promise.all([
      prisma.agentPersona.count({ where: { projectId } }),
      prisma.skill.count({ where: { projectId } }),
      prisma.workflowTemplate.count({ where: { projectId } }),
      prisma.sOP.count({ where: { projectId } }),
    ]);

    const hasArtifacts = personas > 0 || skills > 0 || workflows > 0 || sops > 0;

    if (!hasArtifacts) {
      return NextResponse.json(
        {
          error: 'No bootstrap artifacts found',
          message: 'Create at least one persona, skill, workflow, or SOP before syncing Session 3',
          artifactCounts: { personas: 0, skills: 0, workflows: 0, sops: 0 },
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const responseData = {
      agentPersonasCreated: personas,
      skillsCreated: skills,
      workflowsCreated: workflows,
      sopsCreated: sops,
      syncedAt: now.toISOString(),
      syncedVia: 'mcp-sync-tool',
    };

    // Upsert Session 3 record
    const session3 = await prisma.onboardingSession.upsert({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 3 },
      },
      update: {
        status: 'complete',
        response: responseData as Prisma.InputJsonValue,
        completedAt: now,
        updatedAt: now,
      },
      create: {
        projectId,
        sessionNumber: 3,
        status: 'complete',
        response: responseData as Prisma.InputJsonValue,
        startedAt: now,
        completedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session3.id,
      sessionNumber: 3,
      status: session3.status,
      artifactCounts: { personas, skills, workflows, sops },
      message: `Session 3 synced successfully. Found ${personas} personas, ${skills} skills, ${workflows} workflows, ${sops} SOPs.`,
    });
  } catch (error) {
    // Handle auth errors
    if (error instanceof AuthError) {
      return handleAuthError(error);
    }

    console.error('[POST /api/onboarding/sync-session3] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync Session 3',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
