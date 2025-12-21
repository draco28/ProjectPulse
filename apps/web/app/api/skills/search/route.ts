/**
 * Skills Search API Route Handler
 *
 * Sprint 6 - Phase 3: Skills API & MCP Tools
 * US-093: Search skills by keywords/tags
 *
 * Full-text search across title, description, tags, and frameworks.
 * Returns frontmatter only (excludes content field for token efficiency).
 *
 * Created: 2025-11-13
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/skills/search
 *
 * Full-text search across skill title, description, tags, and frameworks.
 * Returns frontmatter only (excludes content field).
 *
 * **Search strategy**:
 * - Title: Case-insensitive substring match (highest priority)
 * - Description: Case-insensitive substring match
 * - Tags: Array contains match (exact tag match)
 * - Frameworks: Array contains match (exact framework match)
 * - Results ranked by: title match > description match > tag match > framework match
 *
 * Query params:
 * - projectId: number (required) - Project ID for multi-tenancy scoping
 * - query: string (required) - Search query (1-200 chars)
 * - category: string (optional) - Filter by category
 * - tags: string[] (optional) - Filter by tags (comma-separated, AND logic)
 * - frameworks: string[] (optional) - Filter by frameworks (comma-separated, AND logic)
 * - limit: number (optional) - Max results (1-50, default: 10)
 *
 * Response (200):
 * {
 *   "data": {
 *     "results": [
 *       {
 *         "id": 1,
 *         "slug": "react-custom-hooks",
 *         "title": "React Custom Hooks",
 *         "category": "framework",
 *         "description": "Patterns for creating reusable React hooks...",
 *         "tags": ["react", "hooks", "performance"],
 *         "frameworks": ["React 18"],
 *         "usageCount": 10,
 *         "lastLoadedAt": "2025-11-13T14:30:00.000Z",
 *         "createdAt": "2025-11-13T10:00:00.000Z",
 *         "updatedAt": "2025-11-13T14:30:00.000Z",
 *         "relevance": 0.95 // Match quality (1.0 = title match, 0.7 = tag match, etc.)
 *       }
 *     ],
 *     "count": 1,
 *     "query": "react hooks"
 *   }
 * }
 *
 * Response (400): { "error": "Validation failed", "details": [...] }
 * Response (500): { "error": "Failed to search skills" }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract and validate projectId (required)
    const projectIdParam = searchParams.get('projectId');
    if (!projectIdParam) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'projectId', message: 'projectId is required' }],
        },
        { status: 400 }
      );
    }

    const projectId = parseInt(projectIdParam, 10);
    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'projectId', message: 'projectId must be a positive integer' }],
        },
        { status: 400 }
      );
    }

    // Extract and validate query (required)
    const query = searchParams.get('query');
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'query', message: 'query is required' }],
        },
        { status: 400 }
      );
    }

    if (query.length > 200) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'query', message: 'query must be at most 200 characters' }],
        },
        { status: 400 }
      );
    }

    // Extract optional filters
    const category = searchParams.get('category') || undefined;
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',').map((t) => t.trim()) : undefined;
    const frameworksParam = searchParams.get('frameworks');
    const frameworks = frameworksParam
      ? frameworksParam.split(',').map((f) => f.trim())
      : undefined;

    // Extract limit (default: 10, max: 50)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    // Build search query
    const searchQuery = query.trim().toLowerCase();

    // Build base where clause
    const where: Prisma.SkillWhereInput = {
      projectId,
      OR: [
        // Title match (case-insensitive substring)
        {
          title: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        // Description match (case-insensitive substring)
        {
          description: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        // Tag match (case-insensitive, array overlap)
        {
          tags: {
            hasSome: [searchQuery], // Check if any tag contains search term
          },
        },
        // Framework match (case-insensitive, array overlap)
        {
          frameworks: {
            hasSome: [searchQuery], // Check if any framework contains search term
          },
        },
      ],
    };

    // Apply additional filters (AND logic)
    if (category) {
      where.category = category;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasEvery: tags, // Must have ALL specified tags
      };
    }

    if (frameworks && frameworks.length > 0) {
      where.frameworks = {
        hasEvery: frameworks, // Must have ALL specified frameworks
      };
    }

    // Execute search (return frontmatter only, exclude content)
    const skills = await prisma.skill.findMany({
      where,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        description: true,
        tags: true,
        frameworks: true,
        usageCount: true,
        lastLoadedAt: true,
        createdAt: true,
        updatedAt: true,
        // CRITICAL: Exclude content field for token efficiency
      },
      orderBy: [
        // Prioritize by usage (popular skills first)
        { usageCount: 'desc' },
        // Then by title (alphabetical)
        { title: 'asc' },
      ],
    });

    // Calculate relevance scores
    const results = skills.map((skill) => {
      let relevance = 0;

      // Title match (highest priority)
      if (skill.title.toLowerCase().includes(searchQuery)) {
        relevance = 1.0;
      }
      // Description match (medium priority)
      else if (skill.description?.toLowerCase().includes(searchQuery)) {
        relevance = 0.85;
      }
      // Tag match (lower priority)
      else if (skill.tags.some((tag) => tag.toLowerCase().includes(searchQuery))) {
        relevance = 0.7;
      }
      // Framework match (lowest priority)
      else if (skill.frameworks.some((fw) => fw.toLowerCase().includes(searchQuery))) {
        relevance = 0.6;
      }

      return {
        ...skill,
        relevance: Number(relevance.toFixed(2)),
      };
    });

    // Sort by relevance (descending), then usageCount (descending)
    results.sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      return b.usageCount - a.usageCount;
    });

    return NextResponse.json({
      data: {
        results,
        count: results.length,
        query: query.trim(),
      },
    });
  } catch (error) {
    console.error('[GET /api/skills/search] Failed to search skills:', error);
    return NextResponse.json(
      {
        error: 'Failed to search skills',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
