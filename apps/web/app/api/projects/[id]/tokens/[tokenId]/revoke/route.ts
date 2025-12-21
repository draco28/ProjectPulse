/**
 * Revoke Project Token API (Sprint 9)
 *
 * Revoke a specific agent token by ID.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth-server';
import { revokeProjectTokenById } from '@/lib/agent-tokens';

/**
 * POST /api/projects/[id]/tokens/[tokenId]/revoke
 *
 * Revoke a specific token (owner only).
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string; tokenId: string } }
) {
  try {
    const user = await requireUser();
    const projectId = parseInt(params.id, 10);
    const tokenId = parseInt(params.tokenId, 10);

    if (isNaN(projectId) || isNaN(tokenId)) {
      return NextResponse.json({ error: 'Invalid project ID or token ID' }, { status: 400 });
    }

    // Verify ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this project' },
        { status: 403 }
      );
    }

    // Revoke token
    await revokeProjectTokenById(projectId, tokenId);

    return NextResponse.json({ message: 'Token revoked successfully' }, { status: 200 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('POST /api/projects/[id]/tokens/[tokenId]/revoke error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
