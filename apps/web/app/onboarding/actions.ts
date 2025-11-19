/**
 * Server Actions for Onboarding
 *
 * Provides server-side actions for all 3 onboarding sessions
 */

'use server';

import { revalidatePath } from 'next/cache';

// ============================================================================
// Session 1: Strategic Planning
// ============================================================================

export async function submitAnswers(projectId: number, phase: number, answers: Record<string, string>) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/onboarding/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, phase, answers }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to submit answers' };
    }

    const result = await response.json();
    revalidatePath('/onboarding');
    revalidatePath('/onboarding/session-1');
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export async function storeExecutiveSummary(projectId: number, executiveSummary: string, wordCount?: number) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/onboarding/executive-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, executiveSummary, wordCount }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to store summary' };
    }

    const result = await response.json();
    revalidatePath('/onboarding');
    revalidatePath('/onboarding/session-1');
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// ============================================================================
// Session 2: Documentation Generation
// ============================================================================

export async function storeDocument(
  projectId: number,
  filename: string,
  content: string,
  category: string,
  wordCount: number
) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/onboarding/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, filename, content, category, wordCount }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to store document' };
    }

    const result = await response.json();
    revalidatePath('/onboarding');
    revalidatePath('/onboarding/session-2');
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// ============================================================================
// Session 3: AI Workflow Bootstrap
// ============================================================================

export async function bootstrapWorkflow(projectId: number, repoPath: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/onboarding/bootstrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, repoPath }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to bootstrap' };
    }

    const result = await response.json();
    revalidatePath('/onboarding');
    revalidatePath('/onboarding/session-3');
    revalidatePath('/agents');
    revalidatePath('/roadmap');
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}
