/**
 * API Route: POST /api/tasks
 *
 * Purpose: Create a new task within a day
 *
 * Pattern: Next.js 14 API Route → Zod validation → Prisma create
 *
 * Hierarchy: Phase → Week → Day → **Task** → Session
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const createTaskSchema = z.object({
  dayId: z.string()
    .uuid('dayId must be a valid UUID'),

  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),

  description: z.string().optional(),

  startDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid ISO 8601 date format'),

  endDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid ISO 8601 date format'),

  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED'])
    .default('NOT_STARTED'),

  progress: z.number()
    .int()
    .min(0, 'Progress must be between 0 and 100')
    .max(100, 'Progress must be between 0 and 100')
    .default(0),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: 'startDate must be before endDate',
  path: ['startDate'],
});

type CreateTaskInput = z.infer<typeof createTaskSchema>;

// ============================================================================
// POST HANDLER
// ============================================================================

/**
 * Create a new task within a day
 *
 * Flow:
 * 1. Parse and validate request body
 * 2. Verify dayId exists
 * 3. Create task with Prisma
 * 4. Return task with hierarchical context (day → week → phase)
 *
 * Error Handling:
 * - 400: Validation errors (Zod) or day not found
 * - 500: Database errors (Prisma)
 *
 * Response Format:
 * Success: { success: true, data: { task, context: { day, week, phase } } }
 * Error: { success: false, error: { code, message, field? } }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request
    const body = await request.json();
    const validated = createTaskSchema.parse(body);

    // 2. Verify dayId exists
    const day = await prisma.day.findUnique({
      where: { id: validated.dayId },
      select: {
        id: true,
        title: true,
        week: {
          select: {
            id: true,
            title: true,
            phase: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!day) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Day not found',
          field: 'dayId',
        },
      }, { status: 400 });
    }

    // 3. Convert dates
    const startDate = new Date(validated.startDate);
    const endDate = new Date(validated.endDate);

    // 4. Create task
    const task = await prisma.task.create({
      data: {
        dayId: validated.dayId,
        title: validated.title,
        description: validated.description,
        startDate,
        endDate,
        status: validated.status,
        progress: validated.progress,
      },
    });

    // 5. Success response with hierarchical context
    return NextResponse.json({
      success: true,
      data: {
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          progress: task.progress,
          startDate: task.startDate.toISOString(),
          endDate: task.endDate?.toISOString() || null,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        },
        context: {
          day: {
            id: day.id,
            title: day.title,
          },
          week: day.week ? {
            id: day.week.id,
            title: day.week.title,
          } : null,
          phase: day.week?.phase ? {
            id: day.week.phase.id,
            title: day.week.phase.title,
          } : null,
        },
      },
    }, { status: 201 });

  } catch (error) {
    // 6. Error handling

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

    // Prisma database errors (500)
    if (error?.constructor?.name === 'PrismaClientKnownRequestError') {
      console.error('[API] Prisma error in POST /api/tasks:', error);
      return NextResponse.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Database operation failed',
        },
      }, { status: 500 });
    }

    // Unknown errors (500)
    console.error('[API] Unexpected error in POST /api/tasks:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    }, { status: 500 });
  }
}
