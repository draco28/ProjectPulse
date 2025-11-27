/**
 * API Route: /api/roadmap
 *
 * Standalone Roadmap UI - Phase A
 *
 * GET  - List roadmaps for a project
 * POST - Create a new roadmap with phases/sprints structure
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
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';
import { materializeRoadmap } from '@projectpulse/roadmap-tools';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const sprintSchema = z.object({
  name: z.string().min(1).max(200),
  duration: z.string().optional(),
  weeks: z.string().optional(),
  goals: z.array(z.string()).default([]),
  deliverables: z.array(z.string()).default([]),
  storyPoints: z.number().int().positive().optional(),
});

const phaseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  duration: z.string().optional(),
  sprints: z.array(sprintSchema).min(1),
});

const createRoadmapSchema = z.object({
  projectId: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime(),
  phases: z.array(phaseSchema).min(1),
  materialize: z.boolean().default(true),
});

// ============================================================================
// GET - List Roadmaps
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectIdParam = searchParams.get('projectId');

    if (!projectIdParam) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'projectId query parameter required' } },
        { status: 400 }
      );
    }

    const requestedProjectId = parseInt(projectIdParam, 10);
    if (isNaN(requestedProjectId) || requestedProjectId <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'projectId must be a positive integer' } },
        { status: 400 }
      );
    }

    // Sprint 10: Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    // Get roadmaps with summary data
    const roadmaps = await prisma.roadmap.findMany({
      where: { projectId },
      select: {
        id: true,
        projectId: true,
        currentPhase: true,
        currentSprint: true,
        createdAt: true,
        updatedAt: true,
        phases_rel: {
          select: { id: true, progress: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to response format
    const roadmapsList = roadmaps.map((r) => {
      const avgProgress = r.phases_rel.length > 0
        ? Math.round(r.phases_rel.reduce((sum, p) => sum + p.progress, 0) / r.phases_rel.length)
        : 0;

      return {
        id: r.id,
        projectId: r.projectId,
        title: r.currentPhase ? `Roadmap` : 'Untitled Roadmap',
        currentPhase: r.currentPhase,
        progress: avgProgress,
        phasesCount: r.phases_rel.length,
        createdAt: r.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: { roadmaps: roadmapsList },
    });

  } catch (error) {
    // Sprint 10: Handle auth errors first
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    console.error('[GET /api/roadmap] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list roadmaps' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Roadmap
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createRoadmapSchema.parse(body);

    // Sprint 10: Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, validated.projectId);

    // Check if roadmap already exists for this project
    const existing = await prisma.roadmap.findUnique({
      where: { projectId },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Roadmap already exists for this project. Delete it first or use PUT to update.' } },
        { status: 409 }
      );
    }

    // Build phases JSON structure for storage
    const phasesJson = {
      phases: validated.phases.map((p) => ({
        name: p.title,
        title: p.title,
        description: p.description,
        duration: p.duration,
        sprints: p.sprints.map((s) => ({
          name: s.name,
          duration: s.duration,
          weeks: s.weeks,
          goals: s.goals,
          deliverables: s.deliverables,
          storyPoints: s.storyPoints,
        })),
      })),
    };

    // Create roadmap
    const roadmap = await prisma.roadmap.create({
      data: {
        projectId,
        phases: phasesJson,
        currentPhase: validated.phases[0]?.title || null,
        currentSprint: validated.phases[0]?.sprints[0]?.name || null,
      },
    });

    let materializationResult = null;

    // Auto-materialize if requested (default: true)
    if (validated.materialize) {
      try {
        materializationResult = await materializeRoadmap(roadmap.id);
      } catch (matError) {
        console.error('[POST /api/roadmap] Materialization error:', matError);
        // Don't fail the request, just note the error
        materializationResult = {
          success: false,
          message: matError instanceof Error ? matError.message : 'Materialization failed',
          counts: { phases: 0, sprints: 0, weeks: 0, days: 0 },
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        roadmap: {
          id: roadmap.id,
          projectId: roadmap.projectId,
          title: validated.title,
          phases: roadmap.phases,
          currentPhase: roadmap.currentPhase,
          currentSprint: roadmap.currentSprint,
          currentWeek: roadmap.currentWeek,
          currentDay: roadmap.currentDay,
          createdAt: roadmap.createdAt.toISOString(),
          updatedAt: roadmap.updatedAt.toISOString(),
        },
        materialization: materializationResult ? {
          phases: materializationResult.counts?.phases ?? 0,
          sprints: materializationResult.counts?.sprints ?? 0,
          weeks: materializationResult.counts?.weeks ?? 0,
          days: materializationResult.counts?.days ?? 0,
        } : null,
      },
    }, { status: 201 });

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

    console.error('[POST /api/roadmap] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create roadmap' } },
      { status: 500 }
    );
  }
}
