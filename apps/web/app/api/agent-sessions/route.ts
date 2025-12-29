/**
 * Agent Sessions API Routes
 *
 * Sprint 12: New API for agent work tracking sessions
 *
 * GET  /api/agent-sessions - List sessions for a project
 * POST /api/agent-sessions - Create a new session
 *
 * Security (Sprint 12):
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  CreateAgentSessionSchema,
  ListAgentSessionsQuerySchema,
} from '@/lib/validations/agent-session';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';

export const dynamic = 'force-dynamic';

/**
 * GET /api/agent-sessions
 *
 * Lists agent sessions for a project with pagination
 * Query params: projectId (required), status, limit, offset
 *
 * Security: Requires authentication + project access
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = {
      projectId: searchParams.get('projectId'),
      status: searchParams.get('status'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    };

    // Validate query params
    const validation = ListAgentSessionsQuerySchema.safeParse(rawParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { projectId: requestedProjectId, status, limit, offset } = validation.data;

    // Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    // Build where clause
    const where: { projectId: number; status?: string } = { projectId };
    if (status) {
      where.status = status;
    }

    // Fetch sessions with count
    const [sessions, total] = await Promise.all([
      prisma.agentSession.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          projectId: true,
          name: true,
          plan: true,
          todos: true,
          progress: true,
          activeTicketIds: true,
          status: true,
          startedAt: true,
          updatedAt: true,
          completedAt: true,
        },
      }),
      prisma.agentSession.count({ where }),
    ]);

    return NextResponse.json({
      sessions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + sessions.length < total,
      },
    });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error('[GET /api/agent-sessions] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch agent sessions' }, { status: 500 });
  }
}

/**
 * POST /api/agent-sessions
 *
 * Creates a new agent session with optional ticket claiming.
 *
 * Sprint 16: Auto-claim tickets from "todo" status
 * - When activeTicketIds provided, validates all tickets are in "todo" status
 * - Claims tickets atomically: status → "in-progress", assignee → "Claude Code"
 * - Links tickets to session via linkedSessionId
 *
 * Security: Requires authentication + project access
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = CreateAgentSessionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      projectId: requestedProjectId,
      name,
      plan,
      todos,
      progress,
      activeTicketIds,
    } = validation.data;

    // Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    // Verify project exists (defense in depth - getAuthorizedProjectId should already validate)
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Convert activeTicketIds to numbers for ticket lookup
    const ticketIdNumbers = activeTicketIds?.map((id) => Number(id)) || [];

    // Sprint 16: Validate and claim tickets if provided
    let claimedTickets: { id: number; previousStatus: string }[] = [];

    if (ticketIdNumbers.length > 0) {
      // 1. Validate all tickets exist and belong to this project
      const tickets = await prisma.ticket.findMany({
        where: {
          id: { in: ticketIdNumbers },
          projectId, // Security: only tickets in this project
        },
        select: { id: true, status: true, linkedSessionId: true },
      });

      // Check all tickets were found
      if (tickets.length !== ticketIdNumbers.length) {
        const foundIds = tickets.map((t) => t.id);
        const missingIds = ticketIdNumbers.filter((id) => !foundIds.includes(id));
        return NextResponse.json(
          {
            error: 'TICKETS_NOT_FOUND',
            missingTicketIds: missingIds,
            message: `Tickets ${missingIds.join(', ')} not found in this project`,
          },
          { status: 404 }
        );
      }

      // 2. CRITICAL: Validate ALL tickets are in "todo" status
      // Only "todo" tickets can be claimed - not backlog/in-progress/in-review/done
      const invalidStatusTickets = tickets.filter((t) => t.status !== 'todo');
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

      // 3. Check none are already linked to another session
      const alreadyLinked = tickets.filter((t) => t.linkedSessionId !== null);
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

      // Store previous status for response (will always be 'todo')
      claimedTickets = tickets.map((t) => ({ id: t.id, previousStatus: t.status }));
    }

    // Create session + claim tickets in transaction
    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.agentSession.create({
        data: {
          projectId,
          name,
          plan,
          todos: todos || [],
          progress,
          activeTicketIds: ticketIdNumbers.map(String),
          status: 'IN_PROGRESS',
        },
      });

      // Claim all tickets if any
      if (ticketIdNumbers.length > 0) {
        await tx.ticket.updateMany({
          where: { id: { in: ticketIdNumbers } },
          data: {
            status: 'in-progress',
            assignee: 'Claude Code',
            linkedSessionId: newSession.id,
          },
        });
      }

      return newSession;
    });

    // Enhanced response with claim info
    return NextResponse.json(
      {
        session,
        success: true,
        ticketsClaimed:
          claimedTickets.length > 0
            ? claimedTickets.map((t) => ({
                ticketId: t.id,
                previousStatus: t.previousStatus,
                newStatus: 'in-progress',
              }))
            : undefined,
        message:
          claimedTickets.length > 0
            ? `Session started. ${claimedTickets.length} ticket(s) claimed and moved to in-progress.`
            : 'Session started.',
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error('[POST /api/agent-sessions] Error:', error);
    return NextResponse.json({ error: 'Failed to create agent session' }, { status: 500 });
  }
}
