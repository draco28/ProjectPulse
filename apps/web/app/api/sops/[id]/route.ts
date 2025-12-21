/**
 * SOP Get by ID API - Sprint 11 (EPIC-013: Client Agent Integration)
 *
 * GET /api/sops/[id] - Get full SOP details including content
 *
 * Multi-tenancy: Validates projectId ownership
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

//=============================================================================
// VALIDATION SCHEMA
//=============================================================================

const querySchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

//=============================================================================
// GET /api/sops/[id]
//=============================================================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid SOP ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);

    // 1. Validate query params
    const validation = querySchema.safeParse({
      projectId: searchParams.get('projectId'),
    });

    if (!validation.success) {
      console.error('[GET /api/sops/[id]] Validation failed', validation.error);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { projectId } = validation.data;

    console.log('[GET /api/sops/[id]] Getting SOP', { id, projectId });

    // 2. Query SOP with ownership validation
    const sop = await prisma.sOP.findFirst({
      where: {
        id,
        projectId, // Validate ownership
      },
    });

    if (!sop) {
      return NextResponse.json({ error: 'SOP not found', id, projectId }, { status: 404 });
    }

    console.log('[GET /api/sops/[id]] Found SOP', {
      id,
      title: sop.title,
      projectId,
    });

    return NextResponse.json(sop);
  } catch (error) {
    console.error('[GET /api/sops/[id]] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get SOP',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
