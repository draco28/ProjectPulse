/**
 * GET /api/roadmap/phases/[id]/progress
 *
 * Sprint 15: Week/Day removed - simplified 2-level hierarchy (Ticket #80)
 *
 * Returns full phase progress with nested sprints (tickets scheduled to sprints)
 * Single query with 1-level nested includes
 *
 * Query Parameters:
 * - projectId: number (required) - Project ID for security validation
 *
 * Path Parameters:
 * - id: string (required) - Phase ID (UUID)
 *
 * Response:
 * - 200: Phase with nested sprints and tickets
 * - 400: Validation error (missing/invalid projectId)
 * - 404: Phase not found or doesn't belong to project
 * - 500: Server error
 *
 * Security (Sprint 10):
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 * - Validates phase belongs to projectId (prevents cross-project access)
 *
 * @see Sprint 8.5 Phase 4 - getPhaseProgress MCP tool
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectAccess, AuthError } from '@/lib/auth/validateRequest';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const log = createRequestLogger(getRequestId(request));

  try {
    // Get projectId from query params (REQUIRED for security)
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId query parameter required' }, { status: 400 });
    }

    const projectIdNum = parseInt(projectId, 10);
    if (isNaN(projectIdNum) || projectIdNum <= 0) {
      return NextResponse.json({ error: 'projectId must be a positive integer' }, { status: 400 });
    }

    // Sprint 10: Authenticate and validate project access
    await requireProjectAccess(request, projectIdNum);

    // Sprint 15: Query phase with sprints only (Week/Day removed - Ticket #80)
    const phase = await prisma.phase.findFirst({
      where: {
        id: params.id,
        roadmap: {
          projectId: projectIdNum, // Security: Validate ownership
        },
      },
      include: {
        sprints: {
          // Sprint 15: Include tickets scheduled to sprints (no weeks)
          include: {
            tickets: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                kind: true,
                estimatedDays: true,
              },
            },
          },
          orderBy: {
            title: 'asc', // Sprint 1, Sprint 2, Sprint 3...
          },
        },
      },
    });

    // Phase not found or doesn't belong to project
    if (!phase) {
      return NextResponse.json(
        {
          error: 'Phase not found',
          message: `Phase ${params.id} does not exist or does not belong to project ${projectIdNum}`,
        },
        { status: 404 }
      );
    }

    // Return phase with nested sprints
    return NextResponse.json(phase);
  } catch (error) {
    // Sprint 10: Handle auth errors first
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Get phase progress failed'
    );
    return NextResponse.json(
      {
        error: 'Failed to get phase progress',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
