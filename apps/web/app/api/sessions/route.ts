/**
 * API Route: POST /api/sessions
 *
 * Purpose: Create a new session within a task
 *
 * Pattern: Next.js 14 API Route → Zod validation → Prisma create
 *
 * Hierarchy: Phase → Week → Day → Task → **Session**
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const createSessionSchema = z.object({
  taskId: z.string()
    .uuid('taskId must be a valid UUID'),

  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),

  description: z.string().optional(),

  startDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid ISO 8601 date format'),

  endDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid ISO 8601 date format')
    .optional(),

  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED'])
    .default('NOT_STARTED'),

  progress: z.number()
    .int()
    .min(0, 'Progress must be between 0 and 100')
    .max(100, 'Progress must be between 0 and 100')
    .default(0),

  notes: z.string().optional(),
}).refine((data) => {
  if (!data.endDate) return true; // endDate is optional
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: 'startDate must be before endDate',
  path: ['startDate'],
});

type CreateSessionInput = z.infer<typeof createSessionSchema>;

// ============================================================================
// POST HANDLER
// ============================================================================

/**
 * Create a new session within a task
 *
 * Flow:
 * 1. Parse and validate request body
 * 2. Verify taskId exists
 * 3. Create session with Prisma
 * 4. Return session with full hierarchical context (task → day → week → phase)
 *
 * Error Handling:
 * - 400: Validation errors (Zod) or task not found
 * - 500: Database errors (Prisma)
 *
 * Response Format:
 * Success: { success: true, data: { session, context: { task, day, week, phase } } }
 * Error: { success: false, error: { code, message, field? } }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request
    const body = await request.json();
    const validated = createSessionSchema.parse(body);

    // 2. Verify taskId exists and get full hierarchy
    const task = await prisma.task.findUnique({
      where: { id: validated.taskId },
      select: {
        id: true,
        title: true,
        day: {
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
        },
      },
    });

    if (!task) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
          field: 'taskId',
        },
      }, { status: 400 });
    }

    // 3. Convert dates
    const startDate = new Date(validated.startDate);
    const endDate = validated.endDate ? new Date(validated.endDate) : null;

    // 4. Create session
    const session = await prisma.session.create({
      data: {
        taskId: validated.taskId,
        title: validated.title,
        description: validated.description,
        startDate,
        endDate,
        status: validated.status,
        progress: validated.progress,
        notes: validated.notes,
      },
    });

    // 5. Success response with full hierarchical context
    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session.id,
          title: session.title,
          description: session.description,
          status: session.status,
          progress: session.progress,
          startDate: session.startDate.toISOString(),
          endDate: session.endDate?.toISOString() || null,
          notes: session.notes,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
        },
        context: {
          task: {
            id: task.id,
            title: task.title,
          },
          day: task.day ? {
            id: task.day.id,
            title: task.day.title,
          } : null,
          week: task.day?.week ? {
            id: task.day.week.id,
            title: task.day.week.title,
          } : null,
          phase: task.day?.week?.phase ? {
            id: task.day.week.phase.id,
            title: task.day.week.phase.title,
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
      console.error('[API] Prisma error in POST /api/sessions:', error);
      return NextResponse.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Database operation failed',
        },
      }, { status: 500 });
    }

    // Unknown errors (500)
    console.error('[API] Unexpected error in POST /api/sessions:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    }, { status: 500 });
  }
}
