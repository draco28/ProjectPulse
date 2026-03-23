/**
 * Resume Agent Session API Route
 *
 * Sprint 14: Dedicated endpoint for resuming paused sessions
 *
 * POST /api/agent-sessions/[id]/resume - Resume a paused session
 *
 * Security:
 * - Requires authentication (user session OR agent token)
 * - Agent tokens enforce project isolation via session's projectId
 *
 * Behavior:
 * - PAUSED → IN_PROGRESS: Normal resume, returns full context
 * - IN_PROGRESS → IN_PROGRESS: Idempotent, returns context (for multi-instance)
 * - COMPLETED → Error: Cannot resume completed sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
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
 * POST /api/agent-sessions/[id]/resume
 *
 * Resumes a paused agent session
 * Returns full session data for context recovery
 *
 * Security: Requires authentication + access to session's project
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const { id } = await params;

    // Check session exists and user has project access
    const existing = await getAuthorizedSession(request, id);

    if (!existing) {
      return NextResponse.json({ error: 'Agent session not found' }, { status: 404 });
    }

    // Handle based on current status
    if (existing.status === 'COMPLETED') {
      return NextResponse.json(
        {
          error: 'Cannot resume completed session',
          hint: 'Completed sessions cannot be resumed. Start a new session with projectpulse_agent_session_start.',
        },
        { status: 400 }
      );
    }

    // If already IN_PROGRESS, this is idempotent - just return the session
    // This handles the multi-instance case where another instance is working
    const isAlreadyActive = existing.status === 'IN_PROGRESS';

    let session;
    if (isAlreadyActive) {
      // Don't update, just return current state
      session = existing;
    } else {
      // PAUSED → IN_PROGRESS: Resume the session
      session = await prisma.agentSession.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          updatedAt: new Date(),
        },
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
        },
      });
    }

    return NextResponse.json({
      success: true,
      session,
      isAlreadyActive,
      message: isAlreadyActive
        ? 'Session was already active - returning current state'
        : 'Session resumed successfully',
    });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to resume agent session'
    );
    return NextResponse.json({ error: 'Failed to resume agent session' }, { status: 500 });
  }
}
