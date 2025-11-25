/**
 * Ticket Status Update API Route (Sprint 10)
 *
 * PATCH /api/tickets/[id]/status - Update ticket status
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { TicketIdParamSchema, TicketStatusUpdateSchema } from '@/lib/validations/ticket';
import { failure, success } from '../../_utils';
import { resolveStatusValue } from '@/lib/issues/options';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const { id } = TicketIdParamSchema.parse({ id: rawId });
    const payload = await request.json();
    const { status: rawStatus } = TicketStatusUpdateSchema.parse(payload);

    // Check ticket exists
    const existing = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return failure({
        code: 'NOT_FOUND',
        message: `Ticket ${id} not found`,
        status: 404,
      });
    }

    const status = await resolveStatusValue(rawStatus);
    const isClosing = status !== existing.status && (status === 'closed' || status === 'resolved');

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

    revalidatePath('/tickets');
    revalidatePath(`/tickets/${id}`);
    revalidatePath('/issues');
    revalidatePath(`/issues/${id}`);

    return success(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid status update',
        details: error.flatten(),
      });
    }

    console.error('[API] PATCH /api/tickets/[id]/status failed', error);
    return failure({ code: 'INTERNAL_ERROR', message: 'Failed to update ticket status', status: 500 });
  }
}
