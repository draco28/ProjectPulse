/**
 * API Route: GET /api/memory/session-start
 * Sprint 9: Memory Bank System - Session Start Workflow
 * 
 * Load all 5 memory banks for session start
 * Target: ≤10K tokens total
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { loadSessionStart } from '@/lib/memory/memory-bank-service';

const querySchema = z.object({
  projectId: z.string().transform((val) => parseInt(val, 10)),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const validated = querySchema.parse({ projectId });

    const result = await loadSessionStart(validated.projectId);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: error.issues },
        { status: 400 }
      );
    }

    console.error('GET /api/memory/session-start error:', error);
    return NextResponse.json(
      { error: 'Failed to load session start memory banks' },
      { status: 500 }
    );
  }
}
