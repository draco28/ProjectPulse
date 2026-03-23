/**
 * Roadmap Overview API Route - Sprint 15 Phase B
 *
 * GET /api/roadmap/overview?projectId=X
 *
 * Returns a high-level overview of the roadmap with live ticket counts.
 * Optimized for dashboard views - single query with aggregations.
 *
 * Security (Sprint 10):
 * - All requests MUST be authenticated (user session OR agent token)
 * - Project must match authenticated context
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireProjectAccess, AuthError } from '@/lib/auth/validateRequest';
import { RoadmapOverviewQuerySchema } from '@/lib/validations/kanban';
import { TICKET_STATUSES } from '@/lib/constants/status';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import type { RoadmapOverviewResponse, PhaseOverview, SprintOverview } from '@/types/kanban';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));

  try {
    const { searchParams } = new URL(request.url);
    const projectIdParam = searchParams.get('projectId');

    if (!projectIdParam) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PARAM', message: 'projectId is required' } },
        { status: 400 }
      );
    }

    // Validate and parse query params
    const { projectId } = RoadmapOverviewQuerySchema.parse({
      projectId: projectIdParam,
    });

    // Authenticate and validate project access
    await requireProjectAccess(request, projectId);

    // Fetch roadmap with phases, sprints, and ticket counts
    // Note: Roadmap model doesn't have title field - we derive it from project name
    // Sprint 15 Phase E: Include startDate/endDate for Phase Timeline view
    const roadmap = await prisma.roadmap.findUnique({
      where: { projectId },
      select: {
        id: true,
        projectId: true,
        project: {
          select: { name: true },
        },
        phases_rel: {
          select: {
            id: true,
            title: true,
            status: true,
            progress: true,
            startDate: true,
            endDate: true,
            sprints: {
              select: {
                id: true,
                sprintNumber: true,
                title: true,
                status: true,
                progress: true,
                startDate: true,
                endDate: true,
                // Get ticket stats via subquery
                tickets: {
                  select: {
                    status: true,
                  },
                },
              },
              orderBy: { sprintNumber: 'asc' },
            },
          },
          orderBy: { startDate: 'asc' },
        },
      },
    });

    if (!roadmap) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Roadmap not found for this project' },
        },
        { status: 404 }
      );
    }

    // Transform to overview format with calculated stats
    // Sprint 15 Phase E: Extended for Phase Timeline view
    // Sprint 15 Phase F-fix: Calculate global sprint numbers across all phases
    let totalTickets = 0;
    let completedTickets = 0;
    let inProgressTickets = 0;
    let inReviewTickets = 0;

    // Track global sprint counter and current sprint
    let globalSprintCounter = 0;
    let currentGlobalSprintNumber: number | undefined = undefined;

    const phases: PhaseOverview[] = roadmap.phases_rel.map((phase) => {
      const sprints: SprintOverview[] = phase.sprints.map((sprint) => {
        // Increment global sprint counter
        globalSprintCounter++;

        // Track the current sprint (first IN_PROGRESS sprint found)
        if (sprint.status === 'IN_PROGRESS' && currentGlobalSprintNumber === undefined) {
          currentGlobalSprintNumber = globalSprintCounter;
        }

        const tickets = sprint.tickets ?? [];
        const total = tickets.length;
        const done = tickets.filter((t) => t.status === TICKET_STATUSES.DONE).length;
        const inProgress = tickets.filter((t) => t.status === TICKET_STATUSES.IN_PROGRESS).length;
        const inReview = tickets.filter((t) => t.status === TICKET_STATUSES.IN_REVIEW).length;
        const todo = tickets.filter((t) => t.status === TICKET_STATUSES.TODO).length;
        const backlog = tickets.filter((t) => t.status === TICKET_STATUSES.BACKLOG).length;

        totalTickets += total;
        completedTickets += done;
        inProgressTickets += inProgress;
        inReviewTickets += inReview;

        return {
          id: sprint.id,
          sprintNumber: sprint.sprintNumber,
          globalSprintNumber: globalSprintCounter,
          title: sprint.title,
          status: sprint.status,
          progress: sprint.progress,
          startDate: sprint.startDate?.toISOString(),
          endDate: sprint.endDate?.toISOString(),
          ticketCounts: {
            total,
            done,
            inProgress,
            inReview,
            todo,
            backlog,
          },
        };
      });

      return {
        id: phase.id,
        title: phase.title,
        status: phase.status,
        progress: phase.progress,
        startDate: phase.startDate?.toISOString(),
        endDate: phase.endDate?.toISOString(),
        sprints,
      };
    });

    const overallProgress =
      totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0;

    // Determine current phase (first IN_PROGRESS, or first NOT_STARTED, or first)
    const currentPhase =
      phases.find((p) => p.status === 'IN_PROGRESS') ??
      phases.find((p) => p.status === 'NOT_STARTED') ??
      phases[0];

    const response: RoadmapOverviewResponse = {
      projectId,
      roadmapId: roadmap.id,
      title: `${roadmap.project?.name ?? 'Project'} Roadmap`,
      phases,
      currentPhaseId: currentPhase?.id,
      currentGlobalSprintNumber,
      stats: {
        totalPhases: phases.length,
        totalSprints: phases.reduce((sum, p) => sum + p.sprints.length, 0),
        totalTickets,
        completedTickets,
        inProgressTickets,
        inReviewTickets,
        overallProgress,
      },
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    // Handle auth errors
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors.map((e) => ({ path: e.path, message: e.message })),
          },
        },
        { status: 400 }
      );
    }

    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Fetch roadmap overview failed'
    );
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch roadmap overview' },
      },
      { status: 500 }
    );
  }
}
