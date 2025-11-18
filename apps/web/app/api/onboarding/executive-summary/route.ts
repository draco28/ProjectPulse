/**
 * POST /api/onboarding/executive-summary
 * 
 * Sprint 8.6 Phase 1 - Session 1 Executive Summary Generation
 * 
 * Generate AI executive summary from all 10 phases of answers
 * Uses OpenAI GPT-4 to synthesize answers into cohesive vision
 * 
 * Request Body:
 * - projectId: number (required) - Project ID
 * 
 * Response:
 * - 200: Executive summary generated (~500 words)
 * - 400: Validation error or Session 1 incomplete
 * - 404: Session 1 not found
 * - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import OpenAI from 'openai';

const requestSchema = z.object({
  projectId: z.number().int().positive('Project ID must be positive')
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.format()
        },
        { status: 400 }
      );
    }
    
    const { projectId } = validation.data;
    
    // Fetch Session 1 data
    const session = await prisma.onboardingSession.findUnique({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 1 }
      }
    });
    
    if (!session || !session.response) {
      return NextResponse.json(
        { error: 'Session 1 not found or empty' },
        { status: 404 }
      );
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
          )
        },
        { status: 400 }
      );
    }
    
    // Generate executive summary
    let executiveSummary: string;
    let wordCount: number;
    
    if (process.env.OPENAI_API_KEY) {
      // Use OpenAI for real generation
      console.log('[Session 1] Generating executive summary with OpenAI...');
      
      const prompt = generateExecutiveSummaryPrompt(planningAnswers);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a product strategist and technical writer. Generate a concise executive summary (~500 words) synthesizing all planning answers into a cohesive project vision. Focus on: product name, target users, core problem, solution, key features (3-5), tech stack, timeline, budget, and success metrics.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      });
      
      executiveSummary = completion.choices[0].message.content || '';
      wordCount = executiveSummary.split(/\s+/).filter((w) => w.length > 0).length;
    } else {
      // Fallback: Generate basic summary from answers
      console.log('[Session 1] OpenAI key not configured, using fallback summary generation');
      executiveSummary = generateFallbackExecutiveSummary(planningAnswers);
      wordCount = executiveSummary.split(/\s+/).filter((w) => w.length > 0).length;
    }
    
    console.log(`[Session 1] Executive summary generated: ${wordCount} words`);
    
    // Generate project-context.json
    const projectContextJson = generateProjectContextJson(planningAnswers, executiveSummary);
    
    // Update session with executive summary
    const now = new Date();
    await prisma.onboardingSession.update({
      where: { id: session.id },
      data: {
        response: {
          ...sessionData,
          executiveSummary,
          executiveSummaryWordCount: wordCount,
          projectContextJson,
          executiveSummaryGeneratedAt: now.toISOString()
        },
        status: 'complete',
        completedAt: now
      }
    });
    
    console.log('[Session 1] Session marked complete with executive summary');
    
    return NextResponse.json({
      success: true,
      executiveSummary,
      wordCount,
      projectContextJson
    });
    
  } catch (error) {
    console.error('[POST /api/onboarding/executive-summary] Error:', error);
    
    // Check for OpenAI-specific errors
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          error: 'OpenAI API error',
          message: error.message,
          status: error.status
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Failed to generate executive summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate prompt for OpenAI executive summary
 */
function generateExecutiveSummaryPrompt(planningAnswers: any): string {
  const phases = Object.keys(planningAnswers)
    .filter((key) => key.startsWith('phase'))
    .sort()
    .map((key) => {
      const phaseNum = key.replace('phase', '');
      return `**Phase ${phaseNum}**:\n${JSON.stringify(planningAnswers[key], null, 2)}`;
    })
    .join('\n\n');
  
  return `
Generate an executive summary for a software project based on these 10 phases of planning answers:

${phases}

Synthesize into a cohesive ~500 word executive summary covering:

1. **Product Overview**: Product name, type, and target users
2. **Problem & Solution**: Core problem being solved and how
3. **Key Features**: 3-5 most important features for MVP
4. **Tech Stack**: Frontend, backend, database, hosting
5. **Timeline & Resources**: Development timeline, team size, hours/week
6. **Budget**: Development costs and monthly operating costs
7. **Success Metrics**: How success will be measured
8. **Unique Value**: What makes this product different
9. **Risks**: Top 2-3 technical or business risks
10. **Launch Plan**: MVP launch strategy and target date

Write in a professional, concise style. Focus on strategic vision, not implementation details.
  `.trim();
}

/**
 * Generate project-context.json from planning answers
 */
function generateProjectContextJson(planningAnswers: any, executiveSummary: string): any {
  // Extract data from phase answers
  const phase1 = planningAnswers.phase1 || {};
  const phase2 = planningAnswers.phase2 || {};
  const phase3 = planningAnswers.phase3 || {};
  const phase4 = planningAnswers.phase4 || {};
  const phase5 = planningAnswers.phase5 || {};
  const phase6 = planningAnswers.phase6 || {};
  const phase7 = planningAnswers.phase7 || {};
  const phase8 = planningAnswers.phase8 || {};
  const phase9 = planningAnswers.phase9 || {};
  const phase10 = planningAnswers.phase10 || {};
  
  // Parse answers to extract structured data
  // Note: This is basic extraction - real implementation would parse text answers
  
  return {
    metadata: {
      projectName: extractProjectName(phase1, executiveSummary),
      projectType: extractProjectType(phase1, executiveSummary),
      domain: 'software',
      targetUsers: extractTargetUsers(phase1),
      valueProposition: extractValueProp(phase1),
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      createdBy: 'onboarding-session-1'
    },
    techStack: {
      frontend: extractTechStack(phase2, 'frontend'),
      backend: extractTechStack(phase2, 'backend'),
      database: extractTechStack(phase2, 'database'),
      auth: extractTechStack(phase4, 'auth'),
      hosting: extractTechStack(phase9, 'hosting'),
      other: []
    },
    phases: extractPhases(planningAnswers),
    timeline: {
      startDate: extractStartDate(phase2),
      estimatedDuration: extractDuration(phase2),
      targetLaunch: extractLaunchDate(phase2)
    },
    budget: {
      development: extractBudget(phase2, 'development'),
      monthly_operating: extractBudget(phase2, 'monthly')
    },
    features: extractFeatures(phase1),
    planningAnswers: planningAnswers,
    executiveSummary: executiveSummary
  };
}

// Helper functions to extract structured data from text answers
function extractProjectName(phase1: any, summary: string): string {
  // Try to find project name in answers or summary
  const coreFeatures = phase1['phase1_q1'] || phase1['phase1_q4'] || '';
  // Simple extraction - look for capitalized words
  const match = summary.match(/^([A-Z][a-zA-Z]+)/);
  return match ? match[1] : 'MyProject';
}

function extractProjectType(phase1: any, summary: string): string {
  const text = summary.toLowerCase();
  if (text.includes('saas')) return 'SaaS';
  if (text.includes('e-commerce') || text.includes('ecommerce')) return 'E-Commerce';
  if (text.includes('marketplace')) return 'Marketplace';
  if (text.includes('platform')) return 'Platform';
  return 'Web Application';
}

function extractTargetUsers(phase1: any): string[] {
  const usersText = phase1['phase1_q1'] || '';
  // Basic split by commas
  return usersText
    .split(',')
    .map((u: string) => u.trim())
    .filter((u: string) => u.length > 0)
    .slice(0, 5);
}

function extractValueProp(phase1: any): string {
  return phase1['phase1_q6'] || 'Innovative solution for modern challenges';
}

function extractTechStack(phase: any, type: string): string {
  // Extract from relevant phase answers
  const allAnswers = Object.values(phase).join(' ');
  
  if (type === 'frontend') {
    if (allAnswers.includes('Next.js')) return 'Next.js';
    if (allAnswers.includes('React')) return 'React';
    if (allAnswers.includes('Vue')) return 'Vue.js';
  }
  
  if (type === 'backend') {
    if (allAnswers.includes('Node.js')) return 'Node.js';
    if (allAnswers.includes('Express')) return 'Express';
    if (allAnswers.includes('Fastify')) return 'Fastify';
  }
  
  if (type === 'database') {
    if (allAnswers.includes('PostgreSQL') || allAnswers.includes('Postgres')) return 'PostgreSQL';
    if (allAnswers.includes('MySQL')) return 'MySQL';
    if (allAnswers.includes('MongoDB')) return 'MongoDB';
  }
  
  if (type === 'hosting') {
    if (allAnswers.includes('Vercel')) return 'Vercel';
    if (allAnswers.includes('AWS')) return 'AWS';
    if (allAnswers.includes('Railway')) return 'Railway';
  }
  
  return 'Not specified';
}

function extractPhases(planningAnswers: any): any[] {
  // Basic phase extraction - will be enhanced by Session 2
  return [
    { id: 1, name: 'Foundation', duration: '2-4 weeks', goals: [], deliverables: [], status: 'NOT_STARTED' },
    { id: 2, name: 'Core Features', duration: '3-5 weeks', goals: [], deliverables: [], status: 'NOT_STARTED' }
  ];
}

function extractStartDate(phase2: any): string {
  // Default to today
  return new Date().toISOString().split('T')[0];
}

function extractDuration(phase2: any): string {
  const timelineText = phase2['phase2_q7'] || '';
  if (timelineText.includes('3 months')) return '12 weeks';
  if (timelineText.includes('6 weeks')) return '6 weeks';
  if (timelineText.includes('10 weeks')) return '10 weeks';
  return '8-12 weeks';
}

function extractLaunchDate(phase2: any): string {
  // Add estimated duration to start date
  const start = new Date();
  start.setDate(start.getDate() + 84); // ~12 weeks
  return start.toISOString().split('T')[0];
}

function extractBudget(phase2: any, type: string): string {
  const budgetText = phase2['phase2_q5'] || '';
  if (type === 'development') {
    return budgetText.includes('solo') ? '$0 (solo developer)' : 'Variable';
  }
  // Monthly operating
  const match = budgetText.match(/\$(\d+)[-/](\d+)/);
  if (match) {
    return `$${match[1]}-${match[2]}/month`;
  }
  return '$50-200/month';
}

function extractFeatures(phase1: any): any[] {
  const featuresText = phase1['phase1_q4'] || '';
  // Split by numbered list or commas
  const features = featuresText
    .split(/[\d]\)|,/)
    .map((f: string) => f.trim())
    .filter((f: string) => f.length > 5)
    .slice(0, 5);
  
  return features.map((name: string, idx: number) => ({
    id: idx + 1,
    name,
    description: name,
    priority: idx < 3 ? 'high' : 'medium',
    phase: 1,
    status: 'NOT_STARTED'
  }));
}

/**
 * Fallback executive summary generation (when OpenAI not available)
 */
function generateFallbackExecutiveSummary(planningAnswers: any): string {
  const phase1 = planningAnswers.phase1 || {};
  const phase2 = planningAnswers.phase2 || {};
  
  const projectName = extractProjectName(phase1, '');
  const targetUsers = extractTargetUsers(phase1).join(', ') || 'developers and teams';
  const features = extractFeatures(phase1).map((f) => f.name).join(', ');
  
  return `
${projectName} is a software application designed for ${targetUsers}. The product addresses key challenges in modern software development by providing innovative solutions and streamlined workflows.

**Core Features**: The MVP includes ${features}. These features were selected based on user feedback and market analysis to deliver maximum value in the shortest time.

**Technical Approach**: The project will be built using modern web technologies as specified in the planning phase. The architecture prioritizes scalability, security, and developer experience.

**Timeline & Resources**: Development is planned over multiple phases, with a focus on iterative delivery and continuous improvement. The team will work systematically through each phase, validating assumptions and gathering feedback.

**Success Metrics**: Success will be measured through user adoption, feature completion rates, and overall product quality. The goal is to launch an MVP that demonstrates clear value and sets the foundation for future growth.

**Next Steps**: With planning complete, the team is ready to begin implementation following the defined roadmap. The first phase will focus on foundational infrastructure and core features.

This executive summary is generated from planning answers collected during Session 1. For best results, configure OPENAI_API_KEY for AI-powered summary generation.
  `.trim();
}
