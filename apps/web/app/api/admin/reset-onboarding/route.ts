/**
 * POST /api/admin/reset-onboarding
 *
 * Resets onboarding state for a project by deleting all OnboardingSessions.
 * This allows restarting the onboarding wizard (Session 1-3) without deleting the project.
 *
 * Usage:
 * curl -X POST /api/admin/reset-onboarding -H "Content-Type: application/json" -d '{"projectId": 3}'
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-server';
import { z } from 'zod';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

const requestSchema = z.object({
  projectId: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    // Sprint 11.5: Require admin role
    await requireAdmin();

    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { projectId } = validation.data;

    log.info({ projectId }, 'Resetting onboarding for project');

    // 1. Delete Onboarding Sessions (Cascades to Documents)
    const deletedSessions = await prisma.onboardingSession.deleteMany({
      where: { projectId },
    });

    // 2. Optional: Delete Project Plan / Roadmap artifacts if you want a FULL clean slate
    // For now, we just reset the wizard state.

    // 3. Optional: Reset Agent Personas?
    // Usually we want to keep them if they were manually tweaked, but for a full reset test:
    // await prisma.agentPersona.deleteMany({ where: { projectId } });

    log.info({ projectId, deletedCount: deletedSessions.count }, 'Deleted sessions for project');

    return NextResponse.json({
      success: true,
      message: `Reset onboarding for project ${projectId}`,
      deletedSessions: deletedSessions.count,
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to reset onboarding'
    );

    // Sprint 11.5: Handle auth errors with proper status codes
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.startsWith('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to reset onboarding',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
