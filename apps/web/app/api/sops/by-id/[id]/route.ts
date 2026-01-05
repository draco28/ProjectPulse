/**
 * SOP Get by ID API - Sprint 11 (EPIC-013: Client Agent Integration)
 *
 * GET /api/sops/by-id/[id] - Get full SOP details by ID
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

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const log = createRequestLogger(getRequestId(request));

  try {
    const { id: idParam } = await params;
    const sopId = parseInt(idParam, 10);

    if (isNaN(sopId) || sopId <= 0) {
      return NextResponse.json({ error: 'Invalid SOP ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);

    // 1. Validate query params
    const validation = querySchema.safeParse({
      projectId: searchParams.get('projectId'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { projectId: requestedProjectId } = validation.data;

    // 2. Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    // 3. Fetch SOP with ownership validation
    const sop = await prisma.sOP.findFirst({
      where: {
        id: sopId,
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!sop) {
      return NextResponse.json({ error: 'SOP not found', id: sopId, projectId }, { status: 404 });
    }

    return NextResponse.json(sop);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Get SOP by ID failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
