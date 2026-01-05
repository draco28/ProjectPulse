/**
 * API Route: /api/roadmap/[id]
 *
 * Standalone Roadmap UI - Phase A
 * Sprint 15: Week/Day removed - simplified 2-level hierarchy (Ticket #80)
 *
 * GET    - Get roadmap details with full hierarchy (Phase → Sprint)
 * PUT    - Update roadmap metadata
 * DELETE - Delete roadmap (cascades to phases/sprints)
 *
 * Security (Sprint 10):
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 *
 * @see .agent/task/roadmap-ui/ROADMAP-API-SPEC.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireProjectAccess, AuthError } from '@/lib/auth/validateRequest';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// Sprint 15: Week/Day removed (Ticket #80) - removed currentWeek, currentDay fields
const updateRoadmapSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  currentPhase: z.string().nullable().optional(),
  currentSprint: z.string().nullable().optional(),
});

// ============================================================================
// Helper: Get roadmap and verify project access
// ============================================================================

async function getRoadmapWithAuth(roadmapId: string, request: Request) {
  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    select: { id: true, projectId: true },
  });

  if (!roadmap) {
    throw new AuthError('Roadmap not found', 404, 'NOT_FOUND');
  }

  // Sprint 10: Authenticate and validate project access
  await requireProjectAccess(request, roadmap.projectId);

  return roadmap;
}

// ============================================================================
// GET - Get Roadmap Details
// ============================================================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const log = createRequestLogger(getRequestId(request));

  try {
    const { id } = await params;

    // Sprint 10: Authenticate and validate project access
    await getRoadmapWithAuth(id, request);

    // Sprint 15: Fetch roadmap with 2-level hierarchy (Phase → Sprint only)
    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
      include: {
        phases_rel: {
          include: {
            sprints: {
              // Sprint 15: Include tickets scheduled to sprints
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
              orderBy: { startDate: 'asc' },
            },
          },
          orderBy: { startDate: 'asc' },
        },
      },
    });

    if (!roadmap) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Roadmap not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        roadmap: {
          id: roadmap.id,
          projectId: roadmap.projectId,
          phases: roadmap.phases,
          phases_rel: roadmap.phases_rel.map((phase) => ({
            id: phase.id,
            title: phase.title,
            description: phase.description,
            status: phase.status,
            progress: phase.progress,
            startDate: phase.startDate?.toISOString() || null,
            endDate: phase.endDate?.toISOString() || null,
            sprints: phase.sprints.map((sprint) => ({
              id: sprint.id,
              title: sprint.title,
              description: sprint.description,
              status: sprint.status,
              progress: sprint.progress,
              startDate: sprint.startDate?.toISOString() || null,
              endDate: sprint.endDate?.toISOString() || null,
              // Sprint 15: Tickets directly on sprints (no weeks/days)
              tickets: sprint.tickets.map((ticket) => ({
                id: ticket.id,
                title: ticket.title,
                status: ticket.status,
                priority: ticket.priority,
                kind: ticket.kind,
                estimatedDays: ticket.estimatedDays,
              })),
            })),
          })),
          currentPhase: roadmap.currentPhase,
          currentSprint: roadmap.currentSprint,
          // Sprint 15: Week/Day removed (Ticket #80)
          createdAt: roadmap.createdAt.toISOString(),
          updatedAt: roadmap.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    // Sprint 10: Handle auth errors first
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Get roadmap failed');
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get roadmap' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update Roadmap
// ============================================================================

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const log = createRequestLogger(getRequestId(request));

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateRoadmapSchema.parse(body);

    // Sprint 10: Authenticate and validate project access
    await getRoadmapWithAuth(id, request);

    // Sprint 15: Update roadmap (Week/Day fields removed)
    const roadmap = await prisma.roadmap.update({
      where: { id },
      data: {
        currentPhase: validated.currentPhase,
        currentSprint: validated.currentSprint,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        roadmap: {
          id: roadmap.id,
          projectId: roadmap.projectId,
          currentPhase: roadmap.currentPhase,
          currentSprint: roadmap.currentSprint,
          // Sprint 15: Week/Day removed (Ticket #80)
          updatedAt: roadmap.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    // Sprint 10: Handle auth errors first
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.errors.map((e) => ({ path: e.path, message: e.message })),
          },
        },
        { status: 400 }
      );
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Update roadmap failed');
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update roadmap' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete Roadmap
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const log = createRequestLogger(getRequestId(request));

  try {
    const { id } = await params;

    // Sprint 10: Authenticate and validate project access
    await getRoadmapWithAuth(id, request);

    // Sprint 15: Delete roadmap (cascades to phases/sprints via Prisma schema)
    await prisma.roadmap.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Roadmap deleted successfully',
    });
  } catch (error) {
    // Sprint 10: Handle auth errors first
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Delete roadmap failed');
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete roadmap' } },
      { status: 500 }
    );
  }
}
