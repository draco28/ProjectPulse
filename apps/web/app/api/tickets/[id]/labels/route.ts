/**
 * Ticket Labels Management API (Sprint 11.7 - Labels Feature)
 *
 * Manage labels on a specific ticket.
 * - PATCH: Add, remove, or set labels on a ticket
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation
 * - Uses requireProjectAccess for defense-in-depth
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectAccess, AuthError, authErrorResponse } from '@/lib/auth/validateRequest';
import { TicketLabelManageSchema } from '@/lib/validations/label';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PATCH /api/tickets/[id]/labels
 *
 * Add, remove, or set labels on a ticket.
 *
 * Request body:
 * {
 *   labelIds: [1, 2, 3],
 *   action: 'add' | 'remove' | 'set'
 * }
 *
 * Actions:
 * - 'add': Add labels to existing labels (ignores duplicates)
 * - 'remove': Remove specified labels from ticket
 * - 'set': Replace all labels with the specified ones
 *
 * Auth: User session OR Agent token (project-scoped)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const ticketId = parseInt(id, 10);

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }

    // Get ticket to find its project
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        projectId: true,
        labels: { select: { id: true } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // SECURITY: Validate authentication AND project access
    await requireProjectAccess(request, ticket.projectId);

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validationResult = TicketLabelManageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { labelIds, action } = validationResult.data;

    // Validate that all provided labels belong to the same project
    const validLabels = await prisma.label.findMany({
      where: {
        id: { in: labelIds },
        projectId: ticket.projectId,
      },
      select: { id: true },
    });

    const validLabelIds = new Set(validLabels.map((l) => l.id));
    const invalidLabelIds = labelIds.filter((id) => !validLabelIds.has(id));

    if (invalidLabelIds.length > 0) {
      return NextResponse.json(
        {
          error: `Labels not found or not in this project: ${invalidLabelIds.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Build the update operation based on action
    let updateOperation: {
      labels:
        | { connect: { id: number }[] }
        | { disconnect: { id: number }[] }
        | { set: { id: number }[] };
    };

    switch (action) {
      case 'add':
        updateOperation = {
          labels: {
            connect: labelIds.map((id) => ({ id })),
          },
        };
        break;
      case 'remove':
        updateOperation = {
          labels: {
            disconnect: labelIds.map((id) => ({ id })),
          },
        };
        break;
      case 'set':
        updateOperation = {
          labels: {
            set: labelIds.map((id) => ({ id })),
          },
        };
        break;
    }

    // Update ticket labels
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateOperation,
      select: {
        id: true,
        labels: {
          select: {
            id: true,
            name: true,
            color: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    return NextResponse.json(
      {
        ticketId: updatedTicket.id,
        labels: updatedTicket.labels,
        action,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }

    console.error('PATCH /api/tickets/[id]/labels error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
