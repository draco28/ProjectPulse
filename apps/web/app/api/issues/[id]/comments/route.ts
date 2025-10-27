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

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { CommentSchema } from '@/lib/validations/issue';
import { z } from 'zod';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Extract and validate issue ID
    const { id } = await params;
    const issueId = parseInt(id, 10);

    if (isNaN(issueId)) {
      return NextResponse.json({ data: null, error: 'Invalid issue ID' }, { status: 400 });
    }

    // 2. Verify issue exists
    const issueExists = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { id: true },
    });

    if (!issueExists) {
      return NextResponse.json({ data: null, error: 'Issue not found' }, { status: 404 });
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = CommentSchema.parse(body);

    // 4. Create comment in database
    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        author: validatedData.author || 'Anonymous',
        issueId,
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
    revalidatePath(`/issues/${issueId}`);

    // 6. Return success response
    return NextResponse.json({ data: comment, error: null }, { status: 201 });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          data: null,
          error: 'Invalid comment data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma error creating comment:', error);
      return NextResponse.json(
        { data: null, error: 'Database error while creating comment' },
        { status: 500 }
      );
    }

    // Handle other errors
    console.error('Unexpected error creating comment:', error);
    return NextResponse.json({ data: null, error: 'Failed to create comment' }, { status: 500 });
  }
}
