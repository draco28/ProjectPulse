/**
 * Ticket Children API Route (Sprint 13)
 *
 * GET /api/tickets/[id]/children - Get paginated children of a feature ticket
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
import { canHaveChildren } from '@/lib/tickets/hierarchy';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const ChildrenQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const { id } = TicketIdParamSchema.parse({ id: rawId });

    // Parse query params
    const url = new URL(request.url);
    const queryParams = ChildrenQuerySchema.parse({
      status: url.searchParams.get('status') ?? undefined,
      page: url.searchParams.get('page') ?? 1,
      pageSize: url.searchParams.get('pageSize') ?? 20,
    });

    // Fetch parent ticket to verify it exists and can have children
    const parentTicket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, projectId: true, kind: true, title: true },
    });

    if (!parentTicket) {
      return failure({
        code: 'NOT_FOUND',
        message: `Ticket ${id} not found`,
        status: 404,
      });
    }

    // Validate project access
    await requireProjectAccess(request, parentTicket.projectId);

    // Check if this ticket can have children
    if (!canHaveChildren(parentTicket.kind)) {
      return failure({
        code: 'INVALID_PARENT',
        message: `Tickets of kind '${parentTicket.kind}' cannot have children. Only 'feature' tickets can have children.`,
        status: 400,
      });
    }

    // Build where clause for children
    const where: { parentTicketId: number; status?: string } = {
      parentTicketId: id,
    };

    if (queryParams.status) {
      where.status = queryParams.status;
    }

    // Fetch children with pagination
    const [children, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (queryParams.page - 1) * queryParams.pageSize,
        take: queryParams.pageSize,
        select: {
          id: true,
          title: true,
          kind: true,
          status: true,
          priority: true,
          assignee: true,
          createdAt: true,
          updatedAt: true,
          labels: {
            select: { id: true, name: true, color: true },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    // Calculate status summary for quick overview
    const statusSummary = await prisma.ticket.groupBy({
      by: ['status'],
      where: { parentTicketId: id },
      _count: { status: true },
    });

    const statusCounts = statusSummary.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {} as Record<string, number>
    );

    return success({
      parent: {
        id: parentTicket.id,
        title: parentTicket.title,
        kind: parentTicket.kind,
      },
      children,
      totalCount,
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      totalPages: Math.ceil(totalCount / queryParams.pageSize),
      statusCounts,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return failure({ code: error.code, message: error.message, status: error.status });
    }

    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid parameters',
        details: error.flatten(),
      });
    }

    console.error('[API] GET /api/tickets/[id]/children failed', error);
    return failure({ code: 'INTERNAL_ERROR', message: 'Failed to fetch children', status: 500 });
  }
}
