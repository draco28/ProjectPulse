/**
 * Persona Get API - Sprint 11 (EPIC-013: Client Agent Integration)
 *
 * GET /api/personas/[id] - Get full persona details including systemPrompt
 *
 * Multi-tenancy: Validates projectId ownership
 * Security: Requires authentication (user session OR agent token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';

//=============================================================================
// VALIDATION SCHEMA
//=============================================================================

const querySchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

//=============================================================================
// GET /api/personas/[id]
//=============================================================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid persona ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);

    // 1. Validate query params
    const validation = querySchema.safeParse({
      projectId: searchParams.get('projectId'),
    });

    if (!validation.success) {
      console.error('[GET /api/personas/[id]] Validation failed', validation.error);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { projectId: requestedProjectId } = validation.data;

    // 2. Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    console.log('[GET /api/personas/[id]] Getting persona', { id, projectId });

    // 3. Query persona with ownership validation
    const persona = await prisma.agentPersona.findFirst({
      where: {
        id,
        projectId, // Validate ownership
      },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found', id, projectId }, { status: 404 });
    }

    console.log('[GET /api/personas/[id]] Found persona', {
      id,
      name: persona.name,
      projectId,
    });

    return NextResponse.json(persona);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error('[GET /api/personas/[id]] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get persona',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
