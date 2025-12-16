/**
 * Memory Bank Service Layer (Sprint 9 + Self-Guiding MCP Phase 2)
 * Token-efficient context management for AI agents
 *
 * Workflows:
 * - Session Start: Load all banks (≤10K tokens)
 * - Pattern Lookup: Query specific banks (≤1K tokens)
 * - Context Recovery: Restore session context (≤6K tokens)
 * - Auto-Sync: Update PROGRESS + ACTIVE_CONTEXT on session end (Phase 2)
 */

import { prisma } from '@/lib/prisma';
import { MemoryBankType } from '@prisma/client';
import { formatDateTime } from '@/lib/date-utils';
import {
  parseProgressBank,
  generateProgressMarkdown,
  createSessionEntry,
  addSessionWithPruning,
  estimateProgressTokens,
} from './progress-parser';

// ============================================================================
// Type Definitions
// ============================================================================

export interface MemoryBankSnapshot {
  type: MemoryBankType;
  content: string;
  summaryTokens: number | null;
  updatedAt: Date;
}

export interface SessionStartPayload {
  projectId: number;
  banks: MemoryBankSnapshot[];
  totalTokens: number;
  timestamp: Date;
}

export interface PatternLookupPayload {
  projectId: number;
  bankType: MemoryBankType;
  content: string;
  tokens: number;
}

export interface ContextRecoveryPayload {
  projectId: number;
  activeBanks: MemoryBankSnapshot[]; // ACTIVE_CONTEXT + PROGRESS
  totalTokens: number;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * WORKFLOW 1: Session Start
 * Load all 5 memory banks for a project
 * Target: ≤10K tokens total
 */
export async function loadSessionStart(projectId: number): Promise<SessionStartPayload> {
  const banks = await prisma.memoryBank.findMany({
    where: { projectId },
    orderBy: { type: 'asc' }, // Deterministic order
    select: {
      type: true,
      content: true,
      summaryTokens: true,
      updatedAt: true,
    },
  });

  // Calculate total token estimate
  const totalTokens = banks.reduce((sum, bank) => sum + (bank.summaryTokens || 0), 0);

  return {
    projectId,
    banks,
    totalTokens,
    timestamp: new Date(),
  };
}

/**
 * WORKFLOW 2: Pattern Lookup
 * Query a specific memory bank by type
 * Target: ≤1K tokens per lookup
 */
export async function lookupPattern(
  projectId: number,
  bankType: MemoryBankType
): Promise<PatternLookupPayload> {
  const bank = await prisma.memoryBank.findUnique({
    where: {
      projectId_type: { projectId, type: bankType },
    },
    select: {
      type: true,
      content: true,
      summaryTokens: true,
    },
  });

  if (!bank) {
    throw new Error(`Memory bank ${bankType} not found for project ${projectId}`);
  }

  return {
    projectId,
    bankType,
    content: bank.content,
    tokens: bank.summaryTokens || 0,
  };
}

/**
 * WORKFLOW 3: Context Recovery
 * Load ACTIVE_CONTEXT + PROGRESS for fast session resume
 * Target: ≤6K tokens total
 */
export async function recoverContext(projectId: number): Promise<ContextRecoveryPayload> {
  const activeBanks = await prisma.memoryBank.findMany({
    where: {
      projectId,
      type: {
        in: [MemoryBankType.ACTIVE_CONTEXT, MemoryBankType.PROGRESS],
      },
    },
    select: {
      type: true,
      content: true,
      summaryTokens: true,
      updatedAt: true,
    },
  });

  const totalTokens = activeBanks.reduce((sum, bank) => sum + (bank.summaryTokens || 0), 0);

  return {
    projectId,
    activeBanks,
    totalTokens,
  };
}

/**
 * Update a Memory Bank's content
 * Used by agents to persist context updates
 */
export async function updateMemoryBank(
  projectId: number,
  bankType: MemoryBankType,
  content: string,
  summaryTokens?: number
) {
  return prisma.memoryBank.update({
    where: {
      projectId_type: { projectId, type: bankType },
    },
    data: {
      content,
      summaryTokens,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get all memory banks for a project
 * Used for full context export
 */
export async function getAllMemoryBanks(projectId: number) {
  return prisma.memoryBank.findMany({
    where: { projectId },
    orderBy: { type: 'asc' },
  });
}

/**
 * Token budget check: ensure total doesn't exceed limits
 */
export function validateTokenBudget(banks: MemoryBankSnapshot[], maxTokens: number): boolean {
  const total = banks.reduce((sum, bank) => sum + (bank.summaryTokens || 0), 0);
  return total <= maxTokens;
}

// ============================================================================
// Auto-Sync Helper Functions (Phase 2)
// ============================================================================

/**
 * Estimate token count from text
 * Uses rough approximation: 1 token ≈ 4 characters
 * Matches pattern from lib/skills/metrics.ts
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Calculate duration between two timestamps
 *
 * @param startedAt - Session start time
 * @param completedAt - Session completion time
 * @returns Human-readable duration string (e.g., "2h 15m")
 */
export function calculateDuration(startedAt: Date, completedAt: Date): string {
  const diffMs = completedAt.getTime() - startedAt.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

/**
 * Extract the last portion of progress notes for summary
 *
 * @param progress - Full progress notes string
 * @param maxChars - Maximum characters to extract
 * @returns Extracted summary, truncated with ellipsis if needed
 */
export function extractLastProgress(progress: string | null, maxChars: number): string {
  if (!progress || progress.trim() === '') {
    return 'No progress notes recorded';
  }

  // Get last paragraph or section
  const paragraphs = progress.trim().split(/\n\n+/);
  let lastPortion = paragraphs[paragraphs.length - 1] || progress;

  // Remove markdown formatting for cleaner summary
  lastPortion = lastPortion
    .replace(/#+\s*/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/`([^`]+)`/g, '$1') // Remove code
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .trim();

  if (lastPortion.length <= maxChars) {
    return lastPortion;
  }

  // Truncate at word boundary
  const truncated = lastPortion.substring(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxChars * 0.7) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

// ============================================================================
// Auto-Sync Types (Phase 2)
// ============================================================================

/**
 * Full agent session data needed for auto-sync
 */
export interface FullAgentSession {
  id: string;
  projectId: number;
  name: string | null;
  todos: unknown; // JSON array: [{ content, status, ticketId? }]
  progress: string | null;
  activeTicketIds: string[];
  status: string;
  startedAt: Date;
  completedAt: Date | null;
}

// ============================================================================
// Auto-Sync Functions (Phase 2)
// ============================================================================

/**
 * Auto-sync PROGRESS bank when agent session ends
 *
 * Updates PROGRESS memory bank with:
 * - Session summary entry (name, date, duration, tickets, todos, summary)
 * - Pruning: keeps last 5 sessions, aggregates older into Sprint Summary
 *
 * @param projectId - Project ID
 * @param session - Completed agent session data
 */
export async function autoSyncProgressBank(
  projectId: number,
  session: FullAgentSession
): Promise<void> {
  try {
    // 1. Get current PROGRESS bank content
    let currentContent = '';
    try {
      const bank = await prisma.memoryBank.findUnique({
        where: {
          projectId_type: { projectId, type: MemoryBankType.PROGRESS },
        },
        select: { content: true },
      });
      currentContent = bank?.content || '';
    } catch {
      // Bank doesn't exist yet - will create with initial structure
      currentContent = '';
    }

    // 2. Parse current progress bank
    const parsed = parseProgressBank(currentContent);

    // 3. Create new session entry
    const formattedDate = formatDateTime(session.completedAt || new Date());
    const duration = session.completedAt
      ? calculateDuration(session.startedAt, session.completedAt)
      : 'Unknown';
    const summary = extractLastProgress(session.progress, 200);

    const newEntry = createSessionEntry(
      {
        name: session.name,
        todos: session.todos,
        activeTicketIds: session.activeTicketIds,
      },
      formattedDate,
      duration,
      summary
    );

    // 4. Add session with pruning (modifies parsed in place)
    addSessionWithPruning(parsed, newEntry);

    // 5. Generate new markdown content
    const newContent = generateProgressMarkdown(parsed);
    const newTokens = estimateProgressTokens(parsed);

    // 6. Upsert PROGRESS bank
    await prisma.memoryBank.upsert({
      where: {
        projectId_type: { projectId, type: MemoryBankType.PROGRESS },
      },
      create: {
        projectId,
        type: MemoryBankType.PROGRESS,
        content: newContent,
        summaryTokens: newTokens,
      },
      update: {
        content: newContent,
        summaryTokens: newTokens,
        updatedAt: new Date(),
      },
    });

    console.log(`[auto-sync] PROGRESS bank updated for project ${projectId} (${newTokens} tokens)`);
  } catch (error) {
    console.error('[auto-sync] Failed to sync PROGRESS bank:', error);
    // Don't throw - auto-sync failure shouldn't break session end
  }
}

/**
 * Auto-sync ACTIVE_CONTEXT bank when agent session ends
 *
 * Updates ACTIVE_CONTEXT memory bank with:
 * - Current focus (based on pending todos)
 * - Active tickets (from remaining work)
 * - Recent session info
 *
 * @param projectId - Project ID
 * @param session - Completed agent session data
 */
export async function autoSyncActiveContext(
  projectId: number,
  session: FullAgentSession
): Promise<void> {
  try {
    // Parse todos
    const todos = Array.isArray(session.todos)
      ? session.todos as Array<{ content: string; status: string; ticketId?: number | null }>
      : [];

    const pendingTodos = todos.filter(t => t.status !== 'completed');

    // Determine current focus
    let currentFocus: string;
    if (pendingTodos.length === 0) {
      currentFocus = 'No active work - ready for next task';
    } else {
      const inProgress = pendingTodos.find(t => t.status === 'in_progress');
      if (inProgress) {
        currentFocus = `Working on: ${inProgress.content}`;
      } else {
        const nextTodo = pendingTodos[0];
        currentFocus = nextTodo ? `Next up: ${nextTodo.content}` : 'No active work - ready for next task';
      }
    }

    // Get remaining tickets from pending todos
    const remainingTicketIds = pendingTodos
      .filter(t => t.ticketId)
      .map(t => `TICK-${t.ticketId}`);

    // Also include any session tickets that might still be active
    const allRemainingTickets = [
      ...new Set([
        ...remainingTicketIds,
        // Only include session tickets if there are pending todos for them
        ...session.activeTicketIds.filter(id =>
          pendingTodos.some(t => t.ticketId?.toString() === id)
        ).map(id => `TICK-${id}`),
      ]),
    ];

    // Generate ACTIVE_CONTEXT content
    const formattedDate = formatDateTime(new Date());
    const ticketList = allRemainingTickets.length > 0
      ? allRemainingTickets.join(', ')
      : 'None';

    const activeContextContent = `# Active Context
**Updated**: ${formattedDate}

## Current Focus
${currentFocus}

## Active Tickets
${ticketList}

## Recent Session
${session.name || 'Unnamed Session'} - ${session.status}`;

    const newTokens = estimateTokens(activeContextContent);

    // Upsert ACTIVE_CONTEXT bank
    await prisma.memoryBank.upsert({
      where: {
        projectId_type: { projectId, type: MemoryBankType.ACTIVE_CONTEXT },
      },
      create: {
        projectId,
        type: MemoryBankType.ACTIVE_CONTEXT,
        content: activeContextContent,
        summaryTokens: newTokens,
      },
      update: {
        content: activeContextContent,
        summaryTokens: newTokens,
        updatedAt: new Date(),
      },
    });

    console.log(`[auto-sync] ACTIVE_CONTEXT bank updated for project ${projectId} (${newTokens} tokens)`);
  } catch (error) {
    console.error('[auto-sync] Failed to sync ACTIVE_CONTEXT bank:', error);
    // Don't throw - auto-sync failure shouldn't break session end
  }
}
