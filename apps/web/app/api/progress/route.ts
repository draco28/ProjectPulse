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

const updateProgressSchema = z.object({
  entityType: z.enum(['session', 'task', 'day', 'week', 'phase'], {
    errorMap: () => ({ message: 'entityType must be one of: session, task, day, week, phase' }),
  }),

  entityId: z.string()
    .uuid('entityId must be a valid UUID'),

  progress: z.number()
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
    await updateProgressAndPropagate(
      validated.entityId,
      validated.entityType,
      validated.progress
    );

    // 3. Fetch updated entity with hierarchy context
    const updatedData = await fetchEntityWithContext(
      validated.entityType,
      validated.entityId
    );

    // 4. Success response
    return NextResponse.json({
      success: true,
      data: updatedData,
    }, { status: 200 });

  } catch (error) {
    // 5. Error handling

    // Zod validation errors (400)
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors[0].message,
          field: String(error.errors[0].path[0]),
        },
      }, { status: 400 });
    }

    // Entity not found (400)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Entity not found`,
        },
      }, { status: 400 });
    }

    // Progress utility errors (400)
    if (error instanceof Error && error.message.startsWith('Progress must be')) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          field: 'progress',
        },
      }, { status: 400 });
    }

    // Prisma database errors (500)
    if (error?.constructor?.name === 'PrismaClientKnownRequestError') {
      console.error('[API] Prisma error in POST /api/progress:', error);
      return NextResponse.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Database operation failed',
        },
      }, { status: 500 });
    }

    // Unknown errors (500)
    console.error('[API] Unexpected error in POST /api/progress:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    }, { status: 500 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch entity with hierarchical context after update
 * Returns entity + parent chain for full visibility
 */
async function fetchEntityWithContext(
  entityType: 'session' | 'task' | 'day' | 'week' | 'phase',
  entityId: string
) {
  switch (entityType) {
    case 'session': {
      const session = await prisma.session.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          title: true,
          progress: true,
          status: true,
          updatedAt: true,
          task: {
            select: {
              id: true,
              title: true,
              progress: true,
              status: true,
              day: {
                select: {
                  id: true,
                  title: true,
                  progress: true,
                  status: true,
                  week: {
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
          },
        },
      });

      return {
        updated: {
          type: 'session',
          id: session!.id,
          title: session!.title,
          progress: session!.progress,
          status: session!.status,
        },
        hierarchy: {
          task: session!.task ? {
            id: session!.task.id,
            title: session!.task.title,
            progress: session!.task.progress,
            status: session!.task.status,
          } : null,
          day: session!.task?.day ? {
            id: session!.task.day.id,
            title: session!.task.day.title,
            progress: session!.task.day.progress,
            status: session!.task.day.status,
          } : null,
          week: session!.task?.day?.week ? {
            id: session!.task.day.week.id,
            title: session!.task.day.week.title,
            progress: session!.task.day.week.progress,
            status: session!.task.day.week.status,
          } : null,
          phase: session!.task?.day?.week?.phase ? {
            id: session!.task.day.week.phase.id,
            title: session!.task.day.week.phase.title,
            progress: session!.task.day.week.phase.progress,
            status: session!.task.day.week.phase.status,
          } : null,
        },
      };
    }

    case 'task': {
      const task = await prisma.task.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          title: true,
          progress: true,
          status: true,
          updatedAt: true,
          day: {
            select: {
              id: true,
              title: true,
              progress: true,
              status: true,
              week: {
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
          type: 'task',
          id: task!.id,
          title: task!.title,
          progress: task!.progress,
          status: task!.status,
        },
        hierarchy: {
          day: task!.day ? {
            id: task!.day.id,
            title: task!.day.title,
            progress: task!.day.progress,
            status: task!.day.status,
          } : null,
          week: task!.day?.week ? {
            id: task!.day.week.id,
            title: task!.day.week.title,
            progress: task!.day.week.progress,
            status: task!.day.week.status,
          } : null,
          phase: task!.day?.week?.phase ? {
            id: task!.day.week.phase.id,
            title: task!.day.week.phase.title,
            progress: task!.day.week.phase.progress,
            status: task!.day.week.phase.status,
          } : null,
        },
      };
    }

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
          type: 'day',
          id: day!.id,
          title: day!.title,
          progress: day!.progress,
          status: day!.status,
        },
        hierarchy: {
          week: day!.week ? {
            id: day!.week.id,
            title: day!.week.title,
            progress: day!.week.progress,
            status: day!.week.status,
          } : null,
          phase: day!.week?.phase ? {
            id: day!.week.phase.id,
            title: day!.week.phase.title,
            progress: day!.week.phase.progress,
            status: day!.week.phase.status,
          } : null,
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
          type: 'week',
          id: week!.id,
          title: week!.title,
          progress: week!.progress,
          status: week!.status,
        },
        hierarchy: {
          phase: week!.phase ? {
            id: week!.phase.id,
            title: week!.phase.title,
            progress: week!.phase.progress,
            status: week!.phase.status,
          } : null,
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
