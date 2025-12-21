/**
 * API Route: POST /api/progress
 *
 * Purpose: Update progress for any entity (session/task/day/week/phase) and trigger roll-up
 *
 * Pattern: Next.js 14 API Route → Zod validation → Progress utility (incremental transactions)
 *
 * Performance: Uses updateProgressAndPropagate() with row-level locking
 * See: apps/web/lib/db/progress.ts for roll-up algorithm
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateProgressAndPropagate } from '@/lib/db/progress';
import { prisma } from '@/lib/prisma';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

// Sprint 12: Removed 'session' and 'task' - hierarchy now 4-level (Phase → Sprint → Week → Day)
const updateProgressSchema = z.object({
  entityType: z.enum(['day', 'week', 'sprint', 'phase'], {
    errorMap: () => ({ message: 'entityType must be one of: day, week, sprint, phase' }),
  }),

  entityId: z.string().uuid('entityId must be a valid UUID'),

  progress: z
    .number()
    .int('Progress must be an integer')
    .min(0, 'Progress must be between 0 and 100')
    .max(100, 'Progress must be between 0 and 100'),
});

type UpdateProgressInput = z.infer<typeof updateProgressSchema>;

// ============================================================================
// POST HANDLER
// ============================================================================

/**
 * Update entity progress and propagate to parents
 *
 * Flow:
 * 1. Parse and validate request body
 * 2. Call updateProgressAndPropagate() utility (handles roll-up)
 * 3. Fetch updated entity with parent context
 * 4. Return updated entity and affected parents
 *
 * Error Handling:
 * - 400: Validation errors (Zod) or entity not found
 * - 500: Database errors (Prisma)
 *
 * Response Format:
 * Success: { success: true, data: { updated: {...}, affected: [...] } }
 * Error: { success: false, error: { code, message, field? } }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request
    const body = await request.json();
    const validated = updateProgressSchema.parse(body);

    // 2. Update progress and propagate (uses incremental transactions)
    await updateProgressAndPropagate(validated.entityId, validated.entityType, validated.progress);

    // 3. Fetch updated entity with hierarchy context
    const updatedData = await fetchEntityWithContext(validated.entityType, validated.entityId);

    // 4. Success response
    return NextResponse.json(
      {
        success: true,
        data: updatedData,
      },
      { status: 200 }
    );
  } catch (error) {
    // 5. Error handling

    // Zod validation errors (400)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || 'Validation error',
            field: String(error.errors[0]?.path[0] || 'unknown'),
          },
        },
        { status: 400 }
      );
    }

    // Entity not found (400)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Entity not found`,
          },
        },
        { status: 400 }
      );
    }

    // Progress utility errors (400)
    if (error instanceof Error && error.message.startsWith('Progress must be')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            field: 'progress',
          },
        },
        { status: 400 }
      );
    }

    // Prisma database errors (500)
    if (error?.constructor?.name === 'PrismaClientKnownRequestError') {
      console.error('[API] Prisma error in POST /api/progress:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Database operation failed',
          },
        },
        { status: 500 }
      );
    }

    // Unknown errors (500)
    console.error('[API] Unexpected error in POST /api/progress:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch entity with hierarchical context after update
 * Returns entity + parent chain for full visibility
 * Sprint 12: Removed 'session' and 'task' - now 4-level hierarchy
 */
async function fetchEntityWithContext(
  entityType: 'day' | 'week' | 'sprint' | 'phase',
  entityId: string
) {
  switch (entityType) {
    case 'day': {
      const day = await prisma.day.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          title: true,
          progress: true,
          status: true,
          updatedAt: true,
          week: {
            select: {
              id: true,
              title: true,
              progress: true,
              status: true,
              sprint: {
                select: {
                  id: true,
                  title: true,
                  progress: true,
                  status: true,
                  phase: {
                    select: {
                      id: true,
                      title: true,
                      progress: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return {
        updated: {
          type: 'day',
          id: day!.id,
          title: day!.title,
          progress: day!.progress,
          status: day!.status,
        },
        hierarchy: {
          week: day!.week
            ? {
                id: day!.week.id,
                title: day!.week.title,
                progress: day!.week.progress,
                status: day!.week.status,
              }
            : null,
          sprint: day!.week?.sprint
            ? {
                id: day!.week.sprint.id,
                title: day!.week.sprint.title,
                progress: day!.week.sprint.progress,
                status: day!.week.sprint.status,
              }
            : null,
          phase: day!.week?.sprint?.phase
            ? {
                id: day!.week.sprint.phase.id,
                title: day!.week.sprint.phase.title,
                progress: day!.week.sprint.phase.progress,
                status: day!.week.sprint.phase.status,
              }
            : null,
        },
      };
    }

    case 'week': {
      const week = await prisma.week.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          title: true,
          progress: true,
          status: true,
          updatedAt: true,
          sprint: {
            select: {
              id: true,
              title: true,
              progress: true,
              status: true,
              phase: {
                select: {
                  id: true,
                  title: true,
                  progress: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      return {
        updated: {
          type: 'week',
          id: week!.id,
          title: week!.title,
          progress: week!.progress,
          status: week!.status,
        },
        hierarchy: {
          sprint: week!.sprint
            ? {
                id: week!.sprint.id,
                title: week!.sprint.title,
                progress: week!.sprint.progress,
                status: week!.sprint.status,
              }
            : null,
          phase: week!.sprint?.phase
            ? {
                id: week!.sprint.phase.id,
                title: week!.sprint.phase.title,
                progress: week!.sprint.phase.progress,
                status: week!.sprint.phase.status,
              }
            : null,
        },
      };
    }

    case 'sprint': {
      const sprint = await prisma.sprint.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          title: true,
          progress: true,
          status: true,
          updatedAt: true,
          phase: {
            select: {
              id: true,
              title: true,
              progress: true,
              status: true,
            },
          },
        },
      });

      return {
        updated: {
          type: 'sprint',
          id: sprint!.id,
          title: sprint!.title,
          progress: sprint!.progress,
          status: sprint!.status,
        },
        hierarchy: {
          phase: sprint!.phase
            ? {
                id: sprint!.phase.id,
                title: sprint!.phase.title,
                progress: sprint!.phase.progress,
                status: sprint!.phase.status,
              }
            : null,
        },
      };
    }

    case 'phase': {
      const phase = await prisma.phase.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          title: true,
          progress: true,
          status: true,
          updatedAt: true,
        },
      });

      return {
        updated: {
          type: 'phase',
          id: phase!.id,
          title: phase!.title,
          progress: phase!.progress,
          status: phase!.status,
        },
        hierarchy: {},
      };
    }
  }
}
