import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/wiki/:slug
 *
 * Fetch a wiki page by its path/slug
 * Returns page content, metadata, and related pages
 *
 * Path params:
 * - slug: The wiki page path (e.g., 'getting-started')
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    // Normalize slug to match database path format
    const path = slug.startsWith('/') ? slug : `/${slug}`;

    // Fetch the wiki page
    const page = await prisma.wikiPage.findUnique({
      where: { path },
      select: {
        id: true,
        title: true,
        content: true,
        path: true,
        category: true,
        author: true,
        createdAt: true,
        updatedAt: true,
        // Related pages via PageLink junction table
        relatedFrom: {
          select: {
            to: {
              select: {
                id: true,
                title: true,
                path: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!page) {
      return NextResponse.json(
        {
          success: false,
          error: 'Wiki page not found',
        },
        { status: 404 }
      );
    }

    // Extract related pages from junction table
    const relatedPages = page.relatedFrom.map((link) => link.to);

    // Return page with related pages
    return NextResponse.json({
      success: true,
      data: {
        page: {
          id: page.id,
          title: page.title,
          content: page.content,
          path: page.path,
          category: page.category,
          author: page.author,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
        },
        relatedPages,
      },
    });
  } catch (error) {
    console.error('Failed to fetch wiki page:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch wiki page',
      },
      { status: 500 }
    );
  }
}
