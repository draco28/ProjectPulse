/**
 * Knowledge Search API Route
 *
 * GET /api/knowledge/search - Search knowledge base
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledgeSchema } from '@/lib/validations/knowledge';
import { semanticSearch, fullTextSearch, hybridSearch, SearchError } from '@/lib/knowledge/search';
import { recordQueryMetric, estimateTokenUsage, type QueryMode } from '@/lib/knowledge/metrics';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

/**
 * GET /api/knowledge/search
 *
 * Search knowledge base using semantic, full-text, or hybrid search
 *
 * Query params:
 * - query: Search query text (required, 1-1000 chars)
 * - mode: 'semantic' | 'fulltext' | 'hybrid' (default: 'hybrid')
 * - limit: Max results (default: 5, max: 50)
 * - category: Optional category filter
 * - includeRelated: Include graph-related items (default: false) [future]
 *
 * Response:
 * - 200: Search results with scores and metadata
 * - 400: Validation error
 * - 503: Embedding service unavailable (semantic/hybrid only)
 * - 500: Server error
 *
 * @example
 * ```bash
 * # Hybrid search (default)
 * GET /api/knowledge/search?query=PostgreSQL%20indexing&limit=5
 *
 * # Semantic only
 * GET /api/knowledge/search?query=database%20performance&mode=semantic
 *
 * # Full-text only with category filter
 * GET /api/knowledge/search?query=Docker%20compose&mode=fulltext&category=DevOps
 * ```
 */
export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));

  try {
    // Parse and validate query params
    const searchParams = request.nextUrl.searchParams;
    const requestedProjectId = searchParams.get('projectId')
      ? parseInt(searchParams.get('projectId')!, 10)
      : undefined;

    // Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    const rawParams = {
      projectId,
      query: searchParams.get('query'),
      mode: searchParams.get('mode') || 'hybrid',
      limit: searchParams.get('limit'),
      category: searchParams.get('category') || undefined,
      includeRelated: searchParams.get('includeRelated'),
    };

    const validation = searchKnowledgeSchema.safeParse(rawParams);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { query, mode, limit, category } = validation.data;

    // Execute search based on mode
    const startTime = Date.now();
    let results;

    switch (mode) {
      case 'semantic':
        results = await semanticSearch(query, { projectId, limit, category });
        break;
      case 'fulltext':
        results = await fullTextSearch(query, { projectId, limit, category });
        break;
      case 'hybrid':
      default:
        results = await hybridSearch(query, { projectId, limit, category });
        break;
    }

    const duration = Date.now() - startTime;

    // Generate excerpts (first 200 chars of content)
    const resultsWithExcerpts = results.map((result) => ({
      id: result.id,
      title: result.title,
      excerpt: result.content.slice(0, 200) + (result.content.length > 200 ? '...' : ''),
      category: result.category,
      tags: result.tags,
      score: result.score,
      matchType: result.matchType,
    }));

    // Record query performance metrics (async, non-blocking)
    const tokenUsage = estimateTokenUsage(resultsWithExcerpts);
    const userAgent = request.headers.get('user-agent') || undefined;

    recordQueryMetric({
      query,
      queryMode: mode as QueryMode,
      latencyMs: duration,
      resultCount: results.length,
      tokenUsage,
      category,
      userAgent,
    }).catch((err) => {
      // Log but don't fail the request
      log.warn(
        { error: err instanceof Error ? err.message : String(err) },
        'Failed to record knowledge search metrics'
      );
    });

    return NextResponse.json({
      data: {
        results: resultsWithExcerpts,
        query,
        mode,
        count: results.length,
      },
      meta: {
        duration,
        limit,
        category: category || null,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    // Handle known search errors
    if (error instanceof SearchError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    // Log unexpected errors
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Knowledge search failed'
    );

    // Return generic error
    return NextResponse.json(
      {
        error: 'An unexpected error occurred during search',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
