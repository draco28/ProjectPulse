/**
 * GET /api/onboarding/doc-batch
 *
 * Sprint 9 Refactor: Get prompts for a batch of documents (waterfall generation)
 * Returns batch-specific prompts from OnboardingPromptTemplate with injected context
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireOnboardingAuth, handleAuthError, AuthError } from '@/lib/onboarding-auth';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const querySchema = z.object({
  projectId: z.string().transform(Number).pipe(z.number().int().positive()),
  batch: z.string().transform(Number).pipe(z.number().int().min(1).max(4)),
});

// ============================================================================
// BATCH CONFIGURATIONS
// ============================================================================

const BATCH_CONFIGS = {
  1: {
    name: 'Planning',
    docs: ['01-PRD.md', '02-SRS.md', '12-Backlog.md', '13-Project-Plan.md'],
    category: 'planning',
    estimatedTokens: 45000,
  },
  2: {
    name: 'Architecture',
    docs: ['03-Architecture.md', '04-Data-Model.md', '05-API-Spec.md'],
    category: 'architecture',
    estimatedTokens: 35000,
  },
  3: {
    name: 'Implementation',
    docs: ['06-UI-UX.md', '07-Security.md', '08-Testing.md'],
    category: 'implementation',
    estimatedTokens: 35000,
  },
  4: {
    name: 'Operations',
    docs: [
      '09-Deployment.md',
      '10-Observability.md',
      '11-Performance.md',
      '14-Team-Onboarding.md',
      '15-Maintenance.md',
    ],
    category: 'operations',
    estimatedTokens: 50000,
  },
} as const;

// ============================================================================
// HELPER: Inject variables into template
// ============================================================================

function injectVariables(template: string, variables: Record<string, any>): string {
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
  console.log('[GET /api/onboarding/doc-batch] Fetching doc batch prompt...');

  try {
    // 1. Validate query params
    const searchParams = request.nextUrl.searchParams;
    const validation = querySchema.safeParse({
      projectId: searchParams.get('projectId'),
      batch: searchParams.get('batch'),
    });

    if (!validation.success) {
      console.error('[GET /api/onboarding/doc-batch] Validation failed:', validation.error);

      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { projectId, batch } = validation.data;
    const batchConfig = BATCH_CONFIGS[batch as keyof typeof BATCH_CONFIGS];

    console.log('[GET /api/onboarding/doc-batch] Request validated', {
      projectId,
      batch,
      batchName: batchConfig.name,
      docCount: batchConfig.docs.length,
    });

    // Sprint 12: Require authentication (session OR bearer token)
    await requireOnboardingAuth(request, projectId);

    // 2. Get Session 1 with executiveSummary and projectContextJson
    const session1 = await prisma.onboardingSession.findUnique({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 1 },
      },
      select: {
        projectContextJson: true,
      },
    });

    if (!session1 || !session1.projectContextJson) {
      console.error('[GET /api/onboarding/doc-batch] Session 1 not found or incomplete');

      return NextResponse.json(
        {
          error: 'Session 1 not found or incomplete',
          hint: 'Complete Session 1 (all 10 phases + executive summary) before starting Session 2',
        },
        { status: 404 }
      );
    }

    const projectContext = session1.projectContextJson as any;
    const executiveSummary = projectContext.executiveSummary || '';

    console.log('[GET /api/onboarding/doc-batch] Session 1 found');

    // 3. Fetch batch prompt template
    const template = await prisma.onboardingPromptTemplate.findFirst({
      where: {
        name: `onboarding-session-2-batch-${batch}`,
        isActive: true,
      },
      select: {
        systemPrompt: true,
        userPrompt: true,
        temperature: true,
        maxTokens: true,
      },
    });

    if (!template) {
      console.error('[GET /api/onboarding/doc-batch] Template not found');

      return NextResponse.json(
        {
          error: 'Batch template not found',
          hint: 'Run database seed to create batch templates',
        },
        { status: 404 }
      );
    }

    console.log('[GET /api/onboarding/doc-batch] Template found');

    // 4. Build document structure (template only, context sent once via sharedContext)
    // NOTE: Previously injected full context per document causing 42K+ token responses
    // Now: Send context ONCE via sharedContext, documents reference the template
    const documents = batchConfig.docs.map((filename, index) => ({
      filename,
      category: batchConfig.category,
      systemPrompt: template.systemPrompt,
      userPromptTemplate: template.userPrompt, // Template with {executiveSummary} and {projectContextJson} placeholders
      wordCountTarget: index < 3 ? 2500 : 1800, // First 3 docs ~2500, rest ~1800
      estimatedTokens: Math.floor(batchConfig.estimatedTokens / batchConfig.docs.length),
      dependencies: batch === 1 && index === 0 ? ['executive-summary'] : [],
    }));

    console.log('[GET /api/onboarding/doc-batch] Batch prompt ready', {
      projectId,
      batch,
      documentCount: documents.length,
      estimatedTotalTokens: batchConfig.estimatedTokens,
    });

    return NextResponse.json({
      projectId,
      batchNumber: batch,
      batchName: batchConfig.name,
      totalBatches: 4,
      documents,
      // Context sent ONCE (not duplicated per document) - ~75% token reduction
      sharedContext: {
        executiveSummary,
        projectContextJson: JSON.stringify(projectContext, null, 2),
      },
      estimatedTotalTokens: batchConfig.estimatedTokens,
      guidance: `Generate ${batchConfig.docs.length} documents in order: ${batchConfig.docs.join(' → ')}.
Use sharedContext to inject {executiveSummary} and {projectContextJson} into each document's userPromptTemplate before generation.
Maintain consistency and traceability across documents.`,
    });
  } catch (error) {
    console.error('[GET /api/onboarding/doc-batch] Error:', error);

    // Sprint 12: Handle auth errors
    if (error instanceof AuthError) {
      return handleAuthError(error);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to fetch doc batch prompt', message: errorMessage },
      { status: 500 }
    );
  }
}
