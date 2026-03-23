/**
 * Kanban Board API Route - Sprint 15 Phase B
 *
 * GET /api/sprints/[sprintId]/kanban
 *
 * Returns the kanban board data for a specific sprint:
 * - Tickets grouped by status (column)
 * - Board statistics (total, done, progress)
 * - Sprint context (title, phase, etc.)
 *
 * Note: Child tickets are rendered independently (not nested in parents),
 * with visual parent reference. Ghost cards removed in Sprint 15.
 *
 * Security (Sprint 10):
 * - All requests MUST be authenticated (user session OR agent token)
 * - Sprint's project must match authenticated context
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectAccess, AuthError } from '@/lib/auth/validateRequest';
import {
  TICKET_STATUSES,
  TICKET_STATUS_VALUES,
  TicketStatusSystem,
  type TicketStatus,
} from '@/lib/constants/status';
import { getSprintProgressStats } from '@/lib/tickets/progress-calculator';
import type {
  KanbanBoardResponse,
  KanbanTicket,
  BoardStats,
  ColumnStats,
  SprintContext,
} from '@/types/kanban';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ sprintId: string }>;
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(request: NextRequest, context: RouteContext) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const { sprintId } = await context.params;

    if (!sprintId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PARAM', message: 'Sprint ID is required' } },
        { status: 400 }
      );
    }

    // Fetch sprint with phase context
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      select: {
        id: true,
        sprintNumber: true,
        title: true,
        status: true,
        progress: true,
        phase: {
          select: {
            id: true,
            title: true,
            roadmap: {
              select: {
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
        {
          success: false,
          error: { code: 'ORPHAN_SPRINT', message: 'Sprint has no associated project' },
        },
        { status: 400 }
      );
    }

    // Authenticate and validate project access
    const projectId = sprint.phase.roadmap.projectId;
    await requireProjectAccess(request, projectId);

    // Fetch tickets for this sprint with hierarchy
    // Sprint 17: Include ticketNumber for project-scoped display
    const rawTickets = await prisma.ticket.findMany({
      where: { sprintId },
      select: {
        id: true,
        ticketNumber: true, // Sprint 17
        title: true,
        status: true,
        priority: true,
        kind: true,
        displayOrder: true,
        parentTicketId: true,
        parentTicket: {
          select: {
            id: true,
            ticketNumber: true, // Sprint 17
            title: true,
            status: true,
          },
        },
        childTickets: {
          select: {
            id: true,
            ticketNumber: true, // Sprint 17
            status: true,
            title: true,
            kind: true,
            priority: true,
          },
        },
        assignee: true,
        assigneeType: true,
        linkedSessionId: true, // Sprint 16: Session linkage
        epicRef: true,
        sprintNumber: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    // Transform to KanbanTicket type
    const tickets: KanbanTicket[] = rawTickets.map((t) => {
      // Calculate child progress for feature tickets
      let childProgress: number | undefined;
      if (t.childTickets && t.childTickets.length > 0) {
        const doneCount = t.childTickets.filter((c) => c.status === TICKET_STATUSES.DONE).length;
        childProgress = Math.round((doneCount / t.childTickets.length) * 100);
      }

      return {
        id: t.id,
        ticketNumber: t.ticketNumber, // Sprint 17
        title: t.title,
        status: t.status as TicketStatus,
        priority: t.priority,
        kind: t.kind,
        displayOrder: t.displayOrder,
        parentTicketId: t.parentTicketId,
        parentTicket: t.parentTicket
          ? {
              id: t.parentTicket.id,
              ticketNumber: t.parentTicket.ticketNumber, // Sprint 17
              title: t.parentTicket.title,
              status: t.parentTicket.status as TicketStatus,
            }
          : null,
        childTickets: t.childTickets?.map((c) => ({
          id: c.id,
          ticketNumber: c.ticketNumber, // Sprint 17
          status: c.status as TicketStatus,
          title: c.title,
          kind: c.kind,
          priority: c.priority,
        })),
        childProgress,
        assignee: t.assignee,
        assigneeType: t.assigneeType,
        linkedSessionId: t.linkedSessionId, // Sprint 16
        epicRef: t.epicRef,
        sprintNumber: t.sprintNumber,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      };
    });

    // Group tickets by status (column)
    const columns: Record<TicketStatus, KanbanTicket[]> = {
      [TICKET_STATUSES.BACKLOG]: [],
      [TICKET_STATUSES.TODO]: [],
      [TICKET_STATUSES.IN_PROGRESS]: [],
      [TICKET_STATUSES.IN_REVIEW]: [],
      [TICKET_STATUSES.DONE]: [],
    };

    for (const ticket of tickets) {
      const status = ticket.status as TicketStatus;
      if (columns[status]) {
        columns[status].push(ticket);
      } else {
        // Fallback to backlog for unknown status
        columns[TICKET_STATUSES.BACKLOG].push(ticket);
      }
    }

    // Get progress stats
    const progressStats = await getSprintProgressStats(prisma, sprintId);

    // Build column stats
    const columnStats: ColumnStats[] = TICKET_STATUS_VALUES.map((status) => ({
      status: status as TicketStatus,
      count: columns[status as TicketStatus]?.length ?? 0,
      label: TicketStatusSystem.getLabel(status),
      colorClass: TicketStatusSystem.getColorClass(status),
    }));

    // Build board stats
    const stats: BoardStats = {
      total: progressStats.total,
      done: progressStats.done,
      inProgress: progressStats.inProgress,
      blocked: 0, // Blocked status removed in Sprint 15
      progress: progressStats.progress,
      columns: columnStats,
    };

    // Build sprint context
    const sprintContext: SprintContext = {
      id: sprint.id,
      sprintNumber: sprint.sprintNumber,
      title: sprint.title,
      status: sprint.status,
      progress: sprint.progress,
      phase: {
        id: sprint.phase.id,
        title: sprint.phase.title,
      },
    };

    // Build response
    const response: KanbanBoardResponse = {
      sprint: sprintContext,
      columns,
      ghosts: [], // Ghost cards removed - children rendered independently
      stats,
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

    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to fetch kanban board'
    );
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch kanban board' },
      },
      { status: 500 }
    );
  }
}
