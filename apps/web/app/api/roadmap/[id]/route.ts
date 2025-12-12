/**
 * API Route: /api/roadmap/[id]
 *
 * Standalone Roadmap UI - Phase A
 *
 * GET    - Get roadmap details with full hierarchy
 * PUT    - Update roadmap metadata
 * DELETE - Delete roadmap (cascades to phases/sprints/weeks/days)
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

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const updateRoadmapSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  currentPhase: z.string().nullable().optional(),
  currentSprint: z.string().nullable().optional(),
  currentWeek: z.string().nullable().optional(),
  currentDay: z.string().nullable().optional(),
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Sprint 10: Authenticate and validate project access
    await getRoadmapWithAuth(id, request);

    // Fetch roadmap with full 5-level hierarchy
    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
      include: {
        phases_rel: {
          include: {
            sprints: {
              include: {
                weeks: {
                  include: {
                    days: {
                      select: {
                        id: true,
                        title: true,
                        description: true,
                        status: true,
                        progress: true,
                        startDate: true,
                        endDate: true,
                        weekId: true,
                        createdAt: true,
                        updatedAt: true,
                        // Sprint 12: Tasks removed - tickets now schedule to weeks directly
                      },
                    },
                  },
                  orderBy: { startDate: 'asc' },
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
              weeks: sprint.weeks.map((week) => ({
                id: week.id,
                title: week.title,
                description: week.description,
                status: week.status,
                progress: week.progress,
                startDate: week.startDate?.toISOString() || null,
                endDate: week.endDate?.toISOString() || null,
                days: week.days.map((day) => ({
                  id: day.id,
                  title: day.title,
                  description: day.description,
                  status: day.status,
                  progress: day.progress,
                  startDate: day.startDate?.toISOString() || null,
                  endDate: day.endDate?.toISOString() || null,
                  // Sprint 12: Tasks removed - tickets schedule to weeks via scheduledTickets relation
                })),
              })),
            })),
          })),
          currentPhase: roadmap.currentPhase,
          currentSprint: roadmap.currentSprint,
          currentWeek: roadmap.currentWeek,
          currentDay: roadmap.currentDay,
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

    console.error('[GET /api/roadmap/[id]] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get roadmap' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update Roadmap
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateRoadmapSchema.parse(body);

    // Sprint 10: Authenticate and validate project access
    await getRoadmapWithAuth(id, request);

    // Update roadmap
    const roadmap = await prisma.roadmap.update({
      where: { id },
      data: {
        currentPhase: validated.currentPhase,
        currentSprint: validated.currentSprint,
        currentWeek: validated.currentWeek,
        currentDay: validated.currentDay,
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
          currentWeek: roadmap.currentWeek,
          currentDay: roadmap.currentDay,
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
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: error.errors.map((e) => ({ path: e.path, message: e.message })),
        },
      }, { status: 400 });
    }

    console.error('[PUT /api/roadmap/[id]] Error:', error);
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
  try {
    const { id } = await params;

    // Sprint 10: Authenticate and validate project access
    await getRoadmapWithAuth(id, request);

    // Delete roadmap (cascades to phases/sprints/weeks/days via Prisma schema)
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

    console.error('[DELETE /api/roadmap/[id]] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete roadmap' } },
      { status: 500 }
    );
  }
}
