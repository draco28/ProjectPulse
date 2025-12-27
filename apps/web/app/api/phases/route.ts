/**
 * API Route: POST /api/phases
 *
 * Purpose: Create a new phase (no auto-generated children)
 * Sprint 15: Week/Day removed - simplified 2-level hierarchy (Ticket #80)
 *
 * Pattern: Next.js 14 API Route → Zod validation → Prisma create
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
 * Create a new phase
 * Sprint 15: Week/Day removed - no auto-generated children (Ticket #80)
 *
 * Flow:
 * 1. Parse and validate request body
 * 2. Create phase record
 * 3. Return phase data
 *
 * Error Handling:
 * - 400: Validation errors (Zod)
 * - 500: Database errors (Prisma)
 *
 * Response Format:
 * Success: { success: true, data: { phase } }
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

    // 3. Create phase (Sprint 15: no nested weeks/days)
    const phase = await prisma.phase.create({
      data: {
        title: validated.title,
        description: validated.description,
        startDate,
        endDate,
        status: validated.status,
        progress: validated.progress,
      },
    });

    // 4. Success response
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
        },
      },
      { status: 201 }
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
