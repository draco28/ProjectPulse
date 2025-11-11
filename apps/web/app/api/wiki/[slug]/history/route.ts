import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_HISTORY_LIMIT = 10;
const MAX_HISTORY_LIMIT = 50;

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slugPath = params.slug.startsWith('/') ? params.slug : `/${params.slug}`;
    const page = await prisma.wikiPage.findUnique({
      where: { path: slugPath },
      select: { id: true },
    });

    if (!page) {
      return NextResponse.json({ error: 'Wiki page not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const cursorParam = searchParams.get('cursor');

    const limit = Math.min(
      Math.max(parseInt(limitParam ?? `${DEFAULT_HISTORY_LIMIT}`, 10) || DEFAULT_HISTORY_LIMIT, 1),
      MAX_HISTORY_LIMIT
    );

    const cursorVersion = cursorParam ? parseInt(cursorParam, 10) : undefined;

    const revisions = await prisma.wikiRevision.findMany({
      where: { wikiPageId: page.id },
      orderBy: { version: 'desc' },
      take: limit,
      skip: cursorVersion ? 1 : 0,
      cursor: cursorVersion
        ? { wikiPageId_version: { wikiPageId: page.id, version: cursorVersion } }
        : undefined,
      select: {
        version: true,
        title: true,
        excerpt: true,
        createdBy: true,
        createdByType: true,
        createdAt: true,
        diffSummary: true,
      },
    });

    const nextCursor = revisions.length === limit ? revisions[revisions.length - 1]?.version ?? null : null;

    return NextResponse.json({
      data: revisions,
      pagination: {
        limit,
        nextCursor,
        hasMore: Boolean(nextCursor),
      },
    });
  } catch (error) {
    console.error('Failed to fetch wiki history:', error);
    return NextResponse.json({ error: 'Failed to fetch wiki history' }, { status: 500 });
  }
}
