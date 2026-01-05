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
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

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
  const log = createRequestLogger(getRequestId(request));

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
      log.warn({ validationError: validation.error.errors }, 'Persona get validation failed');
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

    log.debug({ id, projectId }, 'Getting persona by ID');

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

    log.debug({ id, name: persona.name, projectId }, 'Found persona');

    return NextResponse.json(persona);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Persona get failed');
    return NextResponse.json(
      {
        error: 'Failed to get persona',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
