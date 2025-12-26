/**
 * Move Ticket API Route - Sprint 15 Phase B
 *
 * PATCH /api/tickets/[id]/move
 *
 * Moves a ticket to a new column (status) and/or position (displayOrder).
 * Handles reordering of other tickets in both source and target columns.
 * Triggers progress recalculation when status changes.
 *
 * Security (Sprint 10):
 * - All requests MUST be authenticated (user session OR agent token)
 * - Ticket's project must match authenticated context
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireProjectAccess, AuthError } from '@/lib/auth/validateRequest';
import { MoveTicketSchema } from '@/lib/validations/kanban';
import { calculateAndCascadeProgress } from '@/lib/tickets/progress-calculator';
import { TICKET_STATUSES, type TicketStatus } from '@/lib/constants/status';
import type { MoveTicketResponse, KanbanTicket } from '@/types/kanban';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const ticketId = parseInt(rawId, 10);

    if (isNaN(ticketId) || ticketId <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid ticket ID' } },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { status: newStatus, displayOrder: newDisplayOrder } = MoveTicketSchema.parse(body);

    // Fetch ticket to get current state and project ID
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        kind: true,
        displayOrder: true,
        projectId: true,
        sprintId: true,
        parentTicketId: true,
        assignee: true,
        assigneeType: true,
        epicRef: true,
        sprintNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } },
        { status: 404 }
      );
    }

    // Authenticate and validate project access
    await requireProjectAccess(request, ticket.projectId);

    const oldStatus = ticket.status;
    const oldDisplayOrder = ticket.displayOrder;
    const statusChanged = oldStatus !== newStatus;
    const sameColumn = !statusChanged;

    // Use transaction for atomic reordering
    const updatedTicket = await prisma.$transaction(async (tx) => {
      // Get sprint context for column queries
      const sprintId = ticket.sprintId;

      if (sprintId) {
        if (sameColumn) {
          // Same column: shift tickets between old and new positions
          if (newDisplayOrder < oldDisplayOrder) {
            // Moving up: shift items between new and old positions down
            await tx.ticket.updateMany({
              where: {
                sprintId,
                status: newStatus,
                displayOrder: { gte: newDisplayOrder, lt: oldDisplayOrder },
                id: { not: ticketId },
              },
              data: { displayOrder: { increment: 1 } },
            });
          } else if (newDisplayOrder > oldDisplayOrder) {
            // Moving down: shift items between old and new positions up
            await tx.ticket.updateMany({
              where: {
                sprintId,
                status: newStatus,
                displayOrder: { gt: oldDisplayOrder, lte: newDisplayOrder },
                id: { not: ticketId },
              },
              data: { displayOrder: { decrement: 1 } },
            });
          }
        } else {
          // Different column: handle source and target separately

          // 1. Source column: shift items after old position up
          await tx.ticket.updateMany({
            where: {
              sprintId,
              status: oldStatus,
              displayOrder: { gt: oldDisplayOrder },
            },
            data: { displayOrder: { decrement: 1 } },
          });

          // 2. Target column: shift items at and after new position down
          await tx.ticket.updateMany({
            where: {
              sprintId,
              status: newStatus,
              displayOrder: { gte: newDisplayOrder },
            },
            data: { displayOrder: { increment: 1 } },
          });
        }
      }

      // 3. Update the moved ticket
      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: newStatus,
          displayOrder: newDisplayOrder,
          // Set closedAt when moving to done
          ...(newStatus === TICKET_STATUSES.DONE && oldStatus !== TICKET_STATUSES.DONE
            ? { closedAt: new Date() }
            : {}),
          // Clear closedAt when moving out of done
          ...(oldStatus === TICKET_STATUSES.DONE && newStatus !== TICKET_STATUSES.DONE
            ? { closedAt: null }
            : {}),
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          kind: true,
          displayOrder: true,
          parentTicketId: true,
          parentTicket: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          childTickets: {
            select: {
              id: true,
              status: true,
            },
          },
          assignee: true,
          assigneeType: true,
          epicRef: true,
          sprintNumber: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updated;
    });

    // Calculate progress cascade if status changed
    let progressUpdates: MoveTicketResponse['progressUpdates'];
    if (statusChanged) {
      const progressResult = await calculateAndCascadeProgress(prisma, ticketId);
      progressUpdates = {
        ticketId,
        parentProgress: progressResult.parentProgress,
        sprintProgress: progressResult.sprintProgress,
        phaseProgress: progressResult.phaseProgress,
      };
    }

    // Revalidate cache
    revalidatePath('/tickets');
    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath('/issues');
    revalidatePath(`/issues/${ticketId}`);

    // Transform to KanbanTicket
    const kanbanTicket: KanbanTicket = {
      id: updatedTicket.id,
      title: updatedTicket.title,
      status: updatedTicket.status as TicketStatus,
      priority: updatedTicket.priority,
      kind: updatedTicket.kind,
      displayOrder: updatedTicket.displayOrder,
      parentTicketId: updatedTicket.parentTicketId,
      parentTicket: updatedTicket.parentTicket
        ? {
            id: updatedTicket.parentTicket.id,
            title: updatedTicket.parentTicket.title,
            status: updatedTicket.parentTicket.status as TicketStatus,
          }
        : null,
      childTickets: updatedTicket.childTickets?.map((c) => ({
        id: c.id,
        status: c.status as TicketStatus,
      })),
      assignee: updatedTicket.assignee,
      assigneeType: updatedTicket.assigneeType,
      epicRef: updatedTicket.epicRef,
      sprintNumber: updatedTicket.sprintNumber,
      createdAt: updatedTicket.createdAt.toISOString(),
      updatedAt: updatedTicket.updatedAt.toISOString(),
    };

    const response: MoveTicketResponse = {
      success: true,
      ticket: kanbanTicket,
      progressUpdates,
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
            message: 'Invalid move request',
            details: error.errors.map((e) => ({ path: e.path, message: e.message })),
          },
        },
        { status: 400 }
      );
    }

    console.error('[PATCH /api/tickets/[id]/move] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to move ticket' } },
      { status: 500 }
    );
  }
}
