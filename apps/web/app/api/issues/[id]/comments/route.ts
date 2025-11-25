/**
 * Issue Comments API Route (Sprint 10 - Backwards Compatible Wrapper)
 *
 * POST /api/issues/[id]/comments - Create a new comment on an issue/ticket
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
import { CommentSchema } from '@/lib/validations/issue';
import { TicketIdParamSchema } from '@/lib/validations/ticket';
import { failure, success } from '../../../tickets/_utils';
import { z } from 'zod';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const { id } = TicketIdParamSchema.parse({ id: rawId });

    // 2. Verify ticket exists
    const ticketExists = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!ticketExists) {
      return failure({ code: 'NOT_FOUND', message: 'Issue not found', status: 404 });
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = CommentSchema.parse(body);

    // 4. Create comment in database (TicketComment)
    const comment = await prisma.ticketComment.create({
      data: {
        content: validatedData.content,
        author: validatedData.author || 'Anonymous',
        ticketId: id,
      },
      select: {
        id: true,
        content: true,
        author: true,
        createdAt: true,
        updatedAt: true,
        ticketId: true,
      },
    });

    // 5. Revalidate issue/ticket detail pages (clears Next.js cache)
    revalidatePath(`/issues/${id}`);
    revalidatePath(`/tickets/${id}`);

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
