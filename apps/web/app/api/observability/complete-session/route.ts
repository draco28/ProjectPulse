import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

//=============================================================================
// VALIDATION SCHEMA
//=============================================================================

const requestSchema = z.object({
  sessionId: z.number().int().positive(),
  validationReport: z
    .object({
      gaps: z.array(z.string()).optional(),
      warnings: z.array(z.string()).optional(),
      overallScore: z.number().min(0).max(1).optional(),
      recommendations: z.array(z.string()).optional(),
      summary: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

//=============================================================================
// POST /api/observability/complete-session
//=============================================================================

export async function POST(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const body = await request.json();
    log.debug({ sessionId: body.sessionId, hasValidationReport: !!body.validationReport }, 'Request received');

    // 1. Validate request
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      log.warn({ error: validation.error.message }, 'Validation failed');
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { sessionId, validationReport } = validation.data;

    // 2. Verify session exists
    const session = await prisma.onboardingSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        sessionNumber: true,
        status: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found', sessionId }, { status: 404 });
    }

    // 3. Update session status and validation report
    const updatedSession = await prisma.onboardingSession.update({
      where: { id: sessionId },
      data: {
        status: 'complete',
        completedAt: new Date(),
        validationReport: (validationReport || {}) as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        sessionNumber: true,
        status: true,
        validationReport: true,
        completedAt: true,
      },
    });

    log.info({ sessionId, sessionNumber: updatedSession.sessionNumber, status: updatedSession.status }, 'Session completed');

    return NextResponse.json({
      success: true,
      sessionId,
      sessionNumber: updatedSession.sessionNumber,
      status: updatedSession.status,
      completedAt: updatedSession.completedAt,
      validationReport: updatedSession.validationReport,
      message: `Session ${updatedSession.sessionNumber} marked as completed.`,
    });
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to complete session');
    return NextResponse.json(
      {
        error: 'Failed to complete session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
