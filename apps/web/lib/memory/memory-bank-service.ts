/**
 * Memory Bank Service Layer (Sprint 9)
 * Token-efficient context management for AI agents
 * 
 * Workflows:
 * - Session Start: Load all banks (≤10K tokens)
 * - Pattern Lookup: Query specific banks (≤1K tokens)
 * - Context Recovery: Restore session context (≤6K tokens)
 */

import { prisma } from '@/lib/prisma';
import { MemoryBankType } from '@prisma/client';

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
