/**
 * Ticket Comments API Route (Sprint 10)
 *
 * GET /api/tickets/[id]/comments - List comments for a ticket
 * POST /api/tickets/[id]/comments - Add a comment to a ticket
 *
 * Security (Sprint 10):
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { TicketIdParamSchema, TicketCommentSchema } from '@/lib/validations/ticket';
import { failure, success } from '../../_utils';
import { requireProjectAccess, AuthError } from '@/lib/auth/validateRequest';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const { id } = TicketIdParamSchema.parse({ id: rawId });

    // Check ticket exists and get projectId for auth
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, projectId: true },
    });

    if (!ticket) {
      return failure({
        code: 'NOT_FOUND',
        message: `Ticket ${id} not found`,
        status: 404,
      });
    }

    // Sprint 10: Validate project access
    await requireProjectAccess(request, ticket.projectId);

    const comments = await prisma.ticketComment.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        author: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return success({
      comments,
      ticketId: id,
      count: comments.length,
    });
  } catch (error) {
    // Sprint 10: Handle auth errors first
    if (error instanceof AuthError) {
      return failure({ code: error.code, message: error.message, status: error.status });
    }
    
    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid ticket ID',
        details: error.flatten(),
      });
    }

    console.error('[API] GET /api/tickets/[id]/comments failed', error);
    return failure({ code: 'INTERNAL_ERROR', message: 'Failed to fetch comments', status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const { id } = TicketIdParamSchema.parse({ id: rawId });
    const payload = await request.json();
    const data = TicketCommentSchema.parse(payload);

    // Check ticket exists and get projectId for auth
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, projectId: true },
    });

    if (!ticket) {
      return failure({
        code: 'NOT_FOUND',
        message: `Ticket ${id} not found`,
        status: 404,
      });
    }

    // Sprint 10: Validate project access
    await requireProjectAccess(request, ticket.projectId);

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: id,
        content: data.content,
        author: data.author ?? 'Anonymous',
      },
      select: {
        id: true,
        content: true,
        author: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath(`/tickets/${id}`);
    revalidatePath(`/issues/${id}`);

    return success(comment, 201);
  } catch (error) {
    // Sprint 10: Handle auth errors first
    if (error instanceof AuthError) {
      return failure({ code: error.code, message: error.message, status: error.status });
    }
    
    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid comment payload',
        details: error.flatten(),
      });
    }

    console.error('[API] POST /api/tickets/[id]/comments failed', error);
    return failure({ code: 'INTERNAL_ERROR', message: 'Failed to add comment', status: 500 });
  }
}
