/**
 * API Route: GET /api/context/load
 * Self-Guiding MCP Architecture - Phase 1
 *
 * Unified context loading for AI agents:
 * - All 5 memory banks (project state)
 * - Active agent session (execution state)
 * - Available resources metadata (personas, skills, SOPs)
 * - Workflow hints for self-guiding behavior
 *
 * Target: ~12K tokens total (10K banks + 2K metadata/session)
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { loadSessionStart } from '@/lib/memory/memory-bank-service';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';

// ============================================================================
// Types
// ============================================================================

interface MemoryBankData {
  content: string;
  tokens: number;
  updatedAt: string;
}

interface ActiveSessionData {
  id: string;
  name: string | null;
  plan: string | null;
  todos: unknown;
  progress: string | null;
  activeTicketIds: string[];
  status: string;
  startedAt: string;
}

interface AvailableResources {
  personas: {
    count: number;
    names: string[];
  };
  skills: {
    count: number;
    categories: string[];
  };
  sops: {
    count: number;
    names: string[];
  };
}

interface OnboardingStatus {
  isComplete: boolean;
  completedSessions: number; // 0, 1, 2, or 3
  nextSession: number | null; // 1, 2, 3, or null if complete
  inProgressSession: number | null; // Session currently in progress
}

interface ContextLoadResponse {
  projectId: number;
  projectName: string;
  memoryBanks: {
    PROJECT_BRIEF: MemoryBankData;
    SYSTEM_PATTERNS: MemoryBankData;
    TECH_CONTEXT: MemoryBankData;
    ACTIVE_CONTEXT: MemoryBankData;
    PROGRESS: MemoryBankData;
  };
  // Sprint 14: Changed to array for multi-instance support
  activeSessions: ActiveSessionData[];
  availableResources: AvailableResources;
  onboardingStatus: OnboardingStatus;
  hints: string[];
  totalTokens: number;
  timestamp: string;
}

// ============================================================================
// Query Schema
// ============================================================================

const querySchema = z.object({
  projectId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  banksToLoad: z.enum(['all', 'active-only']).default('all'),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate workflow hints based on current state
 * PRIORITY ORDER: Onboarding → Session → Resources → Bank Freshness
 * Sprint 14: Updated for multi-session support
 */
function generateHints(
  onboardingStatus: OnboardingStatus,
  activeSessions: ActiveSessionData[],
  memoryBanks: Record<string, MemoryBankData>,
  resources: AvailableResources
): string[] {
  const hints: string[] = [];

  // =========================================================================
  // ONBOARDING HINTS (Highest Priority - Check FIRST)
  // =========================================================================
  if (!onboardingStatus.isComplete) {
    // Onboarding is not complete - this takes priority over everything
    if (onboardingStatus.inProgressSession) {
      // Session in progress - continue it
      hints.push(
        `🚀 ONBOARDING IN PROGRESS: Session ${onboardingStatus.inProgressSession} of 3 is active. ` +
          `Continue with projectpulse_onboarding_getQuestions to get the next questions.`
      );
    } else {
      // No session in progress - start the next one
      const nextSession = onboardingStatus.nextSession || 1;
      const sessionDescriptions: Record<number, string> = {
        1: 'Strategic Planning (96 questions to define your project)',
        2: 'Documentation Generation (15 industry-standard docs)',
        3: 'AI Workflow Bootstrap (personas, skills, roadmap)',
      };
      hints.push(
        `🚨 ONBOARDING REQUIRED: Session ${nextSession} of 3 needed. ` +
          `Call projectpulse_onboarding_start({ sessionNumber: ${nextSession} }) to begin ${sessionDescriptions[nextSession]}.`
      );
    }

    // For incomplete onboarding, only add a brief note about status
    if (onboardingStatus.completedSessions > 0) {
      hints.push(`✅ Sessions completed: ${onboardingStatus.completedSessions}/3`);
    }

    // Return early - don't suggest session management for non-onboarded projects
    return hints;
  }

  // =========================================================================
  // SESSION HINTS (Sprint 14: Multi-session support)
  // =========================================================================
  const inProgressSessions = activeSessions.filter((s) => s.status === 'IN_PROGRESS');
  const pausedSessions = activeSessions.filter((s) => s.status === 'PAUSED');

  if (activeSessions.length > 0) {
    // Multi-session summary
    if (activeSessions.length > 1) {
      hints.push(
        `📋 Found ${activeSessions.length} sessions: ${inProgressSessions.length} active, ${pausedSessions.length} paused. ` +
          `Use projectpulse_agent_session_resume with session ID to continue specific work.`
      );
    }

    // Show the most recent IN_PROGRESS session (this agent's likely session)
    const currentSession = inProgressSessions[0] || pausedSessions[0];
    if (currentSession) {
      hints.push(
        `Current session: '${currentSession.name || 'Unnamed'}' (${currentSession.status}, ID: ${currentSession.id.slice(0, 8)}...). ` +
          `${currentSession.status === 'PAUSED' ? 'Resume with projectpulse_agent_session_resume.' : ''}`
      );

      if (currentSession.activeTicketIds.length > 0) {
        hints.push(
          `Working on tickets: ${currentSession.activeTicketIds.join(', ')}. ` +
            `Use projectpulse_agent_session_update to track progress.`
        );
      }

      const todos = currentSession.todos as Array<{ content: string; status: string }> | null;
      if (todos && Array.isArray(todos)) {
        const pending = todos.filter((t) => t.status !== 'completed').length;
        const completed = todos.filter((t) => t.status === 'completed').length;
        if (pending > 0) {
          hints.push(`${completed}/${todos.length} todos completed. ${pending} remaining.`);
        }
      }
    }

    // List other sessions if multiple exist
    if (pausedSessions.length > 0 && inProgressSessions.length > 0) {
      const pausedNames = pausedSessions
        .slice(0, 3)
        .map((s) => `'${s.name || 'Unnamed'}' (${s.id.slice(0, 8)})`)
        .join(', ');
      hints.push(`⏸️ Paused sessions available: ${pausedNames}`);
    }
  } else {
    hints.push(
      `No active work sessions found. Use projectpulse_agent_session_start ` +
        `to track your work if you're starting a new task.`
    );
  }

  // =========================================================================
  // RESOURCE HINTS
  // =========================================================================
  if (resources.personas.count > 0) {
    hints.push(
      `${resources.personas.count} personas available. Use projectpulse_persona_get ` +
        `to load specialized guidance.`
    );
  }

  if (resources.skills.count > 0) {
    hints.push(
      `${resources.skills.count} skills available in categories: ${resources.skills.categories.slice(0, 3).join(', ')}${resources.skills.categories.length > 3 ? '...' : ''}`
    );
  }

  // =========================================================================
  // MEMORY BANK FRESHNESS HINTS
  // =========================================================================
  const activeContextAge = getAgeInHours(memoryBanks.ACTIVE_CONTEXT?.updatedAt);
  if (activeContextAge > 24) {
    hints.push(
      `ACTIVE_CONTEXT was last updated ${Math.floor(activeContextAge)}h ago. ` +
        `Consider reviewing if focus has changed.`
    );
  }

  return hints;
}

/**
 * Calculate age in hours from ISO timestamp
 */
function getAgeInHours(timestamp: string | undefined): number {
  if (!timestamp) return Infinity;
  return (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
}

// ============================================================================
// Main Handler
// ============================================================================

export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const { searchParams } = new URL(request.url);
    const requestedProjectId = searchParams.get('projectId')
      ? parseInt(searchParams.get('projectId')!, 10)
      : undefined;
    const banksToLoad = (searchParams.get('banksToLoad') as 'all' | 'active-only') || 'all';

    // Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    // 1. Load project info
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 2. Load memory banks (reuse existing service)
    const sessionStartData = await loadSessionStart(projectId);

    // Transform to structured format
    const memoryBanks: Record<string, MemoryBankData> = {};
    for (const bank of sessionStartData.banks) {
      memoryBanks[bank.type] = {
        content: bank.content,
        tokens: bank.summaryTokens || 0,
        updatedAt: bank.updatedAt.toISOString(),
      };
    }

    // Filter to active-only if requested
    let finalBanks = memoryBanks;
    if (banksToLoad === 'active-only') {
      finalBanks = {
        ACTIVE_CONTEXT: memoryBanks.ACTIVE_CONTEXT,
        PROGRESS: memoryBanks.PROGRESS,
      } as Record<string, MemoryBankData>;
    }

    // 3. Find ALL active agent sessions (Sprint 14: multi-instance support)
    // Includes both IN_PROGRESS and PAUSED sessions for visibility
    const activeSessions = await prisma.agentSession.findMany({
      where: {
        projectId,
        status: { in: ['IN_PROGRESS', 'PAUSED'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10, // Limit to prevent token bloat
      select: {
        id: true,
        name: true,
        plan: true,
        todos: true,
        progress: true,
        activeTicketIds: true,
        status: true,
        startedAt: true,
      },
    });

    const activeSessionsData: ActiveSessionData[] = activeSessions.map((session) => ({
      id: session.id,
      name: session.name,
      plan: session.plan,
      todos: session.todos,
      progress: session.progress,
      activeTicketIds: session.activeTicketIds,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
    }));

    // 4. Get available resources metadata AND onboarding status
    const [personasList, skillsList, sopsList, onboardingSessions] = await Promise.all([
      prisma.agentPersona.findMany({
        where: { projectId, isActive: true },
        select: { name: true },
        take: 10,
      }),
      prisma.skill.findMany({
        where: { projectId },
        select: { category: true },
      }),
      prisma.sOP.findMany({
        where: { projectId },
        select: { title: true },
        take: 10,
      }),
      // Query onboarding sessions for this project
      prisma.onboardingSession.findMany({
        where: { projectId },
        select: {
          sessionNumber: true,
          status: true,
        },
        orderBy: { sessionNumber: 'asc' },
      }),
    ]);

    // Dedupe skill categories
    const skillCategories = [
      ...new Set(skillsList.map((s: { category: string | null }) => s.category).filter(Boolean)),
    ];

    const availableResources: AvailableResources = {
      personas: {
        count: personasList.length,
        names: personasList.map((p: { name: string }) => p.name),
      },
      skills: {
        count: skillsList.length,
        categories: skillCategories as string[],
      },
      sops: {
        count: sopsList.length,
        names: sopsList.map((s: { title: string }) => s.title),
      },
    };

    // 5. Calculate onboarding status
    // Note: Status can be 'COMPLETED'/'complete' or 'IN_PROGRESS'/'in_progress' - normalize to uppercase
    const normalizeStatus = (status: string) => status.toUpperCase().replace('_', '_');
    const completedSessions = onboardingSessions.filter(
      (s) => normalizeStatus(s.status) === 'COMPLETE' || normalizeStatus(s.status) === 'COMPLETED'
    ).length;
    const inProgressSession = onboardingSessions.find(
      (s) => normalizeStatus(s.status) === 'IN_PROGRESS'
    );

    // Determine next session (1, 2, or 3) - based on what's not yet completed
    let nextSession: number | null = null;
    if (completedSessions < 3) {
      // Find the first session that isn't completed
      for (let i = 1; i <= 3; i++) {
        const sessionRecord = onboardingSessions.find((s) => s.sessionNumber === i);
        const status = sessionRecord ? normalizeStatus(sessionRecord.status) : '';
        if (!sessionRecord || (status !== 'COMPLETE' && status !== 'COMPLETED')) {
          nextSession = i;
          break;
        }
      }
    }

    const onboardingStatus: OnboardingStatus = {
      isComplete: completedSessions >= 3,
      completedSessions,
      nextSession,
      inProgressSession: inProgressSession?.sessionNumber || null,
    };

    // 6. Generate workflow hints (Sprint 14: multi-session aware)
    const hints = generateHints(
      onboardingStatus,
      activeSessionsData,
      memoryBanks,
      availableResources
    );

    // 7. Calculate total tokens
    const bankTokens = Object.values(finalBanks).reduce(
      (sum, bank) => sum + (bank?.tokens || 0),
      0
    );
    // Estimate sessions + resources at ~500 tokens per session
    const totalTokens = bankTokens + activeSessionsData.length * 500 + 100;

    // 8. Build response (Sprint 14: activeSessions array for multi-instance)
    const response: ContextLoadResponse = {
      projectId,
      projectName: project.name,
      memoryBanks: finalBanks as ContextLoadResponse['memoryBanks'],
      activeSessions: activeSessionsData,
      availableResources,
      onboardingStatus,
      hints,
      totalTokens,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: error.issues },
        { status: 400 }
      );
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to load context');
    return NextResponse.json({ error: 'Failed to load context' }, { status: 500 });
  }
}
