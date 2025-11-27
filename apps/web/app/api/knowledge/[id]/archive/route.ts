/**
 * Knowledge Archive API Route
 *
 * PATCH /api/knowledge/[id]/archive - Archive knowledge item
 * DELETE /api/knowledge/[id]/archive - Unarchive knowledge item
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectAccess, AuthError } from '@/lib/auth/validateRequest';

/**
 * PATCH /api/knowledge/[id]/archive
 *
 * Archive a knowledge item (soft delete)
 *
 * Archived items are:
 * - Hidden from search by default (unless includeArchived=true)
 * - Preserved in database (not deleted)
 * - Can be unarchived later
 *
 * Response:
 * - 200: Archived successfully
 * - 404: Item not found
 * - 500: Archive error
 *
 * US-090: Archive obsolete knowledge items
 *
 * @example
 * ```bash
 * PATCH /api/knowledge/42/archive
 * ```
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          error: 'Invalid item ID',
          details: 'ID must be a number',
        },
        { status: 400 }
      );
    }

    // Check if item exists and get its projectId
    const existingItem = await prisma.knowledgeItem.findUnique({
      where: { id },
      select: { id: true, title: true, archivedAt: true, projectId: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          error: 'Knowledge item not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }
    
    // Authenticate and validate project access
    await requireProjectAccess(request, existingItem.projectId);

    // Check if already archived
    if (existingItem.archivedAt) {
      return NextResponse.json(
        {
          error: 'Item already archived',
          details: `Item was archived at ${existingItem.archivedAt.toISOString()}`,
          code: 'ALREADY_ARCHIVED',
        },
        { status: 400 }
      );
    }

    // Archive the item (soft delete)
    const archivedItem = await prisma.knowledgeItem.update({
      where: { id },
      data: {
        archivedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        category: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      data: {
        id: archivedItem.id,
        title: archivedItem.title,
        category: archivedItem.category,
        archivedAt: archivedItem.archivedAt?.toISOString(),
        createdAt: archivedItem.createdAt.toISOString(),
        updatedAt: archivedItem.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    
    console.error('[PATCH /api/knowledge/[id]/archive] Archive failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to archive knowledge item',
        code: 'ARCHIVE_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge/[id]/archive
 *
 * Unarchive a knowledge item (restore from archive)
 *
 * Response:
 * - 200: Unarchived successfully
 * - 404: Item not found
 * - 400: Item not archived
 * - 500: Unarchive error
 *
 * @example
 * ```bash
 * DELETE /api/knowledge/42/archive
 * ```
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          error: 'Invalid item ID',
          details: 'ID must be a number',
        },
        { status: 400 }
      );
    }

    // Check if item exists and get its projectId
    const existingItem = await prisma.knowledgeItem.findUnique({
      where: { id },
      select: { id: true, title: true, archivedAt: true, projectId: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          error: 'Knowledge item not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }
    
    // Authenticate and validate project access
    await requireProjectAccess(request, existingItem.projectId);

    // Check if not archived
    if (!existingItem.archivedAt) {
      return NextResponse.json(
        {
          error: 'Item not archived',
          details: 'Cannot unarchive an item that is not archived',
          code: 'NOT_ARCHIVED',
        },
        { status: 400 }
      );
    }

    // Unarchive the item
    const unarchivedItem = await prisma.knowledgeItem.update({
      where: { id },
      data: {
        archivedAt: null,
      },
      select: {
        id: true,
        title: true,
        category: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      data: {
        id: unarchivedItem.id,
        title: unarchivedItem.title,
        category: unarchivedItem.category,
        archivedAt: null,
        createdAt: unarchivedItem.createdAt.toISOString(),
        updatedAt: unarchivedItem.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    
    console.error('[DELETE /api/knowledge/[id]/archive] Unarchive failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to unarchive knowledge item',
        code: 'UNARCHIVE_ERROR',
      },
      { status: 500 }
    );
  }
}
