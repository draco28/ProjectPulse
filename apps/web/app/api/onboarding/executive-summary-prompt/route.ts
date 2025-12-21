/**
 * GET /api/onboarding/executive-summary-prompt
 *
 * Sprint 8.6 Phase 1 - Session 1 Prompt Template API (Agent-Side AI)
 *
 * Returns prompt template with ALL 96 answers included for agent to generate
 * executive summary with their own AI provider.
 *
 * Query Parameters:
 * - projectId: number (required) - Project ID
 *
 * Response:
 * - 200: Prompt template with all Q&A pairs
 * - 400: Validation error (missing/invalid parameters or incomplete phases)
 * - 404: Session 1 not found
 * - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOnboardingAuth, handleAuthError, AuthError } from '@/lib/onboarding-auth';

const PHASE_NAMES: Record<number, string> = {
  1: 'Product Manager - Foundation',
  2: 'Strategic Planning - Business & Tech',
  3: 'UX/UI Design - User Experience',
  4: 'System Architecture - Technical Foundation',
  5: 'DevOps & Local Development',
  6: 'Backend Development',
  7: 'Frontend Development',
  8: 'QA & Testing',
  9: 'Production Deployment',
  10: 'Security & Compliance',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectIdParam = searchParams.get('projectId');

    // Validation
    if (!projectIdParam) {
      return NextResponse.json({ error: 'projectId query parameter required' }, { status: 400 });
    }

    const projectId = parseInt(projectIdParam, 10);

    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json({ error: 'projectId must be a positive integer' }, { status: 400 });
    }

    // Sprint 12: Require authentication (session OR bearer token)
    await requireOnboardingAuth(request, projectId);

    // Fetch Session 1 data
    const session = await prisma.onboardingSession.findUnique({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 1 },
      },
    });

    if (!session || !session.response) {
      return NextResponse.json({ error: 'Session 1 not found or not started' }, { status: 404 });
    }

    const sessionData = session.response as any;
    const planningAnswers = sessionData.planningAnswers || {};
    const completedPhases = sessionData.completedPhases || [];

    // Check if all 10 phases complete
    if (completedPhases.length < 10) {
      return NextResponse.json(
        {
          error: 'All 10 phases must be complete before generating executive summary',
          completedPhases: completedPhases.length,
          requiredPhases: 10,
          missingPhases: Array.from({ length: 10 }, (_, i) => i + 1).filter(
            (p) => !completedPhases.includes(p)
          ),
        },
        { status: 400 }
      );
    }

    // Fetch all questions to build Q&A format
    const allQuestions = await prisma.onboardingQuestion.findMany({
      orderBy: [{ phase: 'asc' }, { subsection: 'asc' }, { questionNumber: 'asc' }],
    });

    // Build user prompt with ALL Q&A pairs
    let userPrompt = 'Generate an executive summary for this software project:\n\n';

    for (let phaseNum = 1; phaseNum <= 10; phaseNum++) {
      const phaseKey = `phase${phaseNum}`;
      const phaseAnswers = planningAnswers[phaseKey] || {};
      const phaseQuestions = allQuestions.filter((q) => q.phase === phaseNum);

      userPrompt += `## Phase ${phaseNum}: ${PHASE_NAMES[phaseNum]}\n\n`;

      for (const question of phaseQuestions) {
        const answer = phaseAnswers[question.id] || '(Not answered)';
        userPrompt += `**Q${question.questionNumber}: ${question.questionText}**\n`;
        userPrompt += `A: ${answer}\n\n`;
      }
    }

    userPrompt += `---\n\n`;
    userPrompt += `Generate a ~500 word executive summary covering:\n`;
    userPrompt += `- Product name, type, and target users\n`;
    userPrompt += `- Core problem and solution\n`;
    userPrompt += `- Key features (3-5)\n`;
    userPrompt += `- Tech stack\n`;
    userPrompt += `- Timeline and budget\n`;
    userPrompt += `- Success metrics\n\n`;
    userPrompt += `Write in a professional, concise style suitable for stakeholders.`;

    const systemPrompt =
      'You are a product strategist and technical writer. Generate a concise executive summary (~500 words) synthesizing all planning answers into a cohesive project vision. Focus on clarity, actionability, and strategic alignment.';

    console.log('[GET /api/onboarding/executive-summary-prompt] Prompt generated', {
      projectId,
      userPromptLength: userPrompt.length,
      questionsIncluded: allQuestions.length,
    });

    return NextResponse.json({
      systemPrompt,
      userPrompt,
      requiredSections: [
        'Product Vision',
        'Target Users',
        'Core Problem',
        'Solution Approach',
        'Key Features',
        'Tech Stack',
        'Timeline & Budget',
        'Success Metrics',
      ],
      wordCountTarget: 500,
      temperature: 0.7,
      allAnswers: planningAnswers,
      metadata: {
        totalQuestions: allQuestions.length,
        completedPhases: completedPhases.length,
        userPromptCharacters: userPrompt.length,
      },
    });
  } catch (error) {
    console.error('[GET /api/onboarding/executive-summary-prompt] Error:', error);

    // Sprint 12: Handle auth errors
    if (error instanceof AuthError) {
      return handleAuthError(error);
    }

    return NextResponse.json(
      {
        error: 'Failed to generate prompt template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
