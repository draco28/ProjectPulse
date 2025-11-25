/**
 * Issue Status Update API Route (Sprint 10 - Backwards Compatible Wrapper)
 *
 * PATCH /api/issues/[id]/status - Update issue/ticket status
 *
 * Request body:
 * - status: 'open' | 'in_progress' | 'closed' (required)
 *
 * Response format:
 * - Success: { data: Ticket, error: null }
 * - Validation Error (400): { data: null, error: string, details: ZodError[] }
 * - Not Found (404): { data: null, error: string }
 * - Server Error (500): { data: null, error: string }
 *
 * Side effects:
 * - Sets closedAt timestamp when status changes to 'closed'
 * - Clears closedAt when status changes from 'closed' to other status
 * - Revalidates both /issues and /tickets pages
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { StatusUpdateSchema } from '@/lib/validations/issue';
import { TicketIdParamSchema } from '@/lib/validations/ticket';
import { resolveStatusValue } from '@/lib/issues/options';
import { failure, success } from '../../../tickets/_utils';
import { z } from 'zod';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const { id } = TicketIdParamSchema.parse({ id: rawId });

    // 2. Parse and validate request body
    const body = await request.json();
    const { status: requestedStatus } = StatusUpdateSchema.parse(body);
    const status = await resolveStatusValue(requestedStatus);

    // 3. Update ticket status in database
    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        status,
        // Set closedAt timestamp when closing, clear it when reopening
        closedAt: status === 'closed' ? new Date() : null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        module: true,
        assignee: true,
        createdAt: true,
        updatedAt: true,
        closedAt: true,
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
    });

    // 4. Revalidate both list and detail pages
    revalidatePath('/issues');
    revalidatePath(`/issues/${id}`);
    revalidatePath('/tickets');
    revalidatePath(`/tickets/${id}`);

    return success(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid status value',
        details: error.flatten(),
      });
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return failure({ code: 'NOT_FOUND', message: 'Issue not found', status: 404 });
    }

    console.error('[API] PATCH /api/issues/[id]/status failed', error);
    return failure({
      code: 'INTERNAL_ERROR',
      message: 'Failed to update issue status',
      status: 500,
    });
  }
}
