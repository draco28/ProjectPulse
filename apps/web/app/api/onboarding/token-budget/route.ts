/**
 * POST /api/onboarding/token-budget
 * 
 * Sprint 9 Refactor: Check if estimated token usage is within 200K session limit
 * Prevents token overflow by tracking usage in OnboardingSession.metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const requestSchema = z.object({
  projectId: z.number().int().positive(),
  estimatedTokens: z.number().int().positive()
});

type TokenBudgetRequest = z.infer<typeof requestSchema>;

// ============================================================================
// CONSTANTS
// ============================================================================

const TOKEN_BUDGET_LIMIT = 200000; // 200K tokens per session

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  console.log('[POST /api/onboarding/token-budget] Checking token budget...');
  
  try {
    // 1. Validate request
    const body = await request.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      console.error('[POST /api/onboarding/token-budget] Validation failed:', validation.error);
      
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { projectId, estimatedTokens }: TokenBudgetRequest = validation.data;
    
    console.log('[POST /api/onboarding/token-budget] Request validated', {
      projectId,
      estimatedTokens
    });
    
    // 2. Find active onboarding session for this project
    const session = await prisma.onboardingSession.findFirst({
      where: {
        projectId,
        status: { in: ['pending', 'in_progress'] }
      },
      select: {
        id: true,
        sessionNumber: true,
        metrics: true
      },
      orderBy: {
        sessionNumber: 'asc' // Get the earliest active session
      }
    });
    
    if (!session) {
      console.log('[POST /api/onboarding/token-budget] No active session found, assuming safe');
      
      // No active session = starting fresh, so it's safe
      return NextResponse.json({
        projectId,
        sessionNumber: null,
        tokensUsed: 0,
        estimatedTokens,
        totalEstimated: estimatedTokens,
        budgetLimit: TOKEN_BUDGET_LIMIT,
        remaining: TOKEN_BUDGET_LIMIT - estimatedTokens,
        safe: estimatedTokens < TOKEN_BUDGET_LIMIT,
        recommendation: estimatedTokens < TOKEN_BUDGET_LIMIT
          ? 'Proceed with operation'
          : 'Estimated tokens exceed budget - reduce scope or split into multiple sessions'
      });
    }
    
    // 3. Get current token usage from metrics
    const metrics = (session.metrics as any) || { tokensUsed: 0 };
    const tokensUsed = metrics.tokensUsed || 0;
    
    // 4. Calculate total estimated usage
    const totalEstimated = tokensUsed + estimatedTokens;
    const remaining = TOKEN_BUDGET_LIMIT - totalEstimated;
    const safe = totalEstimated < TOKEN_BUDGET_LIMIT;
    
    console.log('[POST /api/onboarding/token-budget] Budget check complete', {
      projectId,
      sessionNumber: session.sessionNumber,
      tokensUsed,
      estimatedTokens,
      totalEstimated,
      remaining,
      safe
    });
    
    // 5. Determine recommendation
    let recommendation: string;
    
    if (safe) {
      if (remaining < 50000) {
        recommendation = 'Proceed with caution - approaching budget limit';
      } else {
        recommendation = 'Proceed with operation';
      }
    } else {
      recommendation = 'Token budget exceeded - defer remaining operations to next session or reduce scope';
    }
    
    // 6. Log warning if unsafe
    if (!safe) {
      console.warn('[POST /api/onboarding/token-budget] TOKEN BUDGET EXCEEDED!', {
        projectId,
        sessionNumber: session.sessionNumber,
        totalEstimated,
        budgetLimit: TOKEN_BUDGET_LIMIT,
        excess: totalEstimated - TOKEN_BUDGET_LIMIT
      });
    }
    
    return NextResponse.json({
      projectId,
      sessionNumber: session.sessionNumber,
      tokensUsed,
      estimatedTokens,
      totalEstimated,
      budgetLimit: TOKEN_BUDGET_LIMIT,
      remaining,
      safe,
      recommendation
    });
    
  } catch (error) {
    console.error('[POST /api/onboarding/token-budget] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to check token budget', message: errorMessage },
      { status: 500 }
    );
  }
}
