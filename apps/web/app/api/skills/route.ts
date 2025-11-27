/**
 * Skills API Route Handler
 *
 * Sprint 6 - Phase 3: Skills API & MCP Tools
 * US-091: List skills with frontmatter only (token efficiency)
 * US-095 foundation: Create skills
 *
 * This endpoint provides lazy-loading list view that excludes content field.
 * Token efficiency: ~60-80 tokens for 10 skills (92% reduction from loading full content).
 *
 * Security: Requires authentication (user session OR agent token)
 *
 * Created: 2025-11-13
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { createSkillSchema } from '@/lib/validations/skill';
import { generateSlugFromTitle } from '@/lib/skills/constants';
import { findSkillDuplicates, SkillDuplicationError } from '@/lib/skills/deduplication';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';

/**
 * GET /api/skills
 *
 * List all skills for a project with frontmatter only (excludes content).
 * Supports filtering, sorting, and pagination.
 *
 * Query params:
 * - projectId: number (required) - Project ID for multi-tenancy scoping
 * - category: string (optional) - Filter by category (framework, testing, workflow, troubleshooting, custom)
 * - tags: string[] (optional) - Filter by tags (comma-separated, AND logic)
 * - frameworks: string[] (optional) - Filter by frameworks (comma-separated, AND logic)
 * - sortBy: string (optional) - Sort field (title, usageCount, lastLoadedAt, createdAt, updatedAt) - default: title
 * - sortOrder: 'asc' | 'desc' (optional) - Sort direction - default: asc
 * - page: number (optional) - Page number (1-indexed) - default: 1
 * - limit: number (optional) - Items per page (1-50) - default: 10
 *
 * Response (200):
 * {
 *   "data": {
 *     "skills": [
 *       {
 *         "id": 1,
 *         "slug": "nextjs-server-components",
 *         "title": "Next.js Server Components",
 *         "category": "framework",
 *         "description": "Patterns for using React Server Components...",
 *         "tags": ["nextjs", "react", "server-components"],
 *         "frameworks": ["Next.js 14", "React 18"],
 *         "usageCount": 5,
 *         "lastLoadedAt": "2025-11-13T14:30:00.000Z",
 *         "createdAt": "2025-11-13T10:00:00.000Z",
 *         "updatedAt": "2025-11-13T14:30:00.000Z"
 *       }
 *     ],
 *     "pagination": {
 *       "page": 1,
 *       "limit": 10,
 *       "total": 42,
 *       "totalPages": 5,
 *       "hasMore": true
 *     }
 *   }
 * }
 *
 * Response (400): { "error": "Validation failed", "details": [...] }
 * Response (500): { "error": "Failed to list skills" }
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

    const requestedProjectId = parseInt(projectIdParam, 10);
    if (isNaN(requestedProjectId) || requestedProjectId <= 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ field: 'projectId', message: 'projectId must be a positive integer' }],
        },
        { status: 400 }
      );
    }

    // Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    // Extract optional filters
    const category = searchParams.get('category') || undefined;
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',').map((t) => t.trim()) : undefined;
    const frameworksParam = searchParams.get('frameworks');
    const frameworks = frameworksParam ? frameworksParam.split(',').map((f) => f.trim()) : undefined;

    // Extract sorting params
    const sortBy = searchParams.get('sortBy') || 'title';
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

    // Validate sortBy field
    const allowedSortFields = ['title', 'usageCount', 'lastLoadedAt', 'createdAt', 'updatedAt'];
    if (!allowedSortFields.includes(sortBy)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [
            {
              field: 'sortBy',
              message: `sortBy must be one of: ${allowedSortFields.join(', ')}`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Extract pagination params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.SkillWhereInput = {
      projectId,
    };

    if (category) {
      where.category = category;
    }

    if (tags && tags.length > 0) {
      // AND logic: skill must have ALL specified tags
      where.tags = {
        hasEvery: tags,
      };
    }

    if (frameworks && frameworks.length > 0) {
      // AND logic: skill must have ALL specified frameworks
      where.frameworks = {
        hasEvery: frameworks,
      };
    }

    // Build orderBy clause
    const orderBy: Prisma.SkillOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Execute query with count for pagination
    const [skills, total] = await Promise.all([
      prisma.skill.findMany({
        where,
        orderBy,
        skip,
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
          // CRITICAL: Exclude content field for token efficiency (US-091)
          // content: false (implicit by not selecting it)
        },
      }),
      prisma.skill.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      data: {
        skills,
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
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    
    console.error('[GET /api/skills] Failed to list skills:', error);
    return NextResponse.json(
      {
        error: 'Failed to list skills',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/skills
 *
 * Create a new skill with automatic slug generation (if not provided).
 *
 * Request body:
 * {
 *   "projectId": 1,
 *   "slug": "nextjs-server-components", // Optional: auto-generated from title if not provided
 *   "title": "Next.js Server Components",
 *   "content": "# Overview\n\nServer Components allow you to...",
 *   "category": "framework",
 *   "description": "Patterns for using React Server Components",
 *   "tags": ["nextjs", "react", "server-components"],
 *   "frameworks": ["Next.js 14", "React 18"]
 * }
 *
 * Response (201):
 * {
 *   "data": {
 *     "id": 1,
 *     "slug": "nextjs-server-components",
 *     "title": "Next.js Server Components",
 *     "content": "# Overview\n\nServer Components...",
 *     "category": "framework",
 *     "description": "Patterns for using React Server Components",
 *     "tags": ["nextjs", "react", "server-components"],
 *     "frameworks": ["Next.js 14", "React 18"],
 *     "usageCount": 0,
 *     "lastLoadedAt": null,
 *     "createdAt": "2025-11-13T10:00:00.000Z",
 *     "updatedAt": "2025-11-13T10:00:00.000Z"
 *   }
 * }
 *
 * Response (400): { "error": "Validation failed", "details": [...] }
 * Response (409): { "error": "Skill with this slug already exists", "code": "DUPLICATE_SLUG" }
 * Response (500): { "error": "Failed to create skill" }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();

    // Auto-generate slug from title if not provided
    if (!body.slug && body.title) {
      body.slug = generateSlugFromTitle(body.title);
      console.log(`[POST /api/skills] Auto-generated slug: "${body.slug}" from title: "${body.title}"`);
    }

    const validation = createSkillSchema.safeParse(body);

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

    const { projectId: requestedProjectId, slug, title, content, category, description, tags, frameworks } =
      validation.data;

    // Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    // US-105: Check for duplicates (slug and title)
    const deduplicationResult = await findSkillDuplicates({
      projectId,
      slug,
      title,
      category,
      limit: 5,
    });

    if (deduplicationResult.isDuplicate || deduplicationResult.candidates.length > 0) {
      const topCandidate = deduplicationResult.candidates[0];
      const matchType = topCandidate?.matchType ?? 'similar';

      return NextResponse.json(
        {
          error: deduplicationResult.suggestion || `Potential duplicate skill detected`,
          code: matchType === 'slug_exact' ? 'DUPLICATE_SLUG' : 'SIMILAR_TITLE',
          duplicates: deduplicationResult.candidates.map((c) => ({
            id: c.id,
            slug: c.slug,
            title: c.title,
            category: c.category,
            matchType: c.matchType,
          })),
        },
        { status: 409 }
      );
    }

    // Create skill
    const skill = await prisma.skill.create({
      data: {
        projectId,
        slug,
        title,
        content,
        category,
        description,
        tags,
        frameworks,
        usageCount: 0,
      },
    });

    console.log(`[POST /api/skills] Created skill: ${skill.slug} (id: ${skill.id})`);

    return NextResponse.json(
      {
        data: skill,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
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

    console.error('[POST /api/skills] Failed to create skill:', error);

    return NextResponse.json(
      {
        error: 'Failed to create skill',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
