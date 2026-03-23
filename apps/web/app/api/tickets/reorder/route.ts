/**
 * Bulk Reorder Tickets API Route - Sprint 15 Phase B
 *
 * PATCH /api/tickets/reorder
 *
 * Reorders multiple tickets at once for optimistic UI updates.
 * Used when dragging multiple tickets or syncing client state.
 *
 * Security (Sprint 10):
 * - All requests MUST be authenticated (user session OR agent token)
 * - All tickets must belong to the same project
 * - Project must match authenticated context
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { requireProjectAccess, AuthError } from '@/lib/auth/validateRequest';
import { BulkReorderSchema } from '@/lib/validations/kanban';
import { calculateAndCascadeProgress } from '@/lib/tickets/progress-calculator';
import { TICKET_STATUSES, type TicketStatus } from '@/lib/constants/status';
import type { BulkReorderResponse } from '@/types/kanban';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    // Parse and validate request body
    const body = await request.json();
    const { moves } = BulkReorderSchema.parse(body);

    if (moves.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'EMPTY_REQUEST', message: 'No moves provided' } },
        { status: 400 }
      );
    }

    const ticketIds = moves.map((m) => m.ticketId);

    // Fetch all tickets to verify they exist and get project IDs
    const tickets = await prisma.ticket.findMany({
      where: { id: { in: ticketIds } },
      select: { id: true, status: true, projectId: true },
    });

    // Verify all tickets exist
    const foundIds = new Set(tickets.map((t) => t.id));
    const missingIds = ticketIds.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Tickets not found: ${missingIds.join(', ')}`,
          },
        },
        { status: 404 }
      );
    }

    // Verify all tickets belong to the same project
    const projectIds = new Set(tickets.map((t) => t.projectId));
    if (projectIds.size > 1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CROSS_PROJECT',
            message: 'Cannot reorder tickets from different projects',
          },
        },
        { status: 400 }
      );
    }

    const projectId = tickets[0]!.projectId;

    // Authenticate and validate project access
    await requireProjectAccess(request, projectId);

    // Build a map of old statuses for change detection
    const oldStatusMap = new Map(tickets.map((t) => [t.id, t.status]));

    // Identify tickets with status changes for progress recalculation
    const statusChangedTicketIds: number[] = [];

    // Apply all updates in a transaction
    const results = await prisma.$transaction(async (tx) => {
      const updated: Array<{ id: number; status: TicketStatus; displayOrder: number }> = [];

      for (const move of moves) {
        const oldStatus = oldStatusMap.get(move.ticketId);
        const statusChanged = oldStatus !== move.status;

        if (statusChanged) {
          statusChangedTicketIds.push(move.ticketId);
        }

        const ticket = await tx.ticket.update({
          where: { id: move.ticketId },
          data: {
            status: move.status,
            displayOrder: move.displayOrder,
            // Set closedAt when moving to done
            ...(move.status === TICKET_STATUSES.DONE && oldStatus !== TICKET_STATUSES.DONE
              ? { closedAt: new Date() }
              : {}),
            // Clear closedAt when moving out of done
            ...(oldStatus === TICKET_STATUSES.DONE && move.status !== TICKET_STATUSES.DONE
              ? { closedAt: null }
              : {}),
          },
          select: {
            id: true,
            status: true,
            displayOrder: true,
          },
        });

        updated.push({
          id: ticket.id,
          status: ticket.status as TicketStatus,
          displayOrder: ticket.displayOrder,
        });
      }

      return updated;
    });

    // Trigger progress recalculation for tickets with status changes
    // Note: This is done outside the transaction to avoid long transaction times
    for (const ticketId of statusChangedTicketIds) {
      await calculateAndCascadeProgress(prisma, ticketId);
    }

    // Revalidate cache
    revalidatePath('/tickets');
    revalidatePath('/issues');

    const response: BulkReorderResponse = {
      success: true,
      updated: results.length,
      tickets: results,
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
            message: 'Invalid reorder request',
            details: error.errors.map((e) => ({ path: e.path, message: e.message })),
          },
        },
        { status: 400 }
      );
    }

    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to reorder tickets'
    );
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reorder tickets' } },
      { status: 500 }
    );
  }
}
