/**
 * End Agent Session API Route
 *
 * Sprint 12: Dedicated endpoint for completing sessions
 * Phase 2: Self-Guiding MCP - Auto-syncs Memory Banks on session end
 *
 * POST /api/agent-sessions/[id]/end - Mark session as complete
 *
 * Security (Sprint 12):
 * - Requires authentication (user session OR agent token)
 * - Agent tokens enforce project isolation via session's projectId
 *
 * Auto-Sync (Phase 2):
 * - PROGRESS bank: Adds session summary with pruning
 * - ACTIVE_CONTEXT bank: Updates current focus based on pending todos
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { EndAgentSessionSchema } from '@/lib/validations/agent-session';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';
import {
  autoSyncProgressBank,
  autoSyncActiveContext,
  type FullAgentSession,
} from '@/lib/memory/memory-bank-service';

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
        status: true,
        progress: true,
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
 * POST /api/agent-sessions/[id]/end
 *
 * Marks an agent session as complete
 * Optionally updates final progress notes
 *
 * Security: Requires authentication + access to session's project
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Parse body (optional)
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine
    }

    // Validate request body
    const validation = EndAgentSessionSchema.safeParse(body);
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

    if (existing.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Session is already completed' }, { status: 400 });
    }

    const { progress, tokenCount } = validation.data;

    // Build update data
    const updateData: {
      status: string;
      completedAt: Date;
      progress?: string;
      tokenCount?: number;
    } = {
      status: 'COMPLETED',
      completedAt: new Date(),
    };

    // Sprint 15: Phase F - Token usage tracking
    if (tokenCount !== undefined) {
      updateData.tokenCount = tokenCount;
    }

    // Append final progress if provided
    if (progress) {
      updateData.progress = existing.progress
        ? `${existing.progress}\n\n---\n\n**Completion Notes:**\n${progress}`
        : progress;
    }

    // Update session
    const session = await prisma.agentSession.update({
      where: { id },
      data: updateData,
    });

    // Phase 2: Auto-sync Memory Banks (fire-and-forget - don't block response)
    // Fetch full session data needed for auto-sync
    const fullSession = await prisma.agentSession.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        name: true,
        todos: true,
        progress: true,
        activeTicketIds: true,
        status: true,
        startedAt: true,
        completedAt: true,
      },
    });

    // Phase 2: Auto-sync Memory Banks with status reporting
    let syncStatus: {
      progress: { success: boolean; error?: string };
      activeContext: { success: boolean; error?: string };
    } | null = null;

    if (fullSession) {
      // Cast to FullAgentSession type for auto-sync functions
      const sessionForSync: FullAgentSession = {
        id: fullSession.id,
        projectId: fullSession.projectId,
        name: fullSession.name,
        todos: fullSession.todos,
        progress: fullSession.progress,
        activeTicketIds: fullSession.activeTicketIds,
        status: fullSession.status,
        startedAt: fullSession.startedAt,
        completedAt: fullSession.completedAt,
      };

      // Run both syncs in parallel and collect individual results
      const [progressResult, activeContextResult] = await Promise.allSettled([
        autoSyncProgressBank(fullSession.projectId, sessionForSync),
        autoSyncActiveContext(fullSession.projectId, sessionForSync),
      ]);

      // Build sync status from settled results
      syncStatus = {
        progress:
          progressResult.status === 'fulfilled'
            ? progressResult.value
            : { success: false, error: progressResult.reason?.message || 'Unknown error' },
        activeContext:
          activeContextResult.status === 'fulfilled'
            ? activeContextResult.value
            : { success: false, error: activeContextResult.reason?.message || 'Unknown error' },
      };

      // Log any failures
      if (!syncStatus.progress.success) {
        console.error(
          '[POST /api/agent-sessions/[id]/end] PROGRESS sync failed:',
          syncStatus.progress.error
        );
      }
      if (!syncStatus.activeContext.success) {
        console.error(
          '[POST /api/agent-sessions/[id]/end] ACTIVE_CONTEXT sync failed:',
          syncStatus.activeContext.error
        );
      }
    }

    return NextResponse.json({
      success: true,
      session,
      syncStatus,
      message: 'Session completed successfully',
    });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error('[POST /api/agent-sessions/[id]/end] Error:', error);
    return NextResponse.json({ error: 'Failed to end agent session' }, { status: 500 });
  }
}
