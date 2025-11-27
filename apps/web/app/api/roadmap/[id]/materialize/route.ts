/**
 * API Route: /api/roadmap/[id]/materialize
 *
 * Standalone Roadmap UI - Phase A
 *
 * POST - Trigger materialization of roadmap JSON to Phase/Sprint/Week/Day records
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
import { materializeRoadmap } from '@projectpulse/roadmap-tools';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const materializeSchema = z.object({
  force: z.boolean().default(false),
});

// ============================================================================
// Helper: Get roadmap and verify project access
// ============================================================================

async function getRoadmapWithAuth(roadmapId: string, request: Request) {
  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    select: {
      id: true,
      projectId: true,
      phases_rel: {
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!roadmap) {
    throw new AuthError('Roadmap not found', 404, 'NOT_FOUND');
  }

  // Sprint 10: Authenticate and validate project access
  await requireProjectAccess(request, roadmap.projectId);

  return roadmap;
}

// ============================================================================
// POST - Trigger Materialization
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is OK, use defaults
    }
    const validated = materializeSchema.parse(body);

    // Sprint 10: Authenticate and validate project access
    const roadmap = await getRoadmapWithAuth(id, request);
    const isAlreadyMaterialized = roadmap.phases_rel.length > 0;

    if (isAlreadyMaterialized && !validated.force) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'ALREADY_MATERIALIZED',
          message: 'Roadmap is already materialized. Use force=true to re-materialize.',
        },
      }, { status: 409 });
    }

    // If force re-materialize, delete existing records first
    if (isAlreadyMaterialized && validated.force) {
      // Delete phases (cascades to sprints/weeks/days via schema)
      await prisma.phase.deleteMany({
        where: { roadmapId: id },
      });
    }

    // Materialize roadmap
    const result = await materializeRoadmap(id);

    return NextResponse.json({
      success: true,
      data: {
        materialization: {
          phases: result.counts.phases,
          sprints: result.counts.sprints,
          weeks: result.counts.weeks,
          days: result.counts.days,
          tasks: 0, // Tasks are created separately
        },
        message: result.message,
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

    console.error('[POST /api/roadmap/[id]/materialize] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to materialize roadmap' } },
      { status: 500 }
    );
  }
}
