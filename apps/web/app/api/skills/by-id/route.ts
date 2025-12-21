/**
 * Skill Get by ID API - Sprint 11 Security Update
 *
 * GET /api/skills/by-id?id=X&projectId=Y - Get full skill details by ID
 *
 * Multi-tenancy: Validates projectId ownership
 * Security: Requires authentication (user session OR agent token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  id: z.coerce.number().int().positive(),
  projectId: z.coerce.number().int().positive(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Validate query params
    const validation = querySchema.safeParse({
      id: searchParams.get('id'),
      projectId: searchParams.get('projectId'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { id: skillId, projectId: requestedProjectId } = validation.data;

    // 2. Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    // 3. Fetch skill with ownership validation
    const skill = await prisma.skill.findFirst({
      where: {
        id: skillId,
        projectId, // Validate ownership
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        content: true,
        category: true,
        tags: true,
        frameworks: true,
        usageCount: true,
        lastLoadedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found', id: skillId, projectId },
        { status: 404 }
      );
    }

    return NextResponse.json(skill);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error('[GET /api/skills/by-id] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
