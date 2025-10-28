import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/wiki/:slug
 *
 * Fetch a wiki page by its path/slug
 * Returns page content, metadata, and related pages
 *
 * Path params:
 * - slug: The wiki page path (e.g., 'getting-started')
 */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
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
        createdAt: true,
        updatedAt: true,
        // Related pages via outgoing links
        outgoingLinks: {
          select: {
            targetPage: {
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
      return NextResponse.json({ error: 'Wiki page not found' }, { status: 404 });
    }

    // Extract related pages from outgoing links
    const relatedPages = page.outgoingLinks.map((link) => link.targetPage);

    // Return page with related pages
    return NextResponse.json({
      data: {
        page: {
          id: page.id,
          title: page.title,
          content: page.content,
          path: page.path,
          category: page.category,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
        },
        relatedPages,
      },
    });
  } catch (error) {
    console.error('Failed to fetch wiki page:', error);
    return NextResponse.json({ error: 'Failed to fetch wiki page' }, { status: 500 });
  }
}
