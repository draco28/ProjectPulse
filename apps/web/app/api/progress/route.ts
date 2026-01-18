/**
 * API Route: POST /api/progress
 *
 * Purpose: Update progress for any entity (sprint/phase) and trigger roll-up
 * Sprint 15: Week/Day removed - simplified 2-level hierarchy (Ticket #80)
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
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

// Sprint 15: Week/Day removed - now 2-level hierarchy (Phase → Sprint) (Ticket #80)
const updateProgressSchema = z.object({
  entityType: z.enum(['sprint', 'phase'], {
    errorMap: () => ({ message: 'entityType must be one of: sprint, phase' }),
  }),

  entityId: z.string().uuid('entityId must be a valid UUID'),

  progress: z
    .number()
    .int('Progress must be an integer')
    .min(0, 'Progress must be between 0 and 100')
    .max(100, 'Progress must be between 0 and 100'),
});

type _UpdateProgressInput = z.infer<typeof updateProgressSchema>;

// ============================================================================
// POST HANDLER
// ============================================================================

/**
 * Update entity progress and propagate to parents
 * Sprint 15: Week/Day removed - simplified hierarchy (Ticket #80)
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
  const log = createRequestLogger(getRequestId(request));
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
      log.error({ error: error instanceof Error ? error.message : String(error) }, 'Prisma error in progress update');
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
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Unexpected error in progress update');
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
 * Sprint 15: Week/Day removed - now 2-level hierarchy (Ticket #80)
 */
async function fetchEntityWithContext(entityType: 'sprint' | 'phase', entityId: string) {
  switch (entityType) {
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
