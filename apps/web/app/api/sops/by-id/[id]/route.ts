import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // No caching

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sopId = parseInt(params.id, 10);

    if (isNaN(sopId)) {
      return NextResponse.json(
        { error: 'Invalid SOP ID' },
        { status: 400 }
      );
    }

    // Fetch SOP with full content
    const sop = await prisma.sOP.findUnique({
      where: { id: sopId },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        content: true, // Include full content for detail view
        category: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!sop) {
      return NextResponse.json(
        { error: 'SOP not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(sop);
  } catch (error) {
    console.error('[API] Error fetching SOP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
