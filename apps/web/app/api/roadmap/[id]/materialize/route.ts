/**
 * API Route: /api/roadmap/[id]/materialize
 *
 * Standalone Roadmap UI - Phase A
 *
 * POST - Trigger materialization of roadmap JSON to Phase/Sprint/Week/Day records
 *
 * @see .agent/task/roadmap-ui/ROADMAP-API-SPEC.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-server';
import { materializeRoadmap } from '@projectpulse/roadmap-tools';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const materializeSchema = z.object({
  force: z.boolean().default(false),
});

// ============================================================================
// Helper: Verify roadmap ownership
// ============================================================================

async function verifyRoadmapOwnership(roadmapId: string, userId: string) {
  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    include: {
      project: {
        select: { ownerId: true },
      },
      phases_rel: {
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!roadmap) {
    throw new Error('NOT_FOUND');
  }

  if (roadmap.project.ownerId !== userId) {
    throw new Error('FORBIDDEN');
  }

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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is OK, use defaults
    }
    const validated = materializeSchema.parse(body);

    // Verify ownership and check if already materialized
    const roadmap = await verifyRoadmapOwnership(id, user.id);
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

    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND') {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Roadmap not found' } },
          { status: 404 }
        );
      }
      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
          { status: 403 }
        );
      }
    }

    console.error('[POST /api/roadmap/[id]/materialize] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to materialize roadmap' } },
      { status: 500 }
    );
  }
}
