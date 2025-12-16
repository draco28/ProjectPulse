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
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
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
  activeSession: ActiveSessionData | null;
  availableResources: AvailableResources;
  hints: string[];
  totalTokens: number;
  timestamp: string;
}

// ============================================================================
// Query Schema
// ============================================================================

const querySchema = z.object({
  projectId: z.string().transform((val) => parseInt(val, 10)).optional(),
  banksToLoad: z.enum(['all', 'active-only']).default('all'),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate workflow hints based on current state
 */
function generateHints(
  activeSession: ActiveSessionData | null,
  memoryBanks: Record<string, MemoryBankData>,
  resources: AvailableResources
): string[] {
  const hints: string[] = [];

  // Session-based hints
  if (activeSession) {
    hints.push(
      `Active session '${activeSession.name || 'Unnamed'}' found (${activeSession.status}). ` +
      `Consider resuming your previous work.`
    );

    if (activeSession.activeTicketIds.length > 0) {
      hints.push(
        `Working on tickets: ${activeSession.activeTicketIds.join(', ')}. ` +
        `Use projectpulse_agent_session_update to track progress.`
      );
    }

    const todos = activeSession.todos as Array<{ content: string; status: string }> | null;
    if (todos && Array.isArray(todos)) {
      const pending = todos.filter(t => t.status !== 'completed').length;
      const completed = todos.filter(t => t.status === 'completed').length;
      if (pending > 0) {
        hints.push(
          `${completed}/${todos.length} todos completed. ${pending} remaining.`
        );
      }
    }
  } else {
    hints.push(
      `No active work session found. Consider calling projectpulse_agent_session_start ` +
      `to track your work if you're starting a new task.`
    );
  }

  // Resource hints
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

  // Memory bank freshness hints
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedProjectId = searchParams.get('projectId')
      ? parseInt(searchParams.get('projectId')!, 10)
      : undefined;
    const banksToLoad = searchParams.get('banksToLoad') as 'all' | 'active-only' || 'all';

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

    // 3. Find active agent session (IN_PROGRESS status)
    const activeSession = await prisma.agentSession.findFirst({
      where: {
        projectId,
        status: 'IN_PROGRESS',
      },
      orderBy: { startedAt: 'desc' },
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

    const activeSessionData: ActiveSessionData | null = activeSession ? {
      id: activeSession.id,
      name: activeSession.name,
      plan: activeSession.plan,
      todos: activeSession.todos,
      progress: activeSession.progress,
      activeTicketIds: activeSession.activeTicketIds,
      status: activeSession.status,
      startedAt: activeSession.startedAt.toISOString(),
    } : null;

    // 4. Get available resources metadata
    const [personasList, skillsList, sopsList] = await Promise.all([
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
    ]);

    // Dedupe skill categories
    const skillCategories = [...new Set(skillsList.map((s: { category: string | null }) => s.category).filter(Boolean))];

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

    // 5. Generate workflow hints
    const hints = generateHints(activeSessionData, memoryBanks, availableResources);

    // 6. Calculate total tokens
    const bankTokens = Object.values(finalBanks).reduce((sum, bank) => sum + (bank?.tokens || 0), 0);
    // Estimate session + resources at ~500 tokens
    const totalTokens = bankTokens + (activeSession ? 500 : 100);

    // 7. Build response
    const response: ContextLoadResponse = {
      projectId,
      projectName: project.name,
      memoryBanks: finalBanks as ContextLoadResponse['memoryBanks'],
      activeSession: activeSessionData,
      availableResources,
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

    console.error('GET /api/context/load error:', error);
    return NextResponse.json(
      { error: 'Failed to load context' },
      { status: 500 }
    );
  }
}
