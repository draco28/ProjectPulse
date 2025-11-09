/**
 * API Route: POST /api/sessions
 *
 * Purpose: Create a new session within a task
 *
 * Pattern: Next.js 14 API Route → Zod validation → Prisma create
 *
 * Validation: Parent task must exist, dates within task's range
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const CreateSessionSchema = z.object({
  taskId: z.string().cuid('Task ID must be a valid CUID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().optional(),
  startDate: z.string().datetime('Start date must be valid ISO 8601 format'),
  endDate: z.string().datetime('End date must be valid ISO 8601 format').optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']).default('NOT_STARTED'),
  progress: z.number().int().min(0).max(100).default(0),
  notes: z.string().optional(),
  tokenCount: z.number().int().positive().optional(),
});

type CreateSessionInput = z.infer<typeof CreateSessionSchema>;

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const data = CreateSessionSchema.parse(body);

    // 2. Verify parent task exists
    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        day: {
          select: {
            id: true,
            title: true,
            week: {
              select: {
                id: true,
                title: true,
                phase: {
                  select: { id: true, title: true },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Task with ID ${data.taskId} not found`,
          },
        },
        { status: 404 }
      );
    }

    // 3. Validate dates are within task's range (if endDate provided)
    const sessionStart = new Date(data.startDate);
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);

    if (sessionStart < taskStart || sessionStart > taskEnd) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Session start date must be within task's range (${task.startDate} to ${task.endDate})`,
            field: 'startDate',
          },
        },
        { status: 400 }
      );
    }

    if (data.endDate) {
      const sessionEnd = new Date(data.endDate);
      if (sessionEnd > taskEnd) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Session end date must be within task's range (${task.startDate} to ${task.endDate})`,
              field: 'endDate',
            },
          },
          { status: 400 }
        );
      }
    }

    // 4. Create session
    const session = await prisma.session.create({
      data: {
        taskId: data.taskId,
        title: data.title,
        description: data.description,
        startDate: sessionStart,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status,
        progress: data.progress,
        notes: data.notes,
        tokenCount: data.tokenCount,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        progress: true,
        startDate: true,
        endDate: true,
        notes: true,
        tokenCount: true,
      },
    });

    // 5. Success response with hierarchical context
    return NextResponse.json(
      {
        success: true,
        data: {
          session: {
            ...session,
            startDate: session.startDate.toISOString(),
            endDate: session.endDate?.toISOString() || null,
          },
          context: {
            task: { id: task.id, title: task.title },
            day: task.day ? { id: task.day.id, title: task.day.title } : null,
            week: task.day?.week ? { id: task.day.week.id, title: task.day.week.title } : null,
            phase: task.day?.week?.phase ? { id: task.day.week.phase.id, title: task.day.week.phase.title } : null,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Error handling
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: firstError?.message || 'Validation failed',
            field: String(firstError?.path?.[0] || 'unknown'),
          },
        },
        { status: 400 }
      );
    }

    if (error?.constructor?.name === 'PrismaClientKnownRequestError') {
      console.error('[API] Prisma error in POST /api/sessions:', error);
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

    console.error('[API] Unexpected error in POST /api/sessions:', error);
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
