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

    console.error('[GET /api/agent-sessions/[id]] Error:', error);
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
    if (activeTicketIds !== undefined) {
      updateData.activeTicketIds = activeTicketIds.map((id) => String(id));
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

    // Update session
    const session = await prisma.agentSession.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ session, success: true });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error('[PATCH /api/agent-sessions/[id]] Error:', error);
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

    console.error('[DELETE /api/agent-sessions/[id]] Error:', error);
    return NextResponse.json({ error: 'Failed to delete agent session' }, { status: 500 });
  }
}
