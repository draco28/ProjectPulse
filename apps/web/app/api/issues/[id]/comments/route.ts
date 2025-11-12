/**
 * Issue Comments API Route
 *
 * POST /api/issues/[id]/comments - Create a new comment on an issue
 *
 * Request body:
 * - content: string (required, 1-10000 characters)
 * - author: string (optional, defaults to 'Anonymous')
 *
 * Response format:
 * - Success: { data: Comment, error: null }
 * - Validation Error (400): { data: null, error: string, details: ZodError[] }
 * - Server Error (500): { data: null, error: string }
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { CommentSchema, IssueIdParamSchema } from '@/lib/validations/issue';
import { failure, success } from '../../_utils';
import { z } from 'zod';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = IssueIdParamSchema.parse({ id: params.id });

    // 2. Verify issue exists
    const issueExists = await prisma.issue.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!issueExists) {
      return failure({ code: 'NOT_FOUND', message: 'Issue not found', status: 404 });
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = CommentSchema.parse(body);

    // 4. Create comment in database
    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        author: validatedData.author || 'Anonymous',
        issueId: id,
      },
      select: {
        id: true,
        content: true,
        author: true,
        createdAt: true,
        updatedAt: true,
        issueId: true,
      },
    });

    // 5. Revalidate issue detail page (clears Next.js cache)
    revalidatePath(`/issues/${id}`);

    return success(comment, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid comment data',
        details: error.flatten(),
      });
    }

    console.error('[API] POST /api/issues/[id]/comments failed', error);
    return failure({
      code: 'INTERNAL_ERROR',
      message: 'Failed to create comment',
      status: 500,
    });
  }
}
