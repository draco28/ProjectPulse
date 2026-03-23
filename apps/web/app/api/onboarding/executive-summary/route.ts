/**
 * POST /api/onboarding/executive-summary
 *
 * Sprint 8.6 Phase 1 - Session 1 Executive Summary Storage (Agent-Side AI)
 *
 * Store agent-generated executive summary from their own AI provider.
 * This endpoint NO LONGER generates summaries - it just stores them.
 *
 * Agent workflow:
 * 1. GET /api/onboarding/executive-summary-prompt (get prompt template)
 * 2. Agent generates summary with their AI provider
 * 3. POST /api/onboarding/executive-summary (store summary - this endpoint)
 *
 * Request Body:
 * - projectId: number (required) - Project ID
 * - executiveSummary: string (required) - Agent-generated summary (100-5000 chars)
 * - wordCount: number (optional) - Word count (calculated if not provided)
 *
 * Response:
 * - 200: Executive summary stored successfully
 * - 400: Validation error or Session 1 incomplete
 * - 404: Session 1 not found
 * - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireOnboardingAuth, handleAuthError, AuthError } from '@/lib/onboarding-auth';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import type { Prisma } from '@prisma/client';

// Type definitions for onboarding session data
type PhaseAnswers = Record<string, string>;
type PlanningAnswers = Record<string, PhaseAnswers>;

interface ProjectContextMetadata {
  projectName: string;
  projectType: string;
  domain: string;
  targetUsers: string[];
  valueProposition: string;
  version: string;
  lastUpdated: string;
  createdBy: string;
}

interface ProjectContextTechStack {
  frontend: string;
  backend: string;
  database: string;
  auth: string;
  hosting: string;
  other: string[];
}

interface ProjectContextPhase {
  id: number;
  name: string;
  duration: string;
  goals: string[];
  deliverables: string[];
  status: string;
}

interface ProjectContextTimeline {
  startDate: string;
  estimatedDuration: string;
  targetLaunch: string;
}

interface ProjectContextBudget {
  development: string;
  monthly_operating: string;
}

interface ProjectContextFeature {
  id: number;
  name: string;
  description: string;
  priority: string;
  phase: number;
  status: string;
}

interface ProjectContext {
  metadata: ProjectContextMetadata;
  techStack: ProjectContextTechStack;
  phases: ProjectContextPhase[];
  timeline: ProjectContextTimeline;
  budget: ProjectContextBudget;
  features: ProjectContextFeature[];
}

interface SessionMetrics {
  tokensUsed?: number;
  phasesComplete?: number;
  executiveSummaryWordCount?: number;
  executiveSummaryGeneratedAt?: string;
  generatedBy?: string;
}

const requestSchema = z.object({
  projectId: z.number().int().positive('Project ID must be positive'),
  executiveSummary: z
    .string()
    .min(100, 'Executive summary must be at least 100 characters')
    .max(5000, 'Executive summary must not exceed 5000 characters'),
  wordCount: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { projectId, executiveSummary, wordCount: providedWordCount } = validation.data;

    // Sprint 12: Require authentication (session OR bearer token)
    await requireOnboardingAuth(request, projectId);

    // Fetch Session 1 data (Sprint 9 Refactored Schema)
    const session = await prisma.onboardingSession.findUnique({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 1 },
      },
      select: {
        id: true,
        planningAnswers: true,
        projectContextJson: true,
        status: true,
        metrics: true,
      },
    });

    if (!session || !session.planningAnswers) {
      return NextResponse.json(
        { error: 'Session 1 not found or incomplete. Ensure all 10 phases are complete.' },
        { status: 404 }
      );
    }

    const planningAnswers = session.planningAnswers as PlanningAnswers;

    // Calculate word count if not provided
    const wordCount =
      providedWordCount || executiveSummary.split(/\s+/).filter((w) => w.length > 0).length;

    log.info({ wordCount, session: 1 }, 'Storing agent-generated executive summary');

    // Generate project-context.json from planning answers
    const projectContextJson = generateProjectContextJson(planningAnswers, executiveSummary);

    // Update session with agent-generated executive summary (Sprint 9 Refactored)
    const now = new Date();
    const currentMetrics = (session.metrics as SessionMetrics | null) || {
      tokensUsed: 0,
      phasesComplete: 10,
    };

    await prisma.onboardingSession.update({
      where: { id: session.id },
      data: {
        projectContextJson: projectContextJson as unknown as Prisma.InputJsonValue,
        status: 'complete',
        completedAt: now,
        metrics: {
          ...currentMetrics,
          executiveSummaryWordCount: wordCount,
          executiveSummaryGeneratedAt: now.toISOString(),
          generatedBy: 'agent',
        },
      },
    });

    log.info({ session: 1 }, 'Session marked complete with agent-generated executive summary');

    return NextResponse.json({
      success: true,
      stored: true,
      wordCount,
      projectContextJson,
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to store executive summary'
    );

    // Sprint 12: Handle auth errors
    if (error instanceof AuthError) {
      return handleAuthError(error);
    }

    return NextResponse.json(
      {
        error: 'Failed to generate executive summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate project-context.json from planning answers and executive summary
 *
 * This extracts structured data from the 10 phases of planning answers
 * and combines it with the agent-generated executive summary to create
 * a complete project context object for Session 2 and Session 3 to use.
 */
function generateProjectContextJson(
  planningAnswers: PlanningAnswers,
  executiveSummary: string
): ProjectContext {
  // Extract data from phase answers (phases 3,5,6,7,8,10 reserved for future use)
  const phase1 = planningAnswers.phase1 || {};
  const phase2 = planningAnswers.phase2 || {};
  const _phase3 = planningAnswers.phase3 || {};
  const phase4 = planningAnswers.phase4 || {};
  const _phase5 = planningAnswers.phase5 || {};
  const _phase6 = planningAnswers.phase6 || {};
  const _phase7 = planningAnswers.phase7 || {};
  const _phase8 = planningAnswers.phase8 || {};
  const phase9 = planningAnswers.phase9 || {};
  const _phase10 = planningAnswers.phase10 || {};

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
      createdBy: 'onboarding-session-1',
    },
    techStack: {
      frontend: extractTechStack(phase2, 'frontend'),
      backend: extractTechStack(phase2, 'backend'),
      database: extractTechStack(phase2, 'database'),
      auth: extractTechStack(phase4, 'auth'),
      hosting: extractTechStack(phase9, 'hosting'),
      other: [],
    },
    phases: extractPhases(planningAnswers),
    timeline: {
      startDate: extractStartDate(phase2),
      estimatedDuration: extractDuration(phase2),
      targetLaunch: extractLaunchDate(phase2),
    },
    budget: {
      development: extractBudget(phase2, 'development'),
      monthly_operating: extractBudget(phase2, 'monthly'),
    },
    features: extractFeatures(phase1),
    // NOTE: planningAnswers and executiveSummary intentionally omitted
    // - planningAnswers: Raw Q&A already processed into structured fields above (~27K tokens saved)
    // - executiveSummary: Sent separately via {executiveSummary} placeholder (no duplication)
  };
}

// Helper functions to extract structured data from text answers
function extractProjectName(phase1: PhaseAnswers, summary: string): string {
  // Try to find project name in answers or summary
  const _coreFeatures = phase1['phase1_q1'] || phase1['phase1_q4'] || '';
  // Simple extraction - look for capitalized words
  const match = summary.match(/^([A-Z][a-zA-Z]+)/);
  return match?.[1] ?? 'MyProject';
}

function extractProjectType(_phase1: PhaseAnswers, summary: string): string {
  const text = summary.toLowerCase();
  if (text.includes('saas')) return 'SaaS';
  if (text.includes('e-commerce') || text.includes('ecommerce')) return 'E-Commerce';
  if (text.includes('marketplace')) return 'Marketplace';
  if (text.includes('platform')) return 'Platform';
  return 'Web Application';
}

function extractTargetUsers(phase1: PhaseAnswers): string[] {
  const usersText = phase1['phase1_q1'] || '';
  // Basic split by commas
  return usersText
    .split(',')
    .map((u: string) => u.trim())
    .filter((u: string) => u.length > 0)
    .slice(0, 5);
}

function extractValueProp(phase1: PhaseAnswers): string {
  return phase1['phase1_q6'] || 'Innovative solution for modern challenges';
}

function extractTechStack(phase: PhaseAnswers, type: string): string {
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

function extractPhases(_planningAnswers: PlanningAnswers): ProjectContextPhase[] {
  // Basic phase extraction - will be enhanced by Session 2
  return [
    {
      id: 1,
      name: 'Foundation',
      duration: '2-4 weeks',
      goals: [],
      deliverables: [],
      status: 'NOT_STARTED',
    },
    {
      id: 2,
      name: 'Core Features',
      duration: '3-5 weeks',
      goals: [],
      deliverables: [],
      status: 'NOT_STARTED',
    },
  ];
}

function extractStartDate(_phase2: PhaseAnswers): string {
  // Default to today
  return new Date().toISOString().split('T')[0] ?? new Date().toISOString().slice(0, 10);
}

function extractDuration(phase2: PhaseAnswers): string {
  const timelineText = phase2['phase2_q7'] || '';
  if (timelineText.includes('3 months')) return '12 weeks';
  if (timelineText.includes('6 weeks')) return '6 weeks';
  if (timelineText.includes('10 weeks')) return '10 weeks';
  return '8-12 weeks';
}

function extractLaunchDate(_phase2: PhaseAnswers): string {
  // Add estimated duration to start date
  const start = new Date();
  start.setDate(start.getDate() + 84); // ~12 weeks
  return start.toISOString().split('T')[0] ?? start.toISOString().slice(0, 10);
}

function extractBudget(phase2: PhaseAnswers, type: string): string {
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

function extractFeatures(phase1: PhaseAnswers): ProjectContextFeature[] {
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
    status: 'NOT_STARTED',
  }));
}
