/**
 * Backlog Items API
 *
 * GET /api/backlog - Get backlog items for a project
 *
 * Query params:
 * - projectId: Required, project ID
 * - sprintNumber: Optional, filter by sprint
 * - epicRef: Optional, filter by epic reference
 *
 * Sprint 14: Enables agent workflow for ticket creation with traceability
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  projectId: z.coerce.number().int().positive().optional(),
  sprintNumber: z.coerce.number().int().positive().optional(),
  epicRef: z.string().optional(),
});

function success<T>(data: T, status = 200) {
  return Response.json({ data, error: null }, { status });
}

function failure({
  code,
  message,
  status = 400,
  details,
}: {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}) {
  return Response.json({ data: null, error: { code, message, details } }, { status });
}

/**
 * GET /api/backlog
 *
 * Returns backlog items with traceability data ready for ticket creation.
 * Can filter by sprint number or epic reference.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params = {
      projectId: url.searchParams.get('projectId') ?? undefined,
      sprintNumber: url.searchParams.get('sprintNumber') ?? undefined,
      epicRef: url.searchParams.get('epicRef') ?? undefined,
    };

    const query = QuerySchema.parse(params);

    // Authenticate and get project
    const { projectId } = await getAuthorizedProjectId(request, query.projectId);

    // Build where clause
    const where: {
      projectId: number;
      sprintNumber?: number;
      epicRef?: { contains: string; mode: 'insensitive' };
    } = {
      projectId,
    };

    if (query.sprintNumber) {
      where.sprintNumber = query.sprintNumber;
    }

    if (query.epicRef) {
      where.epicRef = {
        contains: query.epicRef,
        mode: 'insensitive',
      };
    }

    // Fetch backlog items
    const items = await prisma.backlogItem.findMany({
      where,
      orderBy: [{ sprintNumber: 'asc' }, { itemId: 'asc' }],
      select: {
        id: true,
        itemId: true,
        title: true,
        epicRef: true,
        frTraces: true,
        nfrTraces: true,
        sprintNumber: true,
        sourceDoc: true,
        createdAt: true,
        updatedAt: true,
        // Exclude rawBlock by default to reduce payload size
      },
    });

    // Group by sprint for convenience
    const sprintGroups: Record<string, typeof items> = {};
    const unassigned: typeof items = [];

    for (const item of items) {
      if (item.sprintNumber) {
        const key = `sprint_${item.sprintNumber}`;
        if (!sprintGroups[key]) {
          sprintGroups[key] = [];
        }
        sprintGroups[key].push(item);
      } else {
        unassigned.push(item);
      }
    }

    return success({
      items,
      totalCount: items.length,
      sprintGroups,
      unassigned,
      filters: {
        projectId,
        sprintNumber: query.sprintNumber ?? null,
        epicRef: query.epicRef ?? null,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return failure({ code: error.code, message: error.message, status: error.status });
    }

    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        details: error.flatten(),
      });
    }

    console.error('[API] GET /api/backlog failed', error);
    return failure({
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch backlog items',
      status: 500,
    });
  }
}
