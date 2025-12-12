/**
 * End Agent Session API Route
 *
 * Sprint 12: Dedicated endpoint for completing sessions
 *
 * POST /api/agent-sessions/[id]/end - Mark session as complete
 *
 * Security (Sprint 12):
 * - Requires authentication (user session OR agent token)
 * - Agent tokens enforce project isolation via session's projectId
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { EndAgentSessionSchema } from '@/lib/validations/agent-session';
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
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
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
      return NextResponse.json(
        { error: 'Agent session not found' },
        { status: 404 }
      );
    }

    if (existing.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Session is already completed' },
        { status: 400 }
      );
    }

    const { progress } = validation.data;

    // Build update data
    const updateData: {
      status: string;
      completedAt: Date;
      progress?: string;
    } = {
      status: 'COMPLETED',
      completedAt: new Date(),
    };

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

    return NextResponse.json({
      success: true,
      session,
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
    return NextResponse.json(
      { error: 'Failed to end agent session' },
      { status: 500 }
    );
  }
}
