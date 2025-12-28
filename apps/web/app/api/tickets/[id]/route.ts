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
import { failure, success, ticketIncludeConfig, computeDisplayIdForSingleTicket } from '../_utils';
import { resolveModuleValue, resolvePriorityValue, resolveStatusValue } from '@/lib/issues/options';
import { requireProjectAccess, AuthError } from '@/lib/auth/validateRequest';
import { validateAndSetParent, TicketHierarchyError } from '@/lib/tickets/hierarchy';
import { resolveSprintByNumber } from '@/lib/sprints/resolution';
import { revalidatePath } from 'next/cache';
import { TICKET_STATUSES } from '@/lib/constants/status';
import { calculateAndCascadeProgress } from '@/lib/tickets/progress-calculator';

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
          select: {
            id: true,
            filename: true,
            filepath: true,
            mimetype: true,
            size: true,
            uploadedAt: true,
          },
        },
        linkedFiles: {
          select: { id: true, filePath: true, lineNumber: true, createdAt: true },
        },
        linkedCommits: {
          select: {
            id: true,
            commitHash: true,
            commitMessage: true,
            commitDate: true,
            createdAt: true,
          },
        },
        // Sprint 15: scheduledWeek removed (Week model deleted - Ticket #80)
        // Tickets now include sprint directly via sprintId FK
        sprint: {
          select: {
            id: true,
            title: true,
            sprintNumber: true,
            phase: {
              select: { id: true, title: true },
            },
          },
        },
        project: {
          select: { id: true, name: true },
        },
        // Sprint 13: Include hierarchy (parent + children)
        parentTicket: {
          select: { id: true, title: true, kind: true, status: true },
        },
        childTickets: {
          select: { id: true, title: true, kind: true, status: true },
          orderBy: { createdAt: 'asc' },
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

    // Sprint 14: Compute displayId for hierarchical display
    const displayId = await computeDisplayIdForSingleTicket(prisma, ticket);

    // Add displayId to child tickets as well
    const childTicketsWithDisplayId = ticket.childTickets?.map((child, index) => ({
      ...child,
      displayId: `${ticket.id}.${index + 1}`,
    }));

    return success({
      ...ticket,
      displayId,
      childTickets: childTicketsWithDisplayId,
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
    // Sprint 11.7: Also fetch customFields for implementationContext merging
    // Sprint 13: Also fetch kind for hierarchy validation
    const existing = await prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        projectId: true,
        customFields: true,
        kind: true,
        parentTicketId: true,
        // Sprint 15: Include sprint fields for FK resolution and progress cascade
        sprintNumber: true,
        sprintId: true,
      },
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

    // Resolve option values with proper error handling
    let status: string | undefined;
    let priority: string | undefined;
    let ticketModule: string | undefined;

    try {
      status = data.status ? await resolveStatusValue(data.status) : undefined;
    } catch (error) {
      return failure({
        code: 'INVALID_STATUS',
        message: error instanceof Error ? error.message : 'Invalid status value',
        status: 400,
      });
    }

    try {
      priority = data.priority ? await resolvePriorityValue(data.priority) : undefined;
    } catch (error) {
      return failure({
        code: 'INVALID_PRIORITY',
        message: error instanceof Error ? error.message : 'Invalid priority value',
        status: 400,
      });
    }

    try {
      ticketModule = data.module ? await resolveModuleValue(data.module) : undefined;
    } catch (error) {
      return failure({
        code: 'INVALID_MODULE',
        message: error instanceof Error ? error.message : 'Invalid module value',
        status: 400,
      });
    }

    // Handle label updates
    let labelConnect: { id: number }[] | undefined;
    let labelSet: { id: number }[] | undefined;

    if (data.labelIds !== undefined) {
      if (data.labelIds.length > 0) {
        // Sprint 11.7: Validate labels belong to same project
        const existingLabels = await prisma.label.findMany({
          where: { id: { in: data.labelIds }, projectId: existing.projectId },
          select: { id: true },
        });
        if (existingLabels.length !== data.labelIds.length) {
          return failure({
            code: 'INVALID_LABEL',
            message: 'One or more labels do not exist or belong to a different project',
            status: 400,
          });
        }
        labelSet = data.labelIds.map((labelId) => ({ id: labelId }));
      } else {
        labelSet = [];
      }
    }

    // Sprint 12: linkedTaskId removed - tickets now schedule to weeks via scheduledWeekId

    // Sprint 13: Validate parent ticket if being changed
    // Use the final kind (updated or existing) for validation
    const effectiveKind = data.kind ?? existing.kind;
    if (data.parentTicketId !== undefined && data.parentTicketId !== null) {
      // Parent is being set or changed (not removed)
      await validateAndSetParent(
        prisma,
        id, // Current ticket ID for circular reference check
        data.parentTicketId,
        existing.projectId,
        effectiveKind
      );
    }

    // Sprint 15: Resolve sprintId from sprintNumber when sprintNumber changes
    let resolvedSprintId: string | null | undefined = undefined; // undefined = no change
    const newSprintNumber = data.sprintNumber;
    const sprintNumberChanged = newSprintNumber !== undefined && newSprintNumber !== existing.sprintNumber;

    if (sprintNumberChanged) {
      if (newSprintNumber === null) {
        // Clearing sprintNumber → also clear sprintId
        resolvedSprintId = null;
      } else if (!data.sprintId) {
        // sprintNumber set/changed → resolve sprintId from roadmap hierarchy
        // Ticket #91: Use helper with deterministic ordering (global numbering)
        resolvedSprintId = await resolveSprintByNumber(
          prisma,
          existing.projectId,
          newSprintNumber
        );
      }
    }

    // If sprintId is explicitly provided, use it
    if (data.sprintId !== undefined) {
      resolvedSprintId = data.sprintId;
    }

    // Sprint 15: Determine if closing ticket using status constant
    const isClosing =
      status && status !== existing.status && status === TICKET_STATUSES.DONE;

    // Sprint 15: Detect status changes for progress cascade
    const statusChanged = status && status !== existing.status;

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
    // Sprint 12: linkedTask removed - use scheduledWeekId/scheduledDays for roadmap association
    // Sprint 11.7: Handle customFields and implementationContext
    // Implementation context is stored in customFields._implementationContext
    if (data.customFields || data.implementationContext !== undefined) {
      const existingCustomFields = (existing.customFields as Record<string, unknown>) ?? {};
      let newCustomFields = { ...existingCustomFields };

      // Merge any direct customFields updates
      if (data.customFields) {
        newCustomFields = { ...newCustomFields, ...data.customFields };
      }

      // Handle implementationContext specially
      if (data.implementationContext !== undefined) {
        if (data.implementationContext === null) {
          // Explicitly remove implementation context
          delete newCustomFields._implementationContext;
        } else {
          newCustomFields._implementationContext = data.implementationContext;
        }
      }

      updateData.customFields = newCustomFields as Prisma.InputJsonValue;
    }
    if (labelSet !== undefined) updateData.labels = { set: labelSet };
    if (isClosing) updateData.closedAt = new Date();
    // Sprint 13: Hierarchy and traceability fields
    if (data.parentTicketId !== undefined) updateData.parentTicketId = data.parentTicketId;
    if (data.epicRef !== undefined) updateData.epicRef = data.epicRef;
    if (data.backlogRefs !== undefined) updateData.backlogRefs = data.backlogRefs;
    if (data.sprintNumber !== undefined) updateData.sprintNumber = data.sprintNumber;
    // Sprint 15: Set resolved sprintId (FK to Sprint for progress calculation)
    if (resolvedSprintId !== undefined) updateData.sprintId = resolvedSprintId;
    // Sprint 15: scheduledWeekId/scheduledDays removed (Week model deleted - Ticket #80)
    // Tickets now link to Sprint via sprintId FK for Kanban board
    if (data.estimatedDays !== undefined) updateData.estimatedDays = data.estimatedDays;

    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: ticketIncludeConfig(true),
    });

    // Sprint 15: Trigger progress cascade when status changes
    // This updates parent ticket, sprint, and phase progress automatically
    if (statusChanged) {
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

    // Sprint 13: Handle hierarchy validation errors
    if (error instanceof TicketHierarchyError) {
      return failure({
        code: error.code,
        message: error.message,
        status: 400,
      });
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
