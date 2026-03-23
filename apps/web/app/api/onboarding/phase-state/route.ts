/**
 * GET /api/onboarding/phase-state
 *
 * Returns the current progress and state for Session 1 (Strategic Planning).
 * Used by the UI to hydrate state from the database, allowing it to sync with MCP agent progress.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOnboardingAuth, handleAuthError, AuthError } from '@/lib/onboarding-auth';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

// Type definitions for session JSON fields
interface SessionMetrics {
  phasesComplete?: number;
  tokensUsed?: number;
  [key: string]: unknown;
}

type AnswerValue = string | number | string[];
type PhaseAnswers = Record<string, AnswerValue>;
type PlanningAnswers = Record<string, PhaseAnswers>;

export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectIdParam = searchParams.get('projectId');

    if (!projectIdParam) {
      return NextResponse.json({ error: 'projectId query parameter required' }, { status: 400 });
    }

    const projectId = parseInt(projectIdParam, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'projectId must be a valid number' }, { status: 400 });
    }

    // Sprint 12: Require authentication (session OR bearer token)
    await requireOnboardingAuth(request, projectId);

    const session = await prisma.onboardingSession.findUnique({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 1 },
      },
      select: {
        id: true,
        status: true,
        planningAnswers: true,
        metrics: true,
      },
    });

    if (!session) {
      // No session started yet
      return NextResponse.json({
        currentPhase: 1,
        completedPhases: [],
        answers: {},
        status: 'pending',
      });
    }

    const metrics = (session.metrics as SessionMetrics | null) || {};
    const planningAnswers = (session.planningAnswers as PlanningAnswers | null) || {};

    // Calculate current phase based on completion
    const phasesComplete = metrics.phasesComplete || 0;
    let currentPhase = phasesComplete + 1;
    if (currentPhase > 10) currentPhase = 10;

    // If status is complete, we might be reviewing
    if (session.status === 'complete') {
      currentPhase = 10; // Or stay at 10?
    }

    // Derive completed phases array
    const completedPhases = Array.from({ length: phasesComplete }, (_, i) => i + 1);

    return NextResponse.json({
      currentPhase,
      completedPhases,
      answers: planningAnswers,
      status: session.status,
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to fetch phase state'
    );

    // Sprint 12: Handle auth errors
    if (error instanceof AuthError) {
      return handleAuthError(error);
    }

    return NextResponse.json({ error: 'Failed to fetch phase state' }, { status: 500 });
  }
}
