/**
 * Single Ticket API Route (Sprint 10)
 *
 * GET /api/tickets/[id] - Get a single ticket by ID
 * PATCH /api/tickets/[id] - Update a ticket
 * DELETE /api/tickets/[id] - Delete a ticket
 *
 * Security (Sprint 10):
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { TicketIdParamSchema, UpdateTicketSchema } from '@/lib/validations/ticket';
import { failure, success, ticketIncludeConfig } from '../_utils';
import { resolveModuleValue, resolvePriorityValue, resolveStatusValue } from '@/lib/issues/options';
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

    // First fetch ticket to get projectId for auth check
    const ticketForAuth = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, projectId: true },
    });

    if (!ticketForAuth) {
      return failure({
        code: 'NOT_FOUND',
        message: `Ticket ${id} not found`,
        status: 404,
      });
    }

    // Sprint 10: Validate project access
    await requireProjectAccess(request, ticketForAuth.projectId);

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        labels: {
          select: { id: true, name: true, color: true },
        },
        comments: {
          select: { id: true, content: true, author: true, createdAt: true, updatedAt: true },
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          select: { id: true, filename: true, filepath: true, mimetype: true, size: true, uploadedAt: true },
        },
        linkedFiles: {
          select: { id: true, filePath: true, lineNumber: true, createdAt: true },
        },
        linkedCommits: {
          select: { id: true, commitHash: true, commitMessage: true, commitDate: true, createdAt: true },
        },
        linkedTask: {
          select: {
            id: true,
            title: true,
            status: true,
            day: {
              select: {
                id: true,
                title: true,
                week: {
                  select: {
                    id: true,
                    title: true,
                    sprint: {
                      select: {
                        id: true,
                        title: true,
                        phase: {
                          select: { id: true, title: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });

    // This should not happen since we checked above, but just in case
    if (!ticket) {
      return failure({
        code: 'NOT_FOUND',
        message: `Ticket ${id} not found`,
        status: 404,
      });
    }

    return success(ticket);
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

    console.error('[API] GET /api/tickets/[id] failed', error);
    return failure({ code: 'INTERNAL_ERROR', message: 'Failed to fetch ticket', status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const { id } = TicketIdParamSchema.parse({ id: rawId });
    const payload = await request.json();
    const data = UpdateTicketSchema.parse(payload);

    // Check ticket exists and get projectId for auth
    const existing = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, status: true, projectId: true },
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

    // Resolve option values
    const status = data.status ? await resolveStatusValue(data.status) : undefined;
    const priority = data.priority ? await resolvePriorityValue(data.priority) : undefined;
    const ticketModule = data.module ? await resolveModuleValue(data.module) : undefined;

    // Handle label updates
    let labelConnect: { id: number }[] | undefined;
    let labelSet: { id: number }[] | undefined;

    if (data.labelIds !== undefined) {
      if (data.labelIds.length > 0) {
        const existingLabels = await prisma.label.findMany({
          where: { id: { in: data.labelIds } },
          select: { id: true },
        });
        if (existingLabels.length !== data.labelIds.length) {
          return failure({
            code: 'INVALID_LABEL',
            message: 'One or more labels do not exist',
            status: 400,
          });
        }
        labelSet = data.labelIds.map((labelId) => ({ id: labelId }));
      } else {
        labelSet = [];
      }
    }

    // Validate linkedTaskId if provided
    if (data.linkedTaskId) {
      const task = await prisma.task.findUnique({
        where: { id: data.linkedTaskId },
        select: { id: true },
      });
      if (!task) {
        return failure({
          code: 'INVALID_LINKED_TASK',
          message: `Task ${data.linkedTaskId} not found`,
          status: 400,
        });
      }
    }

    // Determine if closing ticket
    const isClosing = status && status !== existing.status && (status === 'closed' || status === 'resolved');

    // Build update data object explicitly
    const updateData: Parameters<typeof prisma.ticket.update>[0]['data'] = {};
    
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (ticketModule !== undefined) updateData.module = ticketModule;
    if (data.assignee !== undefined) updateData.assignee = data.assignee;
    if (data.kind) updateData.kind = data.kind;
    if (data.source) updateData.source = data.source;
    if (data.assigneeType !== undefined) updateData.assigneeType = data.assigneeType;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.linkedTaskId !== undefined) updateData.linkedTask = data.linkedTaskId ? { connect: { id: data.linkedTaskId } } : { disconnect: true };
    if (data.customFields) updateData.customFields = data.customFields as Prisma.InputJsonValue;
    if (labelSet !== undefined) updateData.labels = { set: labelSet };
    if (isClosing) updateData.closedAt = new Date();

    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: ticketIncludeConfig(true),
    });

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
        message: 'Invalid update payload',
        details: error.flatten(),
      });
    }

    console.error('[API] PATCH /api/tickets/[id] failed', error);
    return failure({ code: 'INTERNAL_ERROR', message: 'Failed to update ticket', status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const { id } = TicketIdParamSchema.parse({ id: rawId });

    // Check ticket exists and get projectId for auth
    const existing = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, projectId: true },
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

    await prisma.ticket.delete({
      where: { id },
    });

    revalidatePath('/tickets');
    revalidatePath('/issues');

    return success({ deleted: true, id });
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

    console.error('[API] DELETE /api/tickets/[id] failed', error);
    return failure({ code: 'INTERNAL_ERROR', message: 'Failed to delete ticket', status: 500 });
  }
}
