/**
 * API Route: PUT /api/context/update
 * Self-Guiding MCP Architecture - Phase 1
 *
 * Update a specific memory bank's content.
 * Used for updating static banks (PROJECT_BRIEF, SYSTEM_PATTERNS, TECH_CONTEXT).
 * Dynamic banks (ACTIVE_CONTEXT, PROGRESS) are auto-synced via session_end.
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { MemoryBankType } from '@prisma/client';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';

// ============================================================================
// Request Schema
// ============================================================================

const requestSchema = z.object({
  projectId: z.number().int().positive(),
  bankType: z.enum([
    'PROJECT_BRIEF',
    'SYSTEM_PATTERNS',
    'TECH_CONTEXT',
    'ACTIVE_CONTEXT',
    'PROGRESS',
  ]),
  content: z.string().min(1, 'Content cannot be empty'),
  mode: z.enum(['replace', 'append']).default('replace'),
});

type _UpdateRequest = z.infer<typeof requestSchema>;

// ============================================================================
// Token Estimation
// ============================================================================

/**
 * Simple token estimation (~4 chars per token for English text)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Token budgets per bank type
 */
const TOKEN_BUDGETS: Record<string, number> = {
  PROJECT_BRIEF: 3000,
  SYSTEM_PATTERNS: 2000,
  TECH_CONTEXT: 2000,
  ACTIVE_CONTEXT: 1000,
  PROGRESS: 2000,
};

// ============================================================================
// Main Handler
// ============================================================================

export async function PUT(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const body = await request.json();
    const validated = requestSchema.parse(body);

    // Authenticate and validate project access
    const { projectId: authorizedProjectId } = await getAuthorizedProjectId(
      request,
      validated.projectId
    );

    // Ensure requested project matches authorized project
    if (authorizedProjectId !== validated.projectId) {
      return NextResponse.json({ error: 'Project access denied' }, { status: 403 });
    }

    // Check if memory bank exists
    const existingBank = await prisma.memoryBank.findUnique({
      where: {
        projectId_type: {
          projectId: validated.projectId,
          type: validated.bankType as MemoryBankType,
        },
      },
    });

    if (!existingBank) {
      return NextResponse.json(
        { error: `Memory bank ${validated.bankType} not found for project ${validated.projectId}` },
        { status: 404 }
      );
    }

    // Determine new content based on mode
    let newContent: string;
    if (validated.mode === 'append') {
      // Append to existing content with separator
      newContent = existingBank.content
        ? `${existingBank.content}\n\n---\n\n${validated.content}`
        : validated.content;
    } else {
      // Replace entirely
      newContent = validated.content;
    }

    // Estimate tokens and check budget
    const newTokens = estimateTokens(newContent);
    const budget = TOKEN_BUDGETS[validated.bankType] || 2000;

    if (newTokens > budget) {
      return NextResponse.json(
        {
          error: 'Token budget exceeded',
          message: `Content would use ~${newTokens} tokens, but ${validated.bankType} has a budget of ${budget} tokens.`,
          suggestion:
            validated.mode === 'append'
              ? 'Consider using mode: "replace" to overwrite content, or trim your update.'
              : 'Please trim your content to fit within the token budget.',
        },
        { status: 400 }
      );
    }

    // Update the memory bank
    const updatedBank = await prisma.memoryBank.update({
      where: {
        projectId_type: {
          projectId: validated.projectId,
          type: validated.bankType as MemoryBankType,
        },
      },
      data: {
        content: newContent,
        summaryTokens: newTokens,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      projectId: validated.projectId,
      bankType: validated.bankType,
      mode: validated.mode,
      tokens: newTokens,
      budget,
      updatedAt: updatedBank.updatedAt.toISOString(),
    });
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

    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to update memory bank'
    );
    return NextResponse.json({ error: 'Failed to update memory bank' }, { status: 500 });
  }
}
