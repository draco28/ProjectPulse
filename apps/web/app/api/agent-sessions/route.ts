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
 * Creates a new agent session
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

    // Convert activeTicketIds to string[] for Prisma
    const ticketIds = activeTicketIds?.map((id) => String(id)) || [];

    // Create session
    const session = await prisma.agentSession.create({
      data: {
        projectId,
        name,
        plan,
        todos: todos || [],
        progress,
        activeTicketIds: ticketIds,
        status: 'IN_PROGRESS',
      },
    });

    return NextResponse.json({ session, success: true }, { status: 201 });
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
