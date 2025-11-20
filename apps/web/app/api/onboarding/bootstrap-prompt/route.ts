/**
 * GET /api/onboarding/bootstrap-prompt
 * 
 * Sprint 9 Refactor: Get bootstrap prompt for parsing 13-Project-Plan.md
 * Returns parsing instructions with structured output schema and tech stack
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const querySchema = z.object({
  projectId: z.string().transform(Number).pipe(z.number().int().positive())
});

// ============================================================================
// HELPER: Inject variables into template
// ============================================================================

function injectVariables(template: string, variables: Record<string, any>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    const replacement = typeof value === 'object' 
      ? JSON.stringify(value, null, 2) 
      : String(value);
    
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacement);
  }
  
  return result;
}

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  console.log('[GET /api/onboarding/bootstrap-prompt] Fetching bootstrap prompt...');
  
  try {
    // 1. Validate query params
    const searchParams = request.nextUrl.searchParams;
    const validation = querySchema.safeParse({
      projectId: searchParams.get('projectId')
    });
    
    if (!validation.success) {
      console.error('[GET /api/onboarding/bootstrap-prompt] Validation failed:', validation.error);
      
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { projectId } = validation.data;
    
    console.log('[GET /api/onboarding/bootstrap-prompt] Request validated', { projectId });
    
    // 2. Get Session 2 to find 13-Project-Plan.md document
    const session2 = await prisma.onboardingSession.findUnique({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 2 }
      },
      select: {
        id: true,
        documents: {
          where: { filename: '13-Project-Plan.md' },
          select: { content: true }
        }
      }
    });
    
    if (!session2 || session2.documents.length === 0) {
      console.error('[GET /api/onboarding/bootstrap-prompt] 13-Project-Plan.md not found');
      
      return NextResponse.json(
        {
          error: '13-Project-Plan.md not found',
          hint: 'Complete Session 2 (all 4 batches) before starting Session 3'
        },
        { status: 404 }
      );
    }
    
    const projectPlanMarkdown = session2.documents[0].content;
    
    console.log('[GET /api/onboarding/bootstrap-prompt] Project plan found', {
      length: projectPlanMarkdown.length
    });
    
    // 3. Get tech stack from Session 1 projectContextJson
    const session1 = await prisma.onboardingSession.findUnique({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 1 }
      },
      select: {
        projectContextJson: true
      }
    });
    
    const projectContext = (session1?.projectContextJson as any) || {};
    const techStack = projectContext.metadata?.techStack || projectContext.techStack || [];
    
    console.log('[GET /api/onboarding/bootstrap-prompt] Tech stack extracted', {
      techStackCount: Array.isArray(techStack) ? techStack.length : 0
    });
    
    // 4. Fetch bootstrap prompt template
    const template = await prisma.onboardingPromptTemplate.findFirst({
      where: {
        name: 'onboarding-session-3-bootstrap',
        isActive: true
      },
      select: {
        systemPrompt: true,
        userPrompt: true,
        temperature: true,
        maxTokens: true
      }
    });
    
    if (!template) {
      console.error('[GET /api/onboarding/bootstrap-prompt] Template not found');
      
      return NextResponse.json(
        {
          error: 'Bootstrap template not found',
          hint: 'Run database seed to create bootstrap template'
        },
        { status: 404 }
      );
    }
    
    console.log('[GET /api/onboarding/bootstrap-prompt] Template found');
    
    // 5. Inject variables into userPrompt
    const userPrompt = injectVariables(template.userPrompt, {
      projectPlanMarkdown,
      techStack: Array.isArray(techStack) ? techStack : []
    });
    
    // 6. Build structured output schema
    const structuredOutputSchema = {
      phases: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            order: { type: 'number' },
            sprints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  weeks: { type: 'string' },
                  points: { type: 'number' },
                  goals: { type: 'array', items: { type: 'string' } },
                  deliverables: { type: 'array', items: { type: 'string' } }
                },
                required: ['name', 'weeks', 'points', 'goals', 'deliverables']
              }
            }
          },
          required: ['title', 'order', 'sprints']
        }
      }
    };
    
    console.log('[GET /api/onboarding/bootstrap-prompt] Bootstrap prompt ready');
    
    return NextResponse.json({
      projectId,
      systemPrompt: template.systemPrompt,
      userPrompt,
      structuredOutputSchema,
      fallbackGuidance: 'If parse <90%, call workflow.consultExpert() for help',
      techStack: Array.isArray(techStack) ? techStack : [],
      temperature: template.temperature,
      maxTokens: template.maxTokens,
      guidance: 'Parse the project plan, then use the JSON to call roadmap.createHierarchy() and batch create tools'
    });
    
  } catch (error) {
    console.error('[GET /api/onboarding/bootstrap-prompt] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to fetch bootstrap prompt', message: errorMessage },
      { status: 500 }
    );
  }
}
