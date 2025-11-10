import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createWikiPageSchema, normalizePath } from '@/lib/validations/wiki';

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
 *   slug: "getting-started",
 *   content: "# Getting Started\n\nWelcome!",
 *   category: "getting-started",
 *   excerpt: "Learn how to get started",
 *   parentPath: null
 * }
 *
 * Response: {
 *   id: "...",
 *   title: "Getting Started",
 *   slug: "getting-started",
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

    const { title, path, content, category, excerpt, parentPath } = validation.data;

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

    // Create wiki page
    const newPage = await prisma.wikiPage.create({
      data: {
        title,
        path: normalizedPath,
        content,
        category,
        excerpt: excerpt || null,
        parentPath: parentPath || null,
        version: 1,
      },
    });

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
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where clause
    const where = category ? { category } : {};

    // Fetch pages
    const pages = await prisma.wikiPage.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
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
