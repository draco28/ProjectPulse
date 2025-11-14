import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createWikiPageSchema, normalizePath } from '@/lib/validations/wiki';
import { resolveCrossLinks, createPageLinks } from '@/lib/wiki/cross-linking';
import { commitWikiCreate } from '@/lib/wiki/git-integration';

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
      },
    });

    // Create PageLink relationships
    const targetPageIds = crossLinkResult.resolvedLinks.map((link) => link.wikiPageId);
    if (targetPageIds.length > 0) {
      await createPageLinks(newPage.id, targetPageIds, 'reference');
    }

    // Commit to git (US-109: Git Integration)
    try {
      const gitResult = commitWikiCreate({
        title: newPage.title,
        path: newPage.path,
        content: newPage.content,
        category: newPage.category || 'uncategorized',
        excerpt: newPage.excerpt || undefined,
        createdAt: newPage.createdAt,
        updatedAt: newPage.updatedAt,
      });

      console.log(`[Wiki Create] Git commit: ${gitResult.commitSha} - ${gitResult.message}`);
    } catch (gitError) {
      // Log git errors but don't fail the API request
      console.error('[Wiki Create] Git commit failed:', gitError);
    }

    // Revalidate wiki list and detail pages (next-js-expert recommendation)
    revalidatePath('/wiki'); // List page
    revalidatePath(`/wiki/${path}`); // Detail page (use normalized path without leading slash)

    return NextResponse.json(newPage, { status: 201 });
  } catch (error) {
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
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 50);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    // Build where clause
    const where = category ? { category } : {};

    if (search) {
      const categoryFilterSql = category
        ? Prisma.sql`AND "category" = ${category}`
        : Prisma.sql``;

      const rankedPages = await prisma.$queryRaw<
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
      >(Prisma.sql`
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
            plainto_tsquery('english', ${search}),
            'MaxFragments=2, MinWords=5, MaxWords=20, StartSel=**, StopSel=**'
          ) AS highlight,
          ts_rank_cd("content_tsv", plainto_tsquery('english', ${search})) AS rank
        FROM "WikiPage"
        WHERE "content_tsv" @@ plainto_tsquery('english', ${search})
        ${categoryFilterSql}
        ORDER BY rank DESC, "updatedAt" DESC
        LIMIT ${limit} OFFSET ${offset};
      `);

      const countResult = await prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
        SELECT COUNT(*)::int AS count
        FROM "WikiPage"
        WHERE "content_tsv" @@ plainto_tsquery('english', ${search})
        ${categoryFilterSql};
      `);

      const total = countResult[0]?.count ?? 0;

      return NextResponse.json({
        pages: rankedPages.map((page) => ({
          ...page,
          highlight: page.highlight || page.excerpt,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    }

    // Fetch pages without search
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
