import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import type { Prisma } from '@prisma/client';

// Type definitions for session metrics
interface ActionMetadata {
  tokensUsed?: number;
  quality?: string;
  warnings?: string[];
  filesCreated?: string[];
  filesModified?: string[];
  errors?: string[];
  [key: string]: unknown;
}

interface LogAction {
  timestamp: string;
  stepName: string;
  metadata: ActionMetadata;
}

interface SessionMetrics {
  actions?: LogAction[];
  lastActionAt?: string;
  totalSteps?: number;
  [key: string]: unknown;
}

//=============================================================================
// VALIDATION SCHEMA
//=============================================================================

const requestSchema = z.object({
  sessionId: z.number().int().positive(),
  stepName: z.string().min(1).max(200),
  metadata: z
    .object({
      tokensUsed: z.number().optional(),
      quality: z.string().optional(),
      warnings: z.array(z.string()).optional(),
      filesCreated: z.array(z.string()).optional(),
      filesModified: z.array(z.string()).optional(),
      errors: z.array(z.string()).optional(),
    })
    .passthrough()
    .optional(),
});

//=============================================================================
// POST /api/observability/log-step
//=============================================================================

export async function POST(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const body = await request.json();
    log.debug({ sessionId: body.sessionId, stepName: body.stepName }, 'Request received');

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

    const { sessionId, stepName, metadata } = validation.data;

    // 2. Verify session exists
    const session = await prisma.onboardingSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        sessionNumber: true,
        metrics: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found', sessionId }, { status: 404 });
    }

    // 3. Get current metrics and add new action
    const currentMetrics = (session.metrics as SessionMetrics | null) || {};
    const actions: LogAction[] = currentMetrics.actions || [];

    const newAction = {
      timestamp: new Date().toISOString(),
      stepName,
      metadata: metadata || {},
    };

    actions.push(newAction);

    // 4. Update session metrics
    const updatedSession = await prisma.onboardingSession.update({
      where: { id: sessionId },
      data: {
        metrics: {
          ...currentMetrics,
          actions,
          lastActionAt: new Date().toISOString(),
          totalSteps: actions.length,
        } as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        sessionNumber: true,
        metrics: true,
      },
    });

    log.info({ sessionId, stepName, totalSteps: actions.length }, 'Action logged');

    return NextResponse.json({
      success: true,
      sessionId,
      sessionNumber: updatedSession.sessionNumber,
      stepName,
      totalSteps: actions.length,
      message: `Step "${stepName}" logged. Total: ${actions.length} steps.`,
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to log step'
    );
    return NextResponse.json(
      {
        error: 'Failed to log step',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
