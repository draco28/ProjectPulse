/**
 * Knowledge API Route
 *
 * GET /api/knowledge - List knowledge items
 * POST /api/knowledge - Create knowledge item
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { createKnowledgeItemSchema } from '@/lib/validations/knowledge';
import {
  createKnowledgeItem,
  KnowledgeCreationError,
  DuplicationError,
} from '@/lib/knowledge/create';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';

/**
 * GET /api/knowledge
 *
 * Fetch knowledge base articles with optional filtering and pagination
 *
 * Query params:
 * - search: Search in title and content (case-insensitive)
 * - tag: Filter by tag
 * - sort: 'newest' | 'updated' (default: 'newest')
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedProjectId = searchParams.get('projectId')
      ? parseInt(searchParams.get('projectId')!, 10)
      : undefined;

    // Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    // Build where clause
    const where: Prisma.KnowledgeItemWhereInput = { projectId };

    // Exclude archived items by default (US-090)
    where.archivedAt = null;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { content: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (tag) {
      where.tags = { has: tag }; // Array filtering
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with count for pagination
    const [articles, total] = await Promise.all([
      prisma.knowledgeItem.findMany({
        where,
        orderBy: sort === 'newest' ? { createdAt: 'desc' } : { updatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.knowledgeItem.count({ where }),
    ]);

    // Generate excerpts (first 150 characters)
    const articlesWithExcerpts = articles.map((article) => ({
      ...article,
      excerpt: article.content.slice(0, 150) + (article.content.length > 150 ? '...' : ''),
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      data: {
        articles: articlesWithExcerpts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore,
        },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to fetch knowledge articles:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge articles' }, { status: 500 });
  }
}

/**
 * POST /api/knowledge
 *
 * Create a new knowledge item with automatic embedding generation.
 * Embeddings are generated from title + content using Ollama (primary)
 * or OpenAI (fallback).
 *
 * Request body:
 * - title: string (1-200 chars)
 * - content: string (10-50000 chars)
 * - category: string (1-50 chars)
 * - tags: string[] (0-20 items)
 *
 * Response:
 * - 201: Created successfully
 * - 400: Validation error
 * - 503: Embedding service unavailable
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestedProjectId = body.projectId ? parseInt(body.projectId, 10) : undefined;

    // Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    const validation = createKnowledgeItemSchema.safeParse(body);

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

    // Extract allowDuplicates from body (US-089: defaults to false for dedup checks)
    const allowDuplicates = body.allowDuplicates === true;

    // Create knowledge item with auto-embedding
    const result = await createKnowledgeItem(validation.data, allowDuplicates);

    // Return success response
    return NextResponse.json(
      {
        data: {
          id: result.id,
          title: result.title,
          content: result.content,
          category: result.category,
          tags: result.tags,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString(),
        },
        meta: {
          embeddingProvider: result.embeddingProvider,
          embeddingDuration: result.embeddingDuration,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    // Handle duplicate detection errors (US-089)
    if (error instanceof DuplicationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          duplicates: error.duplicates || [],
        },
        { status: error.statusCode }
      );
    }

    // Handle known errors
    if (error instanceof KnowledgeCreationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
        },
        { status: 400 }
      );
    }

    // Log unexpected errors
    console.error('[POST /api/knowledge] Unexpected error:', error);

    // Return generic error
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
