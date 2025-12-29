import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // No caching

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = parseInt(params.id, 10);

    if (isNaN(agentId)) {
      return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 });
    }

    // Fetch agent with project relation
    const agent = await prisma.agentPersona.findUnique({
      where: { id: agentId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Fetch full Skill records for agent's skills (project-scoped)
    const skillDetails = await prisma.skill.findMany({
      where: {
        projectId: agent.projectId, // Sprint 8.5 Phase 3: Project-scoped
        slug: { in: agent.skills }, // Match agent's skill slugs
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        tags: true,
        frameworks: true,
        usageCount: true,
        lastLoadedAt: true,
        // Exclude content field for performance
      },
      orderBy: { usageCount: 'desc' },
    });

    // Fetch workflows matching agent expertise
    const workflows = await prisma.workflowTemplate.findMany({
      where: {
        projectId: agent.projectId, // SECURITY: Filter by agent's project
        // Filter by categories that match agent's expertise
        category: { in: agent.expertise },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        steps: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      ...agent,
      skillDetails,
      workflows,
    });
  } catch (error) {
    console.error('[API] Error fetching agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
