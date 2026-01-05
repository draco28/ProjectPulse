/**
 * Hierarchy Query API Route
 *
 * GET /api/hierarchy/query - Query hierarchy entities with filters
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 *
 * Implements US-007 (partial - status + progress filters only).
 * Date range filtering deferred to Sprint 2 for full US-007 completion.
 *
 * @see {@link file://./lib/validation/hierarchy-query.ts} for validation schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HierarchyQuerySchema, type EntityLevel } from '@/lib/validation/hierarchy-query';
import { ApiResponse } from '@/lib/types/api';
import type { Prisma } from '@prisma/client';
import { requireAuth, AuthError } from '@/lib/auth/validateRequest';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

// Force dynamic rendering (no caching for query results)
export const dynamic = 'force-dynamic';

/**
 * Build Prisma where clause for common filters (status + progress)
 */
function buildWhereClause(filters: {
  status?: string[];
  progressMin?: number;
  progressMax?: number;
}): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  // Status filter (OR logic - match any of the provided statuses)
  if (filters.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }

  // Progress range filter
  if (filters.progressMin !== undefined || filters.progressMax !== undefined) {
    where.progress = {};
    if (filters.progressMin !== undefined) {
      (where.progress as Record<string, number>).gte = filters.progressMin;
    }
    if (filters.progressMax !== undefined) {
      (where.progress as Record<string, number>).lte = filters.progressMax;
    }
  }

  return where;
}

/**
 * GET /api/hierarchy/query
 *
 * Query hierarchy entities with filters.
 *
 * Sprint 15: Simplified to 2-level hierarchy (Week/Day removed)
 *
 * Query parameters:
 * - level: "phase" | "sprint" (required)
 * - status[]: Status filter (can pass multiple, e.g., ?status=IN_PROGRESS&status=BLOCKED)
 * - progressMin: Minimum progress (0-100)
 * - progressMax: Maximum progress (0-100)
 * - page: Page number (default 1)
 * - limit: Results per page (default 20, max 100)
 *
 * Returns:
 * - 200: Paginated array of entities with parent context
 * - 400: Validation error
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));

  try {
    // Authenticate request
    await requireAuth(request);

    const { searchParams } = new URL(request.url);

    // 1. Parse and validate query parameters
    const queryInput = {
      level: searchParams.get('level'),
      status: searchParams.getAll('status'),
      progressMin: searchParams.get('progressMin'),
      progressMax: searchParams.get('progressMax'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    };

    const validationResult = HierarchyQuerySchema.safeParse(queryInput);

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validationResult.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { level, status, progressMin, progressMax, page, limit } = validationResult.data;

    // 2. Build common where clause
    const where = buildWhereClause({ status, progressMin, progressMax });

    // 3. Calculate pagination
    const skip = (page - 1) * limit;

    // 4. Query based on entity level (with parent context)
    let entities;
    let total;

    switch (level) {
      case 'phase': {
        [entities, total] = await Promise.all([
          prisma.phase.findMany({
            where: where as Prisma.PhaseWhereInput,
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              progress: true,
              startDate: true,
              endDate: true,
              createdAt: true,
              // Sprint 8.5: Include roadmap parent context
              roadmap: {
                select: {
                  id: true,
                  currentPhase: true,
                },
              },
            },
            orderBy: { startDate: 'desc' },
            skip,
            take: limit,
          }),
          prisma.phase.count({ where: where as Prisma.PhaseWhereInput }),
        ]);
        break;
      }

      // Sprint 15: Sprint level query (leaf node in 2-level hierarchy)
      case 'sprint': {
        [entities, total] = await Promise.all([
          prisma.sprint.findMany({
            where: where as Prisma.SprintWhereInput,
            select: {
              id: true,
              sprintNumber: true,
              title: true,
              description: true,
              status: true,
              progress: true,
              startDate: true,
              endDate: true,
              createdAt: true,
              // Parent context
              phase: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  progress: true,
                },
              },
            },
            orderBy: { startDate: 'desc' },
            skip,
            take: limit,
          }),
          prisma.sprint.count({ where: where as Prisma.SprintWhereInput }),
        ]);
        break;
      }

      // Sprint 15: Week/Day cases removed - hierarchy now 2-level (Phase → Sprint)
      // Tickets link to Sprints via sprintId FK for Kanban board
    }

    // 5. Return paginated results
    return NextResponse.json<
      ApiResponse<{
        entities: unknown[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>
    >(
      {
        data: {
          entities,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: {
            code: 'AUTH_ERROR',
            message: error.message,
          },
        },
        { status: error.status }
      );
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Hierarchy query failed');

    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to query hierarchy',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
