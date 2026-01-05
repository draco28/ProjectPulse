/**
 * Agent Session Detail API Routes
 *
 * Sprint 12: Single session CRUD operations
 *
 * GET    /api/agent-sessions/[id] - Get session details
 * PATCH  /api/agent-sessions/[id] - Update session
 * DELETE /api/agent-sessions/[id] - Delete session
 *
 * Security (Sprint 12):
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation via session's projectId
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { UpdateAgentSessionSchema } from '@/lib/validations/agent-session';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * Helper: Fetch session and validate project access
 * Returns session if authorized, null if not found, throws AuthError on auth failure
 */
async function getAuthorizedSession(request: NextRequest, sessionId: string) {
  try {
    // First fetch the session to get its projectId
    const session = await prisma.agentSession.findUnique({
      where: { id: sessionId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Validate that user has access to this project
    await getAuthorizedProjectId(request, session.projectId);

    return session;
  } catch (error) {
    // Re-throw AuthError to be handled by route
    if (error instanceof AuthError) {
      throw error;
    }
    // Prisma validation errors (invalid ID format) → treat as not found
    if (error instanceof Prisma.PrismaClientValidationError) {
      return null;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * GET /api/agent-sessions/[id]
 *
 * Retrieves a single agent session by ID
 *
 * Security: Requires authentication + access to session's project
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const { id } = await params;

    const session = await getAuthorizedSession(request, id);

    if (!session) {
      return NextResponse.json({ error: 'Agent session not found' }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to fetch agent session');
    return NextResponse.json({ error: 'Failed to fetch agent session' }, { status: 500 });
  }
}

/**
 * PATCH /api/agent-sessions/[id]
 *
 * Updates an agent session
 *
 * Security: Requires authentication + access to session's project
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validation = UpdateAgentSessionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check session exists and user has project access
    const existing = await getAuthorizedSession(request, id);

    if (!existing) {
      return NextResponse.json({ error: 'Agent session not found' }, { status: 404 });
    }

    const { name, plan, todos, progress, appendProgress, activeTicketIds, status, tokenCount } = validation.data;

    // Build update data - using Prisma InputJsonValue for JSON fields
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (plan !== undefined) updateData.plan = plan;
    if (todos !== undefined) updateData.todos = todos;
    // Sprint 14 (Ticket #31): Support append mode for progress
    if (progress !== undefined) {
      if (appendProgress && existing.progress) {
        // Append new progress to existing with separator
        updateData.progress = `${existing.progress}\n\n${progress}`;
      } else {
        // Replace mode (default)
        updateData.progress = progress;
      }
    }
    // Sprint 16: Dynamic ticket claim/unclaim when activeTicketIds changes
    let ticketsClaimed: { id: number; previousStatus: string }[] = [];
    let ticketsUnclaimed: number[] = [];

    if (activeTicketIds !== undefined) {
      const currentTicketIds = existing.activeTicketIds.map((id: string) => parseInt(id));
      const newTicketIds = activeTicketIds;

      // Find newly added tickets (to be claimed)
      const addedTicketIds = newTicketIds.filter((id) => !currentTicketIds.includes(id));

      // Find removed tickets (to be unclaimed)
      const removedTicketIds = currentTicketIds.filter((id) => !newTicketIds.includes(id));

      // Validate and prepare to claim added tickets
      if (addedTicketIds.length > 0) {
        const addedTickets = await prisma.ticket.findMany({
          where: {
            id: { in: addedTicketIds },
            projectId: existing.projectId, // Security: same project only
          },
          select: { id: true, status: true, linkedSessionId: true },
        });

        // Check all tickets were found
        if (addedTickets.length !== addedTicketIds.length) {
          const foundIds = addedTickets.map((t) => t.id);
          const missingIds = addedTicketIds.filter((ticketId) => !foundIds.includes(ticketId));
          return NextResponse.json(
            {
              error: 'TICKETS_NOT_FOUND',
              missingTicketIds: missingIds,
              message: `Tickets ${missingIds.join(', ')} not found in this project`,
            },
            { status: 404 }
          );
        }

        // Validate ALL added tickets are in "todo" status (same rule as session_start)
        const invalidStatusTickets = addedTickets.filter((t) => t.status !== 'todo');
        if (invalidStatusTickets.length > 0) {
          return NextResponse.json(
            {
              error: 'TICKETS_INVALID_STATUS',
              tickets: invalidStatusTickets.map((t) => ({ id: t.id, status: t.status })),
              message: `Only tickets in "todo" status can be claimed. Invalid: ${invalidStatusTickets.map((t) => `#${t.id} (${t.status})`).join(', ')}`,
            },
            { status: 400 }
          );
        }

        // Check none are already linked to ANOTHER session
        const alreadyLinked = addedTickets.filter(
          (t) => t.linkedSessionId !== null && t.linkedSessionId !== id
        );
        if (alreadyLinked.length > 0) {
          return NextResponse.json(
            {
              error: 'TICKETS_ALREADY_CLAIMED',
              ticketIds: alreadyLinked.map((t) => t.id),
              message: `Tickets ${alreadyLinked.map((t) => t.id).join(', ')} are already linked to another session`,
            },
            { status: 409 }
          );
        }

        ticketsClaimed = addedTickets.map((t) => ({ id: t.id, previousStatus: t.status }));
      }

      ticketsUnclaimed = removedTicketIds;
      updateData.activeTicketIds = newTicketIds.map((ticketId) => String(ticketId));
    }
    if (status !== undefined) {
      updateData.status = status;
      // Set completedAt when marking complete
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }
    // Sprint 15: Phase F - Token usage tracking
    if (tokenCount !== undefined) {
      updateData.tokenCount = tokenCount;
    }

    // Sprint 16: Transaction - claim/unclaim tickets + update session
    const session = await prisma.$transaction(async (tx) => {
      // Claim newly added tickets
      if (ticketsClaimed.length > 0) {
        const claimIds = ticketsClaimed.map((t) => t.id);
        await tx.ticket.updateMany({
          where: { id: { in: claimIds } },
          data: {
            status: 'in-progress',
            assignee: 'Claude Code',
            linkedSessionId: id,
          },
        });
      }

      // Unclaim removed tickets (clear linkedSessionId only, keep status)
      if (ticketsUnclaimed.length > 0) {
        await tx.ticket.updateMany({
          where: { id: { in: ticketsUnclaimed } },
          data: { linkedSessionId: null },
        });
      }

      // Update session
      return tx.agentSession.update({
        where: { id },
        data: updateData,
      });
    });

    // Sprint 16: Enhanced response with claim/unclaim info
    return NextResponse.json({
      session,
      success: true,
      ticketsClaimed:
        ticketsClaimed.length > 0
          ? ticketsClaimed.map((t) => ({
              ticketId: t.id,
              previousStatus: t.previousStatus,
              newStatus: 'in-progress',
            }))
          : undefined,
      ticketsUnclaimed: ticketsUnclaimed.length > 0 ? ticketsUnclaimed : undefined,
    });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to update agent session');
    return NextResponse.json({ error: 'Failed to update agent session' }, { status: 500 });
  }
}

/**
 * DELETE /api/agent-sessions/[id]
 *
 * Deletes an agent session
 *
 * Security: Requires authentication + access to session's project
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const { id } = await params;

    // Check session exists and user has project access
    const existing = await getAuthorizedSession(request, id);

    if (!existing) {
      return NextResponse.json({ error: 'Agent session not found' }, { status: 404 });
    }

    // Delete session
    await prisma.agentSession.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to delete agent session');
    return NextResponse.json({ error: 'Failed to delete agent session' }, { status: 500 });
  }
}
