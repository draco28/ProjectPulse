/**
 * API Route: PUT /api/:entity/:id/progress
 *
 * Purpose: Update entity progress with automatic parent propagation
 *
 * Pattern: Next.js 14 Dynamic Route → Zod validation → Progress utility
 *
 * Performance: Uses incremental transactions (one level at a time)
 * See: lib/db/progress.ts, .agent/task/prisma-progress-api-20251109-0015.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateProgressAndPropagate } from '@/lib/db/progress';
import { EntityTypeSchema, UpdateProgressSchema, entityTypeMap } from '@/lib/validations/progress';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

// Force dynamic rendering (no caching for progress updates)
export const dynamic = 'force-dynamic';

// ============================================================================
// PATH PARAMS TYPE
// ============================================================================

type RouteParams = {
  entity: string;
  id: string;
};

// ============================================================================
// PUT HANDLER
// ============================================================================

export async function PUT(request: NextRequest, { params }: { params: RouteParams }) {
  const log = createRequestLogger(getRequestId(request));
  try {
    // 1. Validate path parameters
    const entity = EntityTypeSchema.parse(params.entity);
    const entityId = z.string().cuid('Invalid entity ID format').parse(params.id);

    // 2. Validate request body
    const body = await request.json();
    const { progress } = UpdateProgressSchema.parse(body);

    // 3. Map entity type (plural → singular for utility function)
    const entityType = entityTypeMap[entity];

    // 4. Call progress utility (with propagation tracking)
    const result = await updateProgressAndPropagate(entityId, entityType, progress);

    // 5. Success response
    return NextResponse.json(
      {
        success: true,
        data: {
          entity: result.entity,
          propagation: {
            updated: result.propagated,
            totalAffected: result.propagated.length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // 6. Error handling

    // Zod validation errors (400)
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

    // Entity not found (404)
    if (
      error?.constructor?.name === 'PrismaClientKnownRequestError' &&
      (error as any).code === 'P2025'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Entity not found`,
          },
        },
        { status: 404 }
      );
    }

    // Database errors (500)
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
