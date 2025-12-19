/**
 * Knowledge Item GET API Route
 *
 * GET /api/knowledge/[id] - Get full knowledge item by ID
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectAccess, AuthError } from '@/lib/auth/validateRequest';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid item ID', details: 'ID must be a number' },
        { status: 400 }
      );
    }

    // Find item first to check ownership
    const item = await prisma.knowledgeItem.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        tags: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
        archivedAt: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Knowledge item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Authenticate and validate project access
    await requireProjectAccess(request, item.projectId);

    return NextResponse.json({
      data: {
        id: item.id,
        title: item.title,
        content: item.content,
        category: item.category,
        tags: item.tags,
        projectId: item.projectId,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        archivedAt: item.archivedAt?.toISOString() || null,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('[GET /api/knowledge/[id]] Get failed:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve knowledge item', code: 'GET_ERROR' },
      { status: 500 }
    );
  }
}
