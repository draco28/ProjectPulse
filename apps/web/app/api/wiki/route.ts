/**
 * Wiki API Route
 *
 * GET /api/wiki - List wiki pages
 * POST /api/wiki - Create wiki page
 *
 * Security:
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createWikiPageSchema, normalizePath } from '@/lib/validations/wiki';
import { resolveCrossLinks, createPageLinks } from '@/lib/wiki/cross-linking';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';

/**
 * POST /api/wiki
 *
 * Create a new wiki page
 *
 * @see US-018: Wiki Editor UI (8 points)
 * @see US-020: wiki.create MCP tool (3 points)
 * @see next-js-expert recommendations: Zod validation, revalidatePath after mutation
 *
 * @example
 * POST /api/wiki
 * Body: {
 *   title: "Getting Started",
 *   path: "getting-started",
 *   content: "# Getting Started\n\nWelcome!",
 *   category: "getting-started",
 *   excerpt: "Learn how to get started"
 * }
 *
 * Response: {
 *   id: 1,
 *   title: "Getting Started",
 *   path: "getting-started",
 *   ...
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Authenticate and validate project access
    const requestedProjectId = body.projectId ? parseInt(body.projectId, 10) : undefined;
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    // Validate with Zod
    const validation = createWikiPageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { title, path, content, category, excerpt } = validation.data;

    // Normalize path: remove leading slash if present, then add it for DB storage
    const cleanPath = normalizePath(path);
    const normalizedPath = `/${cleanPath}`;

    // Check if path already exists (409 Conflict per next-js-expert)
    const existingPage = await prisma.wikiPage.findUnique({
      where: { path: normalizedPath },
      select: { id: true },
    });

    if (existingPage) {
      return NextResponse.json(
        {
          error: 'Path already exists',
          message: `A wiki page with path "${path}" already exists. Please choose a different path.`,
        },
        { status: 409 }
      );
    }

    // Resolve cross-links in content (US-108)
    const crossLinkResult = await resolveCrossLinks(content, normalizedPath);

    // Log warnings for unresolved links
    if (crossLinkResult.unresolvedLinks.length > 0) {
      console.warn(
        `[Wiki Create] Unresolved cross-links in ${title}:`,
        crossLinkResult.unresolvedLinks.map((l) => l.slug).join(', ')
      );
    }

    // Create wiki page with processed content
    const newPage = await prisma.wikiPage.create({
      data: {
        title,
        path: normalizedPath,
        content: crossLinkResult.content,
        category,
        excerpt: excerpt || null,
        version: 1,
        projectId,
      },
    });

    // Create PageLink relationships
    const targetPageIds = crossLinkResult.resolvedLinks.map((link) => link.wikiPageId);
    if (targetPageIds.length > 0) {
      await createPageLinks(newPage.id, targetPageIds, 'reference');
    }

    // Revalidate wiki list and detail pages (next-js-expert recommendation)
    revalidatePath('/wiki'); // List page
    revalidatePath(`/wiki/${path}`); // Detail page (use normalized path without leading slash)

    return NextResponse.json(newPage, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error creating wiki page:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to create wiki page. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wiki?category=guides&limit=10
 *
 * List wiki pages with optional filters
 * (This endpoint is optional - list page uses Server Component)
 *
 * @see US-016: Wiki List Page (5 points) - already complete
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedProjectId = searchParams.get('projectId')
      ? parseInt(searchParams.get('projectId')!, 10)
      : undefined;

    // Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);

    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 50);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    // Build where clause for non-search queries
    const where = category ? { projectId, category } : { projectId };

    if (search) {
      const searchTerm = search;
      const tsQuery = Prisma.sql`plainto_tsquery('english', ${searchTerm})`;
      const categoryCondition = category
        ? Prisma.sql`AND "category" = ${category} AND "projectId" = ${projectId}`
        : Prisma.sql`AND "projectId" = ${projectId}`;

      const [rows, countRows] = await Promise.all([
        prisma.$queryRaw<
          Array<{
            id: number;
            title: string;
            path: string;
            category: string | null;
            excerpt: string | null;
            createdAt: Date;
            updatedAt: Date;
            highlight: string | null;
            rank: number;
          }>
        >(
          Prisma.sql`
            SELECT
              "id",
              "title",
              "path",
              "category",
              "excerpt",
              "createdAt",
              "updatedAt",
              ts_headline(
                'english',
                "content",
                ${tsQuery},
                'MaxFragments=2, MinWords=5, MaxWords=20, StartSel=**, StopSel=**'
              ) AS highlight,
              ts_rank_cd("content_tsv", ${tsQuery}) AS rank
            FROM "WikiPage"
            WHERE "content_tsv" @@ ${tsQuery}
            ${categoryCondition}
            ORDER BY rank DESC, "updatedAt" DESC
            LIMIT ${limit} OFFSET ${offset};
          `
        ),
        prisma.$queryRaw<Array<{ count: number }>>(
          Prisma.sql`
            SELECT COUNT(*)::int AS count
            FROM "WikiPage"
            WHERE "content_tsv" @@ ${tsQuery}
            ${categoryCondition};
          `
        ),
      ]);

      const total = countRows[0]?.count ?? 0;

      const pages = rows.map((row) => ({
        id: row.id,
        title: row.title,
        path: row.path,
        category: row.category,
        excerpt: row.excerpt ?? row.highlight ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        // Expose highlight for consumers that want to render emphasis
        highlight: row.highlight,
      }));

      return NextResponse.json({
        pages,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    }

    // Fetch pages without search (simple Prisma query)
    const pages = await prisma.wikiPage.findMany({
      where,
      select: {
        id: true,
        title: true,
        path: true,
        category: true,
        excerpt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get total count
    const total = await prisma.wikiPage.count({ where });

    return NextResponse.json({
      pages,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error fetching wiki pages:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch wiki pages. Please try again.',
      },
      { status: 500 }
    );
  }
}
