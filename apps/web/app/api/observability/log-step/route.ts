import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

//=============================================================================
// VALIDATION SCHEMA
//=============================================================================

const requestSchema = z.object({
  sessionId: z.number().int().positive(),
  stepName: z.string().min(1).max(200),
  metadata: z.object({
    tokensUsed: z.number().optional(),
    quality: z.string().optional(),
    warnings: z.array(z.string()).optional(),
    filesCreated: z.array(z.string()).optional(),
    filesModified: z.array(z.string()).optional(),
    errors: z.array(z.string()).optional()
  }).passthrough().optional()
});

//=============================================================================
// POST /api/observability/log-step
//=============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[POST /api/observability/log-step] Request received', {
      sessionId: body.sessionId,
      stepName: body.stepName
    });
    
    // 1. Validate request
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      console.error('[POST /api/observability/log-step] Validation failed', validation.error);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
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
        metrics: true
      }
    });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found', sessionId },
        { status: 404 }
      );
    }
    
    // 3. Get current metrics and add new action
    const currentMetrics = (session.metrics as any) || {};
    const actions = currentMetrics.actions || [];
    
    const newAction = {
      timestamp: new Date().toISOString(),
      stepName,
      metadata: metadata || {}
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
          totalSteps: actions.length
        }
      },
      select: {
        id: true,
        sessionNumber: true,
        metrics: true
      }
    });
    
    console.log('[POST /api/observability/log-step] Action logged', {
      sessionId,
      stepName,
      totalSteps: actions.length
    });
    
    return NextResponse.json({
      success: true,
      sessionId,
      sessionNumber: updatedSession.sessionNumber,
      stepName,
      totalSteps: actions.length,
      message: `Step "${stepName}" logged. Total: ${actions.length} steps.`
    });
    
  } catch (error) {
    console.error('[POST /api/observability/log-step] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to log step',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
