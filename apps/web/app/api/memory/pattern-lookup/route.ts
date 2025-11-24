/**
 * API Route: GET /api/memory/pattern-lookup
 * Sprint 9: Memory Bank System - Pattern Lookup Workflow
 * 
 * Query a specific memory bank by type
 * Target: ≤1K tokens per lookup
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MemoryBankType } from '@prisma/client';
import { lookupPattern } from '@/lib/memory/memory-bank-service';

const querySchema = z.object({
  projectId: z.string().transform((val) => parseInt(val, 10)),
  bankType: z.nativeEnum(MemoryBankType),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const bankType = searchParams.get('bankType');

    const validated = querySchema.parse({ projectId, bankType });

    const result = await lookupPattern(validated.projectId, validated.bankType);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: error.issues },
        { status: 400 }
      );
    }

    console.error('GET /api/memory/pattern-lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup memory bank pattern' },
      { status: 500 }
    );
  }
}
