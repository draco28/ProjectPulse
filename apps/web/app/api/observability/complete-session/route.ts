import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
  try {
    const body = await request.json();
    console.log('[POST /api/observability/complete-session] Request received', {
      sessionId: body.sessionId,
      hasValidationReport: !!body.validationReport,
    });

    // 1. Validate request
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      console.error(
        '[POST /api/observability/complete-session] Validation failed',
        validation.error
      );
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

    console.log('[POST /api/observability/complete-session] Session completed', {
      sessionId,
      sessionNumber: updatedSession.sessionNumber,
      status: updatedSession.status,
    });

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
    console.error('[POST /api/observability/complete-session] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
