/**
 * Checkpoint API Route
 *
 * POST /api/checkpoints - Create checkpoint to save agent progress
 *
 * Checkpoints track agent progress every 15K tokens for context recovery.
 * Sequential numbering per session enables easy checkpoint ordering.
 *
 * @see {@link file://./lib/validation/checkpoint.ts} for validation schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateCheckpointSchema } from '@/lib/validation/checkpoint';
import { ApiResponse } from '@/lib/types/api';

/**
 * POST /api/checkpoints
 *
 * Create a new checkpoint for a session.
 *
 * Request body:
 * - sessionId (string): Session ID (CUID)
 * - notes (string): Checkpoint notes (1-5000 chars)
 * - tokenUsage (number): Current token usage (0-200000)
 * - sessionContext (object, optional): Session context snapshot
 *
 * Returns:
 * - 201: Checkpoint created successfully
 * - 400: Validation error
 * - 404: Session not found
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validationResult = CreateCheckpointSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid checkpoint data',
            details: validationResult.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { sessionId, notes, tokenUsage, sessionContext } = validationResult.data;

    // 2. Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });

    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: `Session with ID ${sessionId} not found`,
          },
        },
        { status: 404 }
      );
    }

    // 3. Get next checkpoint number for this session
    const lastCheckpoint = await prisma.checkpoint.findFirst({
      where: { sessionId },
      orderBy: { checkpointNumber: 'desc' },
      select: { checkpointNumber: true },
    });

    const checkpointNumber = (lastCheckpoint?.checkpointNumber ?? 0) + 1;

    // 4. Create checkpoint
    const checkpoint = await prisma.checkpoint.create({
      data: {
        sessionId,
        notes,
        tokenUsage,
        sessionContext: sessionContext ?? null,
        checkpointNumber,
      },
    });

    // 5. Return success response
    return NextResponse.json<ApiResponse<typeof checkpoint>>(
      {
        data: checkpoint,
        error: null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/checkpoints] Error:', error);

    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create checkpoint',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
