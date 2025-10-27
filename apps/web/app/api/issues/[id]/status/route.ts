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

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { StatusUpdateSchema } from '@/lib/validations/issue';
import { z } from 'zod';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Extract and validate issue ID
    const { id } = await params;
    const issueId = parseInt(id, 10);

    if (isNaN(issueId)) {
      return NextResponse.json({ data: null, error: 'Invalid issue ID' }, { status: 400 });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const { status } = StatusUpdateSchema.parse(body);

    // 3. Update issue status in database
    const issue = await prisma.issue.update({
      where: { id: issueId },
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
    revalidatePath('/issues'); // Refresh issues list
    revalidatePath(`/issues/${issueId}`); // Refresh issue detail

    // 5. Return success response
    return NextResponse.json({ data: issue, error: null }, { status: 200 });
  } catch (error) {
    // Handle not found error (Prisma will throw if issue doesn't exist)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ data: null, error: 'Issue not found' }, { status: 404 });
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          data: null,
          error: 'Invalid status value',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle other Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma error updating issue status:', error);
      return NextResponse.json(
        { data: null, error: 'Database error while updating status' },
        { status: 500 }
      );
    }

    // Handle other errors
    console.error('Unexpected error updating issue status:', error);
    return NextResponse.json(
      { data: null, error: 'Failed to update issue status' },
      { status: 500 }
    );
  }
}
