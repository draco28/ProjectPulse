import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

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
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    // Build where clause
    const where: Prisma.KnowledgeItemWhereInput = {};

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
    console.error('Failed to fetch knowledge articles:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge articles' }, { status: 500 });
  }
}
