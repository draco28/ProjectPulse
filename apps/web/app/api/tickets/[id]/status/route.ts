/**
 * Ticket Status Update API Route (Sprint 10)
 *
 * PATCH /api/tickets/[id]/status - Update ticket status
 *
 * Security (Sprint 10):
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { TicketIdParamSchema, TicketStatusUpdateSchema } from '@/lib/validations/ticket';
import { failure, success } from '../../_utils';
import { resolveStatusValue } from '@/lib/issues/options';
import { requireProjectAccess, AuthError } from '@/lib/auth/validateRequest';
import { revalidatePath } from 'next/cache';
import { TICKET_STATUSES } from '@/lib/constants/status';
import { calculateAndCascadeProgress } from '@/lib/tickets/progress-calculator';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const { id: rawId } = await context.params;
    const { id } = TicketIdParamSchema.parse({ id: rawId });
    const payload = await request.json();
    const { status: rawStatus } = TicketStatusUpdateSchema.parse(payload);

    // Check ticket exists and get projectId for auth
    const existing = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, status: true, projectId: true, sprintId: true },
    });

    if (!existing) {
      return failure({
        code: 'NOT_FOUND',
        message: `Ticket ${id} not found`,
        status: 404,
      });
    }

    // Sprint 10: Validate project access
    await requireProjectAccess(request, existing.projectId);

    const status = await resolveStatusValue(rawStatus);
    // Sprint 15: Use status constant for completion check
    const isClosing = status !== existing.status && status === TICKET_STATUSES.DONE;

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        status,
        ...(isClosing && { closedAt: new Date() }),
      },
      select: {
        id: true,
        title: true,
        status: true,
        kind: true,
        closedAt: true,
        updatedAt: true,
      },
    });

    // Sprint 15: Cascade progress updates when status changes
    if (existing.sprintId && status !== existing.status) {
      await calculateAndCascadeProgress(prisma, id);
    }

    revalidatePath('/tickets');
    revalidatePath(`/tickets/${id}`);
    revalidatePath('/issues');
    revalidatePath(`/issues/${id}`);

    return success(ticket);
  } catch (error) {
    // Sprint 10: Handle auth errors first
    if (error instanceof AuthError) {
      return failure({ code: error.code, message: error.message, status: error.status });
    }

    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid status update',
        details: error.flatten(),
      });
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to update ticket status');
    return failure({
      code: 'INTERNAL_ERROR',
      message: 'Failed to update ticket status',
      status: 500,
    });
  }
}
