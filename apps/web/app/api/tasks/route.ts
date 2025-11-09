/**
 * API Route: POST /api/tasks
 *
 * Purpose: Create a new task within a day
 *
 * Pattern: Next.js 14 API Route → Zod validation → Prisma create
 *
 * Validation: Parent day must exist, dates within day's range
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const CreateTaskSchema = z.object({
  dayId: z.string().cuid('Day ID must be a valid CUID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().optional(),
  startDate: z.string().datetime('Start date must be valid ISO 8601 format'),
  endDate: z.string().datetime('End date must be valid ISO 8601 format'),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']).default('NOT_STARTED'),
  progress: z.number().int().min(0).max(100).default(0),
  estimatedHours: z.number().positive().optional(),
});

type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const data = CreateTaskSchema.parse(body);

    // 2. Verify parent day exists
    const day = await prisma.day.findUnique({
      where: { id: data.dayId },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
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
    });

    if (!day) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Day with ID ${data.dayId} not found`,
          },
        },
        { status: 404 }
      );
    }

    // 3. Validate dates are within day's range
    const taskStart = new Date(data.startDate);
    const taskEnd = new Date(data.endDate);
    const dayStart = new Date(day.startDate);
    const dayEnd = new Date(day.endDate);

    if (taskStart < dayStart || taskEnd > dayEnd) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Task dates must be within day's range (${day.startDate} to ${day.endDate})`,
            field: 'startDate',
          },
        },
        { status: 400 }
      );
    }

    // 4. Create task
    const task = await prisma.task.create({
      data: {
        dayId: data.dayId,
        title: data.title,
        description: data.description,
        startDate: taskStart,
        endDate: taskEnd,
        status: data.status,
        progress: data.progress,
        estimatedHours: data.estimatedHours,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        progress: true,
        startDate: true,
        endDate: true,
        estimatedHours: true,
      },
    });

    // 5. Success response with hierarchical context
    return NextResponse.json(
      {
        success: true,
        data: {
          task: {
            ...task,
            startDate: task.startDate.toISOString(),
            endDate: task.endDate.toISOString(),
          },
          context: {
            day: { id: day.id, title: day.title },
            week: day.week ? { id: day.week.id, title: day.week.title } : null,
            phase: day.week?.phase ? { id: day.week.phase.id, title: day.week.phase.title } : null,
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
      console.error('[API] Prisma error in POST /api/tasks:', error);
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

    console.error('[API] Unexpected error in POST /api/tasks:', error);
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
