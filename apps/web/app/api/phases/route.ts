/**
 * API Route: POST /api/phases
 *
 * Purpose: Create a new phase with auto-generated child weeks
 *
 * Pattern: Next.js 14 API Route → Zod validation → Prisma nested write
 *
 * Performance: Uses Prisma nested write (3x faster than loop + transaction)
 * See: .agent/task/prisma-sprint-tools-20251107-0630.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const createPhaseSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),

    description: z.string().optional(),

    startDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid ISO 8601 date format'),

    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid ISO 8601 date format'),

    status: z
      .enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED'])
      .default('NOT_STARTED'),

    progress: z
      .number()
      .int()
      .min(0, 'Progress must be between 0 and 100')
      .max(100, 'Progress must be between 0 and 100')
      .default(0),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start < end;
    },
    {
      message: 'startDate must be before endDate',
      path: ['startDate'],
    }
  );

type CreatePhaseInput = z.infer<typeof createPhaseSchema>;

// ============================================================================
// POST HANDLER
// ============================================================================

/**
 * Create a new phase with auto-generated weeks
 *
 * Flow:
 * 1. Parse and validate request body
 * 2. Calculate number of weeks from date range
 * 3. Use Prisma nested write to create phase + weeks atomically
 * 4. Return phase and weeks data
 *
 * Error Handling:
 * - 400: Validation errors (Zod)
 * - 500: Database errors (Prisma)
 *
 * Response Format:
 * Success: { success: true, data: { phase, weeks } }
 * Error: { success: false, error: { code, message, field? } }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request
    const body = await request.json();
    const validated = createPhaseSchema.parse(body);

    // 2. Convert dates
    const startDate = new Date(validated.startDate);
    const endDate = new Date(validated.endDate);

    // 3. Calculate number of weeks
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationWeeks = Math.ceil(durationMs / (7 * 24 * 60 * 60 * 1000));

    // 4. Prepare week data for nested write
    const weeksData = [];
    for (let i = 0; i < durationWeeks; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Cap week end date at phase end date
      if (weekEnd > endDate) {
        weekEnd.setTime(endDate.getTime());
      }

      weeksData.push({
        title: `${validated.title} - Week ${i + 1}`,
        startDate: weekStart,
        endDate: weekEnd,
        status: 'NOT_STARTED' as const,
        progress: 0,
      });
    }

    // 5. Create phase + weeks using Prisma nested write (atomic, single query)
    const phase = await prisma.phase.create({
      data: {
        title: validated.title,
        description: validated.description,
        startDate,
        endDate,
        status: validated.status,
        progress: validated.progress,
        // Nested write: Create weeks inline (3x faster than manual transaction)
        weeks: {
          create: weeksData,
        },
      },
      // Include weeks in response
      include: {
        weeks: {
          orderBy: {
            startDate: 'asc',
          },
        },
      },
    });

    // 6. Success response
    return NextResponse.json(
      {
        success: true,
        data: {
          phase: {
            id: phase.id,
            title: phase.title,
            description: phase.description,
            status: phase.status,
            progress: phase.progress,
            startDate: phase.startDate.toISOString(),
            endDate: phase.endDate?.toISOString() || null,
            createdAt: phase.createdAt.toISOString(),
            updatedAt: phase.updatedAt.toISOString(),
          },
          weeks: phase.weeks.map((week) => ({
            id: week.id,
            title: week.title,
            phaseId: week.phaseId,
            startDate: week.startDate.toISOString(),
            endDate: week.endDate?.toISOString() || null,
            status: week.status,
            progress: week.progress,
          })),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // 7. Error handling

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

    // Prisma database errors (500)
    if (error?.constructor?.name === 'PrismaClientKnownRequestError') {
      console.error('[API] Prisma error in POST /api/phases:', error);
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
    console.error('[API] Unexpected error in POST /api/phases:', error);
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
