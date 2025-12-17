/**
 * GET /api/onboarding/document-prompts
 * 
 * Sprint 8.6 Phase 2 - Session 2 Document Prompts API (Agent-Side AI)
 * 
 * Returns all 15 document prompt templates WITH project context injected.
 * Agent will generate documents with their own AI provider using these prompts.
 * 
 * Query Parameters:
 * - projectId: number (required) - Project ID
 * 
 * Response:
 * - 200: All 15 prompts with systemPrompt + userPrompt (context injected)
 * - 400: Validation error (missing projectId or Session 1 incomplete)
 * - 404: Session 1 not found
 * - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DOCUMENT_PROMPTS, getTotalEstimatedWords } from '@/lib/onboarding/document-prompts';
import { requireOnboardingAuth, handleAuthError, AuthError } from '@/lib/onboarding-auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectIdParam = searchParams.get('projectId');
    
    // Validation
    if (!projectIdParam) {
      return NextResponse.json(
        { error: 'projectId query parameter required' },
        { status: 400 }
      );
    }
    
    const projectId = parseInt(projectIdParam, 10);
    
    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(
        { error: 'projectId must be a positive integer' },
        { status: 400 }
      );
    }

    // Sprint 12: Require authentication (session OR bearer token)
    await requireOnboardingAuth(request, projectId);

    // Fetch Session 1 data (must be complete)
    const session1 = await prisma.onboardingSession.findUnique({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 1 }
      },
      select: {
        id: true,
        status: true,
        projectContextJson: true,
        metrics: true,
        response: true // Include for backward compatibility if needed
      }
    });
    
    if (!session1) {
      return NextResponse.json(
        { error: 'Session 1 not found' },
        { status: 404 }
      );
    }
    
    // Verify Session 1 is complete
    if (session1.status !== 'complete') {
      return NextResponse.json(
        {
          error: 'Session 1 must be complete before generating documents',
          status: session1.status,
          hint: 'Complete Session 1 first (10 phases + executive summary)'
        },
        { status: 400 }
      );
    }
    
    // Sprint 9: Use projectContextJson directly (preferred) or fall back to response.projectContextJson
    const projectContext = (session1.projectContextJson as any) || (session1.response as any)?.projectContextJson;
    
    if (!projectContext) {
      return NextResponse.json(
        {
          error: 'Project context not available',
          hint: 'Session 1 must have generated project-context.json'
        },
        { status: 400 }
      );
    }
    
    console.log('[GET /api/onboarding/document-prompts] Generating prompts', {
      projectId,
      projectName: projectContext.metadata?.projectName,
      totalPrompts: DOCUMENT_PROMPTS.length
    });
    
    // Generate all 15 prompts with project context injected
    const documentPrompts = DOCUMENT_PROMPTS.map(promptDef => {
      // Inject project context into user prompt template
      const userPrompt = promptDef.userPromptTemplate(projectContext);
      
      return {
        filename: promptDef.filename,
        title: promptDef.title,
        category: promptDef.category,
        wordCountTarget: promptDef.wordCountTarget,
        systemPrompt: promptDef.systemPrompt,
        userPrompt: userPrompt,
        temperature: 0.7
      };
    });
    
    console.log('[GET /api/onboarding/document-prompts] Prompts generated successfully', {
      projectId,
      totalDocuments: documentPrompts.length,
      estimatedWords: getTotalEstimatedWords(),
      userPromptSizes: documentPrompts.map(p => ({
        filename: p.filename,
        chars: p.userPrompt.length
      }))
    });
    
    // Get word count from metrics (preferred) or response (deprecated)
    const executiveSummaryWordCount = 
      (session1.metrics as any)?.executiveSummaryWordCount || 
      (session1.response as any)?.executiveSummaryWordCount || 
      0;

    return NextResponse.json({
      documentPrompts,
      totalDocuments: documentPrompts.length,
      estimatedTotalWords: getTotalEstimatedWords(),
      metadata: {
        projectName: projectContext.metadata?.projectName || 'Unknown',
        projectType: projectContext.metadata?.projectType || 'Unknown',
        session1Complete: true,
        projectContextAvailable: true,
        executiveSummaryWordCount
      }
    });
    
  } catch (error) {
    console.error('[GET /api/onboarding/document-prompts] Error:', error);

    // Sprint 12: Handle auth errors
    if (error instanceof AuthError) {
      return handleAuthError(error);
    }

    return NextResponse.json(
      {
        error: 'Failed to generate document prompts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
