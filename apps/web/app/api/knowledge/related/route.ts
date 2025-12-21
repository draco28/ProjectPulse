/**
 * Knowledge Related Items API Route
 *
 * GET /api/knowledge/related - Find related knowledge items
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 */

import { NextRequest, NextResponse } from 'next/server';
import { findRelatedKnowledgeItems, GraphError } from '@/lib/knowledge/graph';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';

/**
 * GET /api/knowledge/related
 *
 * Find related knowledge items via graph traversal (1-2 hops)
 *
 * Query params:
 * - projectId: Project ID (required)
 * - itemId: Source knowledge item ID (required)
 * - maxDepth: Max relationship hops (1 or 2, default: 2)
 * - limit: Max results (default: 10, max: 50)
 * - minStrength: Minimum relationship strength 0-1 (default: 0.5)
 *
 * Response:
 * - 200: Related items with relationship metadata
 * - 400: Validation error
 * - 404: Source item not found
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedProjectId = searchParams.get('projectId')
      ? parseInt(searchParams.get('projectId')!, 10)
      : undefined;

    // Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    // Parse and validate query params
    const itemId = parseInt(searchParams.get('itemId') || '0', 10);
    const maxDepth = parseInt(searchParams.get('maxDepth') || '2', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const minStrength = parseFloat(searchParams.get('minStrength') || '0.5');

    if (!itemId || itemId < 1) {
      return NextResponse.json({ error: 'Valid itemId is required' }, { status: 400 });
    }

    // Validate ranges
    if (maxDepth < 1 || maxDepth > 2) {
      return NextResponse.json({ error: 'maxDepth must be 1 or 2' }, { status: 400 });
    }

    if (limit < 1 || limit > 50) {
      return NextResponse.json({ error: 'limit must be between 1 and 50' }, { status: 400 });
    }

    if (minStrength < 0 || minStrength > 1) {
      return NextResponse.json({ error: 'minStrength must be between 0 and 1' }, { status: 400 });
    }

    // Execute graph traversal
    const startTime = Date.now();
    const relatedItems = await findRelatedKnowledgeItems(itemId, {
      projectId,
      maxDepth,
      limit,
      minStrength,
    });

    const duration = Date.now() - startTime;

    return NextResponse.json({
      data: {
        sourceItemId: itemId,
        relatedItems,
        count: relatedItems.length,
      },
      meta: {
        duration,
        projectId,
        maxDepth,
        limit,
        minStrength,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    // Handle known graph errors
    if (error instanceof GraphError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    // Log unexpected errors
    console.error('[GET /api/knowledge/related] Unexpected error:', error);

    // Return generic error
    return NextResponse.json(
      {
        error: 'An unexpected error occurred during graph traversal',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
