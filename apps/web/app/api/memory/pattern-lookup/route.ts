/**
 * API Route: GET /api/memory/pattern-lookup
 * Sprint 9: Memory Bank System - Pattern Lookup Workflow
 *
 * Query a specific memory bank by type
 * Target: ≤1K tokens per lookup
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MemoryBankType } from '@prisma/client';
import { lookupPattern } from '@/lib/memory/memory-bank-service';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

const querySchema = z.object({
  projectId: z.string().transform((val) => parseInt(val, 10)),
  bankType: z.nativeEnum(MemoryBankType),
});

export async function GET(request: Request) {
  const log = createRequestLogger(getRequestId(request));

  try {
    const { searchParams } = new URL(request.url);
    const requestedProjectId = searchParams.get('projectId')
      ? parseInt(searchParams.get('projectId')!, 10)
      : undefined;
    const bankType = searchParams.get('bankType');

    // Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    const validated = querySchema.parse({ projectId: projectId.toString(), bankType });

    const result = await lookupPattern(validated.projectId, validated.bankType);

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

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Memory pattern lookup failed');
    return NextResponse.json({ error: 'Failed to lookup memory bank pattern' }, { status: 500 });
  }
}
