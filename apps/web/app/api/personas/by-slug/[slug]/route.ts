/**
 * Persona Get by Slug API - Sprint 11 (EPIC-013: Client Agent Integration)
 *
 * GET /api/personas/by-slug/[slug] - Get full persona details by slug
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
// GET /api/personas/by-slug/[slug]
//=============================================================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    if (!slug || slug.trim() === '') {
      return NextResponse.json({ error: 'Invalid persona slug' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);

    // 1. Validate query params
    const validation = querySchema.safeParse({
      projectId: searchParams.get('projectId'),
    });

    if (!validation.success) {
      console.error('[GET /api/personas/by-slug/[slug]] Validation failed', validation.error);
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

    console.log('[GET /api/personas/by-slug/[slug]] Getting persona', { slug, projectId });

    // 3. Query persona with ownership validation
    const persona = await prisma.agentPersona.findFirst({
      where: {
        slug,
        projectId, // Validate ownership
      },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found', slug, projectId }, { status: 404 });
    }

    console.log('[GET /api/personas/by-slug/[slug]] Found persona', {
      slug,
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

    console.error('[GET /api/personas/by-slug/[slug]] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get persona',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
