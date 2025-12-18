/**
 * Ticket Hierarchy API Route (Sprint 13)
 *
 * GET /api/tickets/[id]/hierarchy - Get complete hierarchy context for a ticket
 *
 * Returns:
 * - The ticket itself
 * - Its parent (if any)
 * - All its direct children (if any)
 * - Status summary of children
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { TicketIdParamSchema } from '@/lib/validations/ticket';
import { failure, success } from '../../_utils';
import { requireProjectAccess, AuthError } from '@/lib/auth/validateRequest';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const { id } = TicketIdParamSchema.parse({ id: rawId });

    // Fetch ticket with full hierarchy context in a single query
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        // Full ticket details
        labels: {
          select: { id: true, name: true, color: true },
        },
        project: {
          select: { id: true, name: true },
        },
        // Parent context (if this is a child ticket)
        parentTicket: {
          select: {
            id: true,
            title: true,
            kind: true,
            status: true,
            priority: true,
            epicRef: true,
            sprintNumber: true,
            // Also get siblings count for context
            _count: {
              select: { childTickets: true },
            },
          },
        },
        // Children (if this is a parent/feature ticket)
        childTickets: {
          select: {
            id: true,
            title: true,
            kind: true,
            status: true,
            priority: true,
            assignee: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return failure({
        code: 'NOT_FOUND',
        message: `Ticket ${id} not found`,
        status: 404,
      });
    }

    // Validate project access
    await requireProjectAccess(request, ticket.project.id);

    // Calculate children status summary
    const childrenStatusCounts = ticket.childTickets.reduce(
      (acc, child) => {
        acc[child.status] = (acc[child.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get sibling tickets if this is a child ticket
    let siblings: Array<{ id: number; title: string; kind: string; status: string }> = [];
    if (ticket.parentTicketId) {
      siblings = await prisma.ticket.findMany({
        where: {
          parentTicketId: ticket.parentTicketId,
          id: { not: ticket.id }, // Exclude self
        },
        select: {
          id: true,
          title: true,
          kind: true,
          status: true,
        },
        orderBy: { createdAt: 'asc' },
        take: 10, // Limit siblings to prevent bloat
      });
    }

    // Build hierarchy response
    const response = {
      ticket: {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        kind: ticket.kind,
        status: ticket.status,
        priority: ticket.priority,
        assignee: ticket.assignee,
        epicRef: ticket.epicRef,
        backlogRefs: ticket.backlogRefs,
        sprintNumber: ticket.sprintNumber,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        labels: ticket.labels,
        project: ticket.project,
      },
      hierarchy: {
        // Parent info (null if top-level)
        parent: ticket.parentTicket
          ? {
              id: ticket.parentTicket.id,
              title: ticket.parentTicket.title,
              kind: ticket.parentTicket.kind,
              status: ticket.parentTicket.status,
              priority: ticket.parentTicket.priority,
              epicRef: ticket.parentTicket.epicRef,
              sprintNumber: ticket.parentTicket.sprintNumber,
              totalChildren: ticket.parentTicket._count.childTickets,
            }
          : null,
        // Children info (empty if leaf node)
        children: ticket.childTickets,
        childrenCount: ticket.childTickets.length,
        childrenStatusCounts,
        // Siblings (only if this ticket has a parent)
        siblings: siblings,
        siblingsCount: ticket.parentTicket
          ? ticket.parentTicket._count.childTickets - 1 // Exclude self
          : 0,
      },
      // Quick access booleans for UI logic
      isRoot: ticket.parentTicketId === null,
      isLeaf: ticket.childTickets.length === 0,
      canHaveChildren: ticket.kind === 'feature',
      canHaveParent: ['task', 'issue', 'bug', 'tech_debt'].includes(ticket.kind),
    };

    return success(response);
  } catch (error) {
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

    console.error('[API] GET /api/tickets/[id]/hierarchy failed', error);
    return failure({ code: 'INTERNAL_ERROR', message: 'Failed to fetch hierarchy', status: 500 });
  }
}
