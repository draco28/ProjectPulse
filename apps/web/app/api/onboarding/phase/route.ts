/**
 * POST /api/onboarding/phase
 *
 * Sprint 9 Refactor: Save phase answers to OnboardingSession.planningAnswers
 * Replaces nested response JSONB with explicit planningAnswers field
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireOnboardingAuth, handleAuthError, AuthError } from '@/lib/onboarding-auth';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import type { Prisma } from '@prisma/client';

// Type definitions for onboarding session JSON fields
type AnswerValue = string | number | string[];
type PhaseAnswers = Record<string, AnswerValue>;
type PlanningAnswers = Record<string, PhaseAnswers>;

interface ProjectContextMetadata {
  projectName?: string;
  techStack?: string[];
}

interface ProjectContext {
  metadata?: ProjectContextMetadata;
  phases?: Record<string, PhaseAnswers>;
  [key: string]: unknown; // Allow index access for Prisma JSON compatibility
}

interface SessionMetrics {
  tokensUsed: number;
  phasesComplete: number;
  lastPhaseAt?: string;
}

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const requestSchema = z.object({
  projectId: z.number().int().positive(),
  phase: z.number().int().min(1).max(10),
  answers: z.record(z.union([z.string(), z.number(), z.array(z.string())])),
});

type PhaseRequest = z.infer<typeof requestSchema>;

// ============================================================================
// HELPER: Merge phase answers into project context
// ============================================================================

function mergePhaseToContext(
  existingContext: ProjectContext | null,
  phase: number,
  answers: PhaseAnswers
): ProjectContext {
  const context: ProjectContext = existingContext || {};

  // Ensure nested objects exist
  if (!context.metadata) context.metadata = {};
  if (!context.phases) context.phases = {};

  // Add phase answers
  context.phases[`phase${phase}`] = answers;

  // Update metadata if phase 1 or 2 (contains key project info)
  if (phase === 1 && answers.phase1_q1) {
    context.metadata.projectName = String(answers.phase1_q1);
  }

  if (phase === 2 && answers.phase2_q1) {
    const value = answers.phase2_q1;
    context.metadata.techStack = Array.isArray(value)
      ? value.map(String)
      : [String(value)];
  }

  return context;
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  log.info({}, 'Saving phase answers');

  try {
    // 1. Validate request
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      log.warn({ error: validation.error }, 'Validation failed');

      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { projectId, phase, answers }: PhaseRequest = validation.data;

    log.info({ projectId, phase, answerCount: Object.keys(answers).length }, 'Request validated');

    // Sprint 12: Require authentication (session OR bearer token)
    await requireOnboardingAuth(request, projectId);

    // 2. Get or create OnboardingSession (sessionNumber: 1)
    let session = await prisma.onboardingSession.findUnique({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 1 },
      },
      select: {
        id: true,
        planningAnswers: true,
        projectContextJson: true,
        metrics: true,
        status: true,
      },
    });

    if (!session) {
      log.info({}, 'Creating new Session 1');

      session = await prisma.onboardingSession.create({
        data: {
          projectId,
          sessionNumber: 1,
          status: 'in_progress',
          startedAt: new Date(),
          planningAnswers: {},
          projectContextJson: {},
          metrics: {
            tokensUsed: 0,
            phasesComplete: 0,
          },
        },
        select: {
          id: true,
          planningAnswers: true,
          projectContextJson: true,
          metrics: true,
          status: true,
        },
      });

      log.info({ sessionId: session.id }, 'Session 1 created');
    }

    // 3. Merge answers into planningAnswers
    const currentAnswers = (session.planningAnswers as PlanningAnswers | null) || {};
    const updatedAnswers = {
      ...currentAnswers,
      [`phase${phase}`]: answers,
    };

    // 4. Merge into projectContextJson
    const updatedContext = mergePhaseToContext(session.projectContextJson as ProjectContext | null, phase, answers);

    // 5. Update metrics
    const currentMetrics = (session.metrics as SessionMetrics | null) || { tokensUsed: 0, phasesComplete: 0 };
    const updatedMetrics = {
      ...currentMetrics,
      phasesComplete: phase,
      lastPhaseAt: new Date().toISOString(),
    };

    // 6. Update session in database
    const isComplete = phase === 10;

    await prisma.onboardingSession.update({
      where: { id: session.id },
      data: {
        planningAnswers: updatedAnswers as unknown as Prisma.InputJsonValue,
        projectContextJson: updatedContext as unknown as Prisma.InputJsonValue,
        metrics: updatedMetrics as unknown as Prisma.InputJsonValue,
        status: isComplete ? 'complete' : 'in_progress',
        completedAt: isComplete ? new Date() : undefined,
      },
    });

    log.info({ projectId, phase, phasesComplete: phase, isComplete }, 'Phase answers saved');

    // 7. Calculate progress
    const phasesComplete = phase;
    const progress = (phasesComplete / 10) * 100;
    const nextPhase = phase < 10 ? phase + 1 : null;

    return NextResponse.json({
      success: true,
      projectId,
      phase,
      completedPhases: phasesComplete,
      progress,
      nextPhase,
      readyForExecutiveSummary: phase === 10,
      message: `Phase ${phase} saved ✅. ${nextPhase ? `Proceed to Phase ${nextPhase}.` : 'All phases complete! Call finalizeSummary.'}`,
    });
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to save phase answers');

    // Sprint 12: Handle auth errors
    if (error instanceof AuthError) {
      return handleAuthError(error);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to save phase answers', message: errorMessage },
      { status: 500 }
    );
  }
}
