/**
 * Issue Status Update API Route
 *
 * PATCH /api/issues/[id]/status - Update issue status
 *
 * Request body:
 * - status: 'open' | 'in_progress' | 'closed' (required)
 *
 * Response format:
 * - Success: { data: Issue, error: null }
 * - Validation Error (400): { data: null, error: string, details: ZodError[] }
 * - Not Found (404): { data: null, error: string }
 * - Server Error (500): { data: null, error: string }
 *
 * Side effects:
 * - Sets closedAt timestamp when status changes to 'closed'
 * - Clears closedAt when status changes from 'closed' to other status
 * - Revalidates both /issues and /issues/[id] pages
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { IssueIdParamSchema, StatusUpdateSchema } from '@/lib/validations/issue';
import { resolveStatusValue } from '@/lib/issues/options';
import { failure, success } from '../../_utils';
import { z } from 'zod';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = IssueIdParamSchema.parse({ id: params.id });

    // 2. Parse and validate request body
    const body = await request.json();
    const { status: requestedStatus } = StatusUpdateSchema.parse(body);
    const status = await resolveStatusValue(requestedStatus);

    // 3. Update issue status in database
    const issue = await prisma.issue.update({
      where: { id },
      data: {
        status,
        // Set closedAt timestamp when closing, clear it when reopening
        closedAt: status === 'closed' ? new Date() : null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        module: true,
        assignee: true,
        createdAt: true,
        updatedAt: true,
        closedAt: true,
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
    });

    // 4. Revalidate both list and detail pages
    revalidatePath('/issues');
    revalidatePath(`/issues/${id}`);

    return success(issue);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid status value',
        details: error.flatten(),
      });
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return failure({ code: 'NOT_FOUND', message: 'Issue not found', status: 404 });
    }

    console.error('[API] PATCH /api/issues/[id]/status failed', error);
    return failure({
      code: 'INTERNAL_ERROR',
      message: 'Failed to update issue status',
      status: 500,
    });
  }
}
