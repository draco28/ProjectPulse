/**
 * Knowledge Export API Route
 *
 * GET /api/knowledge/export - Export knowledge graph
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

/**
 * GET /api/knowledge/export
 *
 * Export knowledge graph to JSON format
 *
 * Query params:
 * - includeEmbeddings: Include vector embeddings (default: false) - makes export large
 * - includeRelationships: Include graph relationships (default: true)
 * - category: Filter by category (optional)
 * - tags: Filter by tags (comma-separated, optional)
 * - since: Export items created after this date (ISO 8601, optional)
 * - limit: Max items to export (default: all, max: 10000)
 *
 * Response:
 * - 200: JSON export with items, relationships, metadata
 * - 400: Invalid parameters
 * - 500: Export error
 *
 * US-087: Export knowledge graph
 *
 * @example
 * ```bash
 * # Export all items without embeddings
 * GET /api/knowledge/export
 *
 * # Export with embeddings and relationships
 * GET /api/knowledge/export?includeEmbeddings=true
 *
 * # Export specific category since date
 * GET /api/knowledge/export?category=DevOps&since=2025-01-01
 *
 * # Export items with specific tags
 * GET /api/knowledge/export?tags=docker,postgresql
 * ```
 */
export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));

  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedProjectId = searchParams.get('projectId')
      ? parseInt(searchParams.get('projectId')!, 10)
      : undefined;

    // Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    // Parse query parameters
    const includeEmbeddings = searchParams.get('includeEmbeddings') === 'true';
    const includeRelationships = searchParams.get('includeRelationships') !== 'false'; // default true
    const category = searchParams.get('category');
    const tagsParam = searchParams.get('tags');
    const sinceParam = searchParams.get('since');
    const limitParam = searchParams.get('limit');

    // Build where clause with projectId for multi-tenancy
    const where: any = {
      projectId, // CRITICAL: Multi-tenancy filter
    };

    if (category) {
      where.category = category;
    }

    if (tagsParam) {
      const tags = tagsParam.split(',').map((t) => t.trim());
      where.tags = { hasSome: tags }; // Match any of the provided tags
    }

    if (sinceParam) {
      const since = new Date(sinceParam);
      if (isNaN(since.getTime())) {
        return NextResponse.json(
          {
            error: 'Invalid since parameter',
            details: 'since must be valid ISO 8601 date',
          },
          { status: 400 }
        );
      }
      where.createdAt = { gte: since };
    }

    // Parse limit
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 10000)) {
      return NextResponse.json(
        {
          error: 'Invalid limit parameter',
          details: 'limit must be between 1 and 10000',
        },
        { status: 400 }
      );
    }

    // Fetch knowledge items
    const items = await prisma.knowledgeItem.findMany({
      where,
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        archivedAt: true,
        // Conditionally include embeddings (large data)
        ...(includeEmbeddings && { embedding: true }),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch relationships if requested
    let relationships: any[] = [];
    if (includeRelationships && items.length > 0) {
      const itemIds = items.map((item) => item.id);
      relationships = await prisma.knowledgeRelationship.findMany({
        where: {
          OR: [{ fromId: { in: itemIds } }, { toId: { in: itemIds } }],
        },
        select: {
          id: true,
          fromId: true,
          toId: true,
          relationType: true,
          weight: true,
          createdAt: true,
        },
      });
    }

    // Build export response
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        itemCount: items.length,
        relationshipCount: relationships.length,
        includesEmbeddings: includeEmbeddings,
        includesRelationships: includeRelationships,
        filters: {
          category: category || null,
          tags: tagsParam || null,
          since: sinceParam || null,
        },
      },
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        archivedAt: item.archivedAt?.toISOString() || null,
        // Convert embedding buffer to array if included
        ...(includeEmbeddings && item.embedding
          ? {
              embedding: Array.from(item.embedding as unknown as ArrayLike<number>),
            }
          : {}),
      })),
      relationships,
    };

    return NextResponse.json({
      data: exportData,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Knowledge export failed');
    return NextResponse.json(
      {
        error: 'Failed to export knowledge graph',
        code: 'EXPORT_ERROR',
      },
      { status: 500 }
    );
  }
}
