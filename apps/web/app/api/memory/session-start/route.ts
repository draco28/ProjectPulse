/**
 * API Route: GET /api/memory/session-start
 * Sprint 9: Memory Bank System - Session Start Workflow
 *
 * Load all 5 memory banks for session start
 * Target: ≤10K tokens total
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { loadSessionStart } from '@/lib/memory/memory-bank-service';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

const _querySchema = z.object({
  projectId: z.string().transform((val) => parseInt(val, 10)),
});

export async function GET(request: Request) {
  const log = createRequestLogger(getRequestId(request));

  try {
    const { searchParams } = new URL(request.url);
    const requestedProjectId = searchParams.get('projectId')
      ? parseInt(searchParams.get('projectId')!, 10)
      : undefined;

    // Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    const result = await loadSessionStart(projectId);

    return NextResponse.json(result);
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

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Memory session start failed');
    return NextResponse.json(
      { error: 'Failed to load session start memory banks' },
      { status: 500 }
    );
  }
}
