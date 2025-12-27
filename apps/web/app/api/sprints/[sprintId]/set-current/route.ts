/**
 * Set Current Sprint API Route - Sprint 15
 *
 * POST /api/sprints/[sprintId]/set-current
 *
 * Manually sets a sprint as the current (IN_PROGRESS) sprint.
 * This is the manual override for the auto-progression system.
 *
 * Behavior:
 * 1. Validates sprint exists and is not already COMPLETED
 * 2. Sets target sprint status to IN_PROGRESS
 * 3. If sprint's phase is NOT_STARTED, activates it too
 * 4. Does NOT deactivate other sprints (allows multiple IN_PROGRESS)
 *
 * Security (Sprint 10):
 * - All requests MUST be authenticated (user session OR agent token)
 * - Sprint's project must match authenticated context
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectAccess, AuthError } from '@/lib/auth/validateRequest';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ sprintId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { sprintId } = await context.params;

    if (!sprintId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PARAM', message: 'Sprint ID is required' } },
        { status: 400 }
      );
    }

    // Fetch sprint with phase and project context
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      select: {
        id: true,
        sprintNumber: true,
        title: true,
        status: true,
        phase: {
          select: {
            id: true,
            title: true,
            status: true,
            roadmap: {
              select: {
                id: true,
                projectId: true,
              },
            },
          },
        },
      },
    });

    if (!sprint) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Sprint not found' } },
        { status: 404 }
      );
    }

    if (!sprint.phase?.roadmap?.projectId) {
      return NextResponse.json(
        { success: false, error: { code: 'ORPHAN_SPRINT', message: 'Sprint has no associated project' } },
        { status: 400 }
      );
    }

    // Authenticate and validate project access
    const projectId = sprint.phase.roadmap.projectId;
    await requireProjectAccess(request, projectId);

    // Validate sprint is not already completed
    if (sprint.status === 'COMPLETED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_COMPLETED',
            message: `Sprint ${sprint.sprintNumber} is already completed and cannot be set as current`,
          },
        },
        { status: 400 }
      );
    }

    // Already in progress - no action needed
    if (sprint.status === 'IN_PROGRESS') {
      return NextResponse.json({
        success: true,
        data: {
          sprint: {
            id: sprint.id,
            sprintNumber: sprint.sprintNumber,
            title: sprint.title,
            status: sprint.status,
          },
          message: 'Sprint is already current',
          phaseActivated: false,
        },
      });
    }

    // Transaction: Set sprint and possibly phase to IN_PROGRESS
    const result = await prisma.$transaction(async (tx) => {
      // Activate sprint
      const updatedSprint = await tx.sprint.update({
        where: { id: sprintId },
        data: { status: 'IN_PROGRESS' },
        select: {
          id: true,
          sprintNumber: true,
          title: true,
          status: true,
        },
      });

      let phaseActivated = false;

      // If phase is NOT_STARTED, activate it too
      if (sprint.phase.status === 'NOT_STARTED') {
        await tx.phase.update({
          where: { id: sprint.phase.id },
          data: { status: 'IN_PROGRESS' },
        });
        phaseActivated = true;
      }

      return { updatedSprint, phaseActivated };
    });

    // Revalidate roadmap pages
    revalidatePath('/roadmap');
    revalidatePath(`/roadmap/${sprint.phase.roadmap.id}`);
    revalidatePath(`/roadmap/sprint/${sprintId}`);

    return NextResponse.json({
      success: true,
      data: {
        sprint: result.updatedSprint,
        message: `Sprint ${result.updatedSprint.sprintNumber} is now current`,
        phaseActivated: result.phaseActivated,
      },
    });
  } catch (error) {
    // Handle auth errors
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    console.error('[POST /api/sprints/[sprintId]/set-current] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to set current sprint' } },
      { status: 500 }
    );
  }
}
