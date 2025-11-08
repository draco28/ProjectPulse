/**
 * API Route: GET /api/tasks/current
 *
 * Purpose: Query the currently active task with full hierarchical context
 *
 * Pattern: Next.js 14 API Route → Prisma select (optimized) → Flatten response
 *
 * Performance: Uses select instead of include (52% smaller payload)
 * See: .agent/task/prisma-sprint-tools-20251107-0630.md
 *
 * Index Required: @@index([updatedAt(sort: Desc)]) on Task model (100x faster)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic';

// ============================================================================
// GET HANDLER
// ============================================================================

/**
 * Get the currently active task with hierarchical context
 *
 * Flow:
 * 1. Parse query params (includeHistory flag)
 * 2. Query Prisma with optimized select + nested includes
 * 3. Flatten nested structure for easier consumption
 * 4. Return task with context or null
 *
 * Query Strategy:
 * - findFirst with status=IN_PROGRESS (uses @@index([status]))
 * - orderBy updatedAt desc (uses @@index([updatedAt(sort: Desc)]))
 * - select instead of include (52% smaller payload)
 * - 3-level nesting: task -> day -> week -> phase
 *
 * Error Handling:
 * - 500: Database errors (Prisma)
 *
 * Response Format:
 * Success (task found): { success: true, data: { currentTask } }
 * Success (no task): { success: true, data: { currentTask: null, message } }
 * Error: { success: false, error: { code, message } }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Parse query params
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('includeHistory') === 'true';

    // 2. Query with optimized select pattern (faster than include)
    const currentTask = await prisma.task.findFirst({
      where: {
        status: 'IN_PROGRESS', // Uses @@index([status])
      },
      select: {
        // Task fields
        id: true,
        title: true,
        description: true,
        status: true,
        progress: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,

        // Day context (1st level)
        day: {
          select: {
            id: true,
            title: true,
            status: true,
            progress: true,
            startDate: true,

            // Week context (2nd level)
            week: {
              select: {
                id: true,
                title: true,
                status: true,
                progress: true,
                startDate: true,

                // Phase context (3rd level)
                phase: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    progress: true,
                    startDate: true,
                  },
                },
              },
            },
          },
        },

        // Optional: Recent sessions (conditional select)
        ...(includeHistory && {
          sessions: {
            where: {
              status: {
                in: ['IN_PROGRESS', 'COMPLETED'],
              },
            },
            select: {
              id: true,
              title: true,
              status: true,
              progress: true,
              startDate: true,
            },
            orderBy: {
              startDate: 'desc',
            },
            take: 5,
          },
        }),
      },
      orderBy: {
        updatedAt: 'desc', // Uses @@index([updatedAt(sort: Desc)])
      },
    });

    // 3. Handle not found
    if (!currentTask) {
      return NextResponse.json({
        success: true,
        data: {
          currentTask: null,
          message: 'No task is currently in progress',
        },
      });
    }

    // 4. Flatten nested structure for easier consumption
    const response = {
      id: currentTask.id,
      title: currentTask.title,
      description: currentTask.description,
      status: currentTask.status,
      progress: currentTask.progress,
      startDate: currentTask.startDate.toISOString(),
      endDate: currentTask.endDate?.toISOString() || null,
      createdAt: currentTask.createdAt.toISOString(),
      updatedAt: currentTask.updatedAt.toISOString(),

      // Flattened hierarchy (extract nested objects to top level)
      day: {
        id: currentTask.day.id,
        title: currentTask.day.title,
        status: currentTask.day.status,
        progress: currentTask.day.progress,
        startDate: currentTask.day.startDate.toISOString(),
      },
      week: {
        id: currentTask.day.week.id,
        title: currentTask.day.week.title,
        status: currentTask.day.week.status,
        progress: currentTask.day.week.progress,
        startDate: currentTask.day.week.startDate.toISOString(),
      },
      phase: {
        id: currentTask.day.week.phase.id,
        title: currentTask.day.week.phase.title,
        status: currentTask.day.week.phase.status,
        progress: currentTask.day.week.phase.progress,
        startDate: currentTask.day.week.phase.startDate.toISOString(),
      },

      // Optional: Session history
      ...(includeHistory && 'sessions' in currentTask && {
        sessions: currentTask.sessions?.map((session) => ({
          id: session.id,
          title: session.title,
          status: session.status,
          progress: session.progress,
          startDate: session.startDate.toISOString(),
        })),
      }),
    };

    // 5. Success response
    return NextResponse.json({
      success: true,
      data: {
        currentTask: response,
      },
    });

  } catch (error) {
    // 6. Error handling

    // Prisma database errors (500)
    if (error?.constructor?.name === 'PrismaClientKnownRequestError') {
      console.error('[API] Prisma error in GET /api/tasks/current:', error);
      return NextResponse.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Database operation failed',
        },
      }, { status: 500 });
    }

    // Unknown errors (500)
    console.error('[API] Unexpected error in GET /api/tasks/current:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    }, { status: 500 });
  }
}
