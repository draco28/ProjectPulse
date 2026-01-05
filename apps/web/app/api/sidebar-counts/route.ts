import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { getSidebarCounts } from '@/lib/sidebar-counts';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get projectId from query
    const projectId = request.nextUrl.searchParams.get('project');
    if (!projectId) {
      return NextResponse.json({ error: 'Missing project parameter' }, { status: 400 });
    }

    const projectIdNum = parseInt(projectId, 10);
    if (isNaN(projectIdNum)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Verify project ownership and get project name
    const { prisma } = await import('@/lib/prisma');
    const project = await prisma.project.findUnique({
      where: { id: projectIdNum },
      select: { ownerId: true, name: true },
    });

    if (!project || project.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch counts
    const counts = await getSidebarCounts(projectIdNum);

    // Return counts + project name for Sidebar display
    return NextResponse.json({ ...counts, projectName: project.name });
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Sidebar counts error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
