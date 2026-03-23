/**
 * GET /api/onboarding/summary-prompt
 *
 * Sprint 9 Refactor: Get executive summary prompt template with all 96 Q&A pairs injected
 * Returns systemPrompt + userPrompt for agent-side AI generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireOnboardingAuth, handleAuthError, AuthError } from '@/lib/onboarding-auth';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

// Type definitions for session JSON fields
type AnswerValue = string | number | string[];
type PhaseAnswers = Record<string, AnswerValue>;
type PlanningAnswers = Record<string, PhaseAnswers>;
type TemplateVariables = Record<string, PhaseAnswers>;

interface SessionMetrics {
  phasesComplete: number;
  tokensUsed?: number;
}

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const querySchema = z.object({
  projectId: z.string().transform(Number).pipe(z.number().int().positive()),
});

// ============================================================================
// HELPER: Inject variables into template
// ============================================================================

function injectVariables(template: string, variables: TemplateVariables): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    const replacement = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);

    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacement);
  }

  return result;
}

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  log.info({}, 'Fetching executive summary prompt');

  try {
    // 1. Validate query params
    const searchParams = request.nextUrl.searchParams;
    const validation = querySchema.safeParse({
      projectId: searchParams.get('projectId'),
    });

    if (!validation.success) {
      log.warn({ error: validation.error }, 'Validation failed');

      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { projectId } = validation.data;

    log.info({ projectId }, 'Request validated');

    // Sprint 12: Require authentication (session OR bearer token)
    await requireOnboardingAuth(request, projectId);

    // 2. Get Session 1 with all phase answers
    const session = await prisma.onboardingSession.findUnique({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 1 },
      },
      select: {
        planningAnswers: true,
        projectContextJson: true,
        metrics: true,
      },
    });

    if (!session) {
      log.warn({}, 'Session 1 not found');

      return NextResponse.json(
        { error: 'Session 1 not found', hint: 'Complete at least one phase first' },
        { status: 404 }
      );
    }

    const planningAnswers = (session.planningAnswers as PlanningAnswers | null) || {};
    const metrics = (session.metrics as SessionMetrics | null) || { phasesComplete: 0 };

    log.info({ phasesComplete: metrics.phasesComplete }, 'Session found');

    // 3. Fetch prompt template from OnboardingPromptTemplate
    const template = await prisma.onboardingPromptTemplate.findFirst({
      where: {
        name: 'onboarding-session-1-executive-summary',
        isActive: true,
      },
      select: {
        systemPrompt: true,
        userPrompt: true,
        temperature: true,
        maxTokens: true,
        variables: true,
      },
    });

    if (!template) {
      log.warn({}, 'Template not found');

      return NextResponse.json(
        {
          error: 'Executive summary template not found',
          hint: 'Run database seed to create templates',
        },
        { status: 404 }
      );
    }

    log.info({}, 'Template found');

    // 4. Inject all 96 Q&A pairs into userPrompt
    const variables: TemplateVariables = {};

    for (let phase = 1; phase <= 10; phase++) {
      variables[`phase${phase}Answers`] = planningAnswers[`phase${phase}`] || {};
    }

    const userPrompt = injectVariables(template.userPrompt, variables);

    // 5. Calculate metadata
    const metadata = {
      totalQuestions: 96,
      totalPhases: 10,
      completedPhases: metrics.phasesComplete,
      userPromptCharacters: userPrompt.length,
      estimatedTokens: Math.ceil(userPrompt.length / 3), // Rough estimate: 1 token ≈ 3 chars
    };

    log.info({ ...metadata }, 'Prompt ready');

    return NextResponse.json({
      projectId,
      systemPrompt: template.systemPrompt,
      userPrompt,
      metadata,
      wordCountTarget: 500,
      temperature: template.temperature,
      maxTokens: template.maxTokens,
      guidance: 'Generate the summary now with your AI provider, then call storeExecutiveSummary.',
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to fetch executive summary prompt'
    );

    // Sprint 12: Handle auth errors
    if (error instanceof AuthError) {
      return handleAuthError(error);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to fetch executive summary prompt', message: errorMessage },
      { status: 500 }
    );
  }
}
