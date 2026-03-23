/**
 * POST /api/onboarding/answers
 *
 * Sprint 8.6 Phase 1 - Session 1 Answers API
 *
 * Save user answers for a specific phase
 *
 * Request Body:
 * - projectId: number (required) - Project ID
 * - phase: number (required) - Phase number (1-10)
 * - answers: Record<string, any> (required) - Answer data keyed by question ID
 *
 * Response:
 * - 200: Answers saved successfully
 * - 400: Validation error
 * - 404: Project not found
 * - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireOnboardingAuth, handleAuthError, AuthError } from '@/lib/onboarding-auth';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

// Type definitions for session response data
type AnswerValue = string | number | string[];
type PhaseAnswers = Record<string, AnswerValue>;

interface SessionResponse {
  planningAnswers?: Record<string, PhaseAnswers>;
  completedPhases?: number[];
  currentPhase?: number;
  lastUpdated?: string;
  [key: string]: unknown;
}

const answerSchema = z.object({
  projectId: z.number().int().positive('Project ID must be positive'),
  phase: z.number().int().min(1, 'Phase must be 1-10').max(10, 'Phase must be 1-10'),
  answers: z.record(z.string(), z.any()).refine((data) => Object.keys(data).length > 0, {
    message: 'answers must contain at least one answer',
  }),
});

export async function POST(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const body = await request.json();
    const validation = answerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { projectId, phase, answers } = validation.data;

    // Sprint 12: Require authentication (session OR bearer token)
    await requireOnboardingAuth(request, projectId);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch or create Session 1
    const existingSession = await prisma.onboardingSession.findUnique({
      where: {
        projectId_sessionNumber: {
          projectId,
          sessionNumber: 1,
        },
      },
    });

    const now = new Date();
    const existingResponse = (existingSession?.response as SessionResponse | null) || {};
    const existingPlanningAnswers = existingResponse.planningAnswers || {};
    const existingCompletedPhases = existingResponse.completedPhases || [];

    // Add current phase to completed phases (unique)
    const completedPhases = Array.from(new Set([...existingCompletedPhases, phase])).sort(
      (a, b) => a - b
    );

    // Build updated response
    const updatedResponse = {
      ...existingResponse,
      planningAnswers: {
        ...existingPlanningAnswers,
        [`phase${phase}`]: answers,
      },
      completedPhases,
      currentPhase: phase,
      lastUpdated: now.toISOString(),
    };

    // Upsert session
    const session = await prisma.onboardingSession.upsert({
      where: {
        projectId_sessionNumber: {
          projectId,
          sessionNumber: 1,
        },
      },
      update: {
        response: updatedResponse,
        status: completedPhases.length === 10 ? 'complete' : 'in_progress',
        completedAt: completedPhases.length === 10 ? now : null,
        updatedAt: now,
      },
      create: {
        projectId,
        sessionNumber: 1,
        status: completedPhases.length === 10 ? 'complete' : 'in_progress',
        response: updatedResponse,
        startedAt: now,
        completedAt: completedPhases.length === 10 ? now : null,
      },
    });

    // Check if all 10 phases complete
    const allComplete = completedPhases.length === 10;
    const nextPhase = allComplete ? null : Math.min(10, Math.max(...completedPhases) + 1);

    return NextResponse.json({
      success: true,
      phase,
      answersStored: Object.keys(answers).length,
      completedPhases,
      nextPhase,
      readyForExecutiveSummary: allComplete,
      sessionStatus: session.status,
    });
  } catch (error) {
    // Sprint 12: Handle auth errors
    if (error instanceof AuthError) {
      return handleAuthError(error);
    }

    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to save answers'
    );
    return NextResponse.json(
      {
        error: 'Failed to save answers',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
