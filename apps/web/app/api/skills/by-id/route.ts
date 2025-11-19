import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // No caching

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const skillId = parseInt(params.id, 10);

    if (isNaN(skillId)) {
      return NextResponse.json(
        { error: 'Invalid skill ID' },
        { status: 400 }
      );
    }

    // Fetch skill with full content
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        content: true, // Include full content for detail view
        category: true,
        tags: true,
        frameworks: true,
        usageCount: true,
        lastLoadedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(skill);
  } catch (error) {
    console.error('[API] Error fetching skill:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
