/**
 * API Route: /api/roadmap/import
 *
 * Standalone Roadmap UI - Phase A
 * Sprint 15: Week/Day removed - simplified 2-level hierarchy (Ticket #80)
 *
 * POST - Import roadmap from JSON structure
 *
 * Supports two source types:
 * 1. { type: 'json', data: ParsedRoadmap } - Direct JSON object
 * 2. { type: 'file', content: string } - Base64 encoded JSON file
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
  weeks: z.string().optional(), // Keep for backward compatibility, but ignored
  goals: z.array(z.string()).default([]),
  deliverables: z.array(z.string()).default([]),
  storyPoints: z.number().int().positive().optional(),
});

const phaseSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    duration: z.string().optional(),
    sprints: z.array(sprintSchema).min(1),
  })
  .refine((data) => data.title || data.name, {
    message: 'Phase must have either title or name',
  });

const parsedRoadmapSchema = z.object({
  phases: z.array(phaseSchema).min(1),
});

const jsonSourceSchema = z.object({
  type: z.literal('json'),
  data: parsedRoadmapSchema,
});

const fileSourceSchema = z.object({
  type: z.literal('file'),
  content: z.string().min(1), // Base64 encoded JSON
});

const importRoadmapSchema = z.object({
  projectId: z.number().int().positive(),
  title: z.string().min(1).max(200).optional(),
  source: z.discriminatedUnion('type', [jsonSourceSchema, fileSourceSchema]),
  materialize: z.boolean().default(true),
});

// ============================================================================
// Helper: Parse and validate roadmap data
// ============================================================================

function parseRoadmapData(source: z.infer<typeof importRoadmapSchema>['source']): {
  data: z.infer<typeof parsedRoadmapSchema>;
  warnings: string[];
} {
  const warnings: string[] = [];

  let rawData: unknown;

  if (source.type === 'json') {
    rawData = source.data;
  } else {
    // Decode base64 file content
    try {
      const decoded = Buffer.from(source.content, 'base64').toString('utf-8');
      rawData = JSON.parse(decoded);
    } catch {
      throw new Error('PARSE_ERROR: Failed to decode or parse file content');
    }
  }

  // Validate structure
  const result = parsedRoadmapSchema.safeParse(rawData);
  if (!result.success) {
    throw new Error(`PARSE_ERROR: ${result.error.errors.map((e) => e.message).join(', ')}`);
  }

  // Filter out phases without sprints and collect warnings
  const validPhases = result.data.phases.filter((phase, index) => {
    if (!phase.sprints || phase.sprints.length === 0) {
      warnings.push(`Phase ${index + 1} has no sprints defined, skipped`);
      return false;
    }
    return true;
  });

  if (validPhases.length === 0) {
    throw new Error('PARSE_ERROR: No valid phases found');
  }

  return {
    data: { phases: validPhases },
    warnings,
  };
}

// ============================================================================
// POST - Import Roadmap
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = importRoadmapSchema.parse(body);

    // Sprint 10: Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, validated.projectId);

    // Check if roadmap already exists
    const existing = await prisma.roadmap.findUnique({
      where: { projectId },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message:
              'Roadmap already exists for this project. Delete it first or use the update endpoint.',
          },
        },
        { status: 409 }
      );
    }

    // Parse and validate roadmap data
    const { data: parsedData, warnings } = parseRoadmapData(validated.source);

    // Build phases JSON structure for storage
    const phasesJson = {
      phases: parsedData.phases.map((p) => ({
        name: p.title || p.name,
        title: p.title || p.name,
        description: p.description,
        duration: p.duration,
        sprints: p.sprints.map((s) => ({
          name: s.name,
          duration: s.duration,
          weeks: s.weeks, // Keep for backward compatibility
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
        currentPhase: phasesJson.phases[0]?.name || null,
        currentSprint: phasesJson.phases[0]?.sprints[0]?.name || null,
      },
    });

    let materializationResult = null;

    // Auto-materialize if requested (default: true)
    if (validated.materialize) {
      try {
        materializationResult = await materializeRoadmap(roadmap.id);
      } catch (matError) {
        console.error('[POST /api/roadmap/import] Materialization error:', matError);
        warnings.push(
          `Materialization failed: ${matError instanceof Error ? matError.message : 'Unknown error'}`
        );
        materializationResult = {
          success: false,
          message: matError instanceof Error ? matError.message : 'Materialization failed',
          counts: { phases: 0, sprints: 0 },
        };
      }
    }

    // Sprint 15: Week/Day removed from materialization counts (Ticket #80)
    return NextResponse.json(
      {
        success: true,
        data: {
          roadmap: {
            id: roadmap.id,
            projectId: roadmap.projectId,
            title: validated.title || 'Imported Roadmap',
            phases: roadmap.phases,
            currentPhase: roadmap.currentPhase,
            currentSprint: roadmap.currentSprint,
            createdAt: roadmap.createdAt.toISOString(),
            updatedAt: roadmap.updatedAt.toISOString(),
          },
          materialization: materializationResult
            ? {
                phases: materializationResult.counts?.phases ?? 0,
                sprints: materializationResult.counts?.sprints ?? 0,
              }
            : null,
          warnings,
        },
      },
      { status: 201 }
    );
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

    if (error instanceof Error) {
      if (error.message.startsWith('PARSE_ERROR:')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PARSE_ERROR',
              message: error.message.replace('PARSE_ERROR: ', ''),
            },
          },
          { status: 422 }
        );
      }
    }

    console.error('[POST /api/roadmap/import] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to import roadmap' } },
      { status: 500 }
    );
  }
}
