/**
 * Sidebar Counts Helper
 * Fetches project-scoped counts for sidebar badges
 */

import { prisma } from '@/lib/prisma';

export interface SidebarCounts {
  issues?: number;
  health?: number;
  knowledge?: number;
  wiki?: number;
}

export async function getSidebarCounts(projectId: number): Promise<SidebarCounts> {
  const [issuesCount, healthCount, knowledgeCount, wikiCount] = await Promise.all([
    // Open + In Progress issues
    prisma.issue.count({
      where: {
        projectId,
        status: { in: ['open', 'in-progress'] },
      },
    }),
    // Open security findings
    prisma.securityFinding.count({
      where: {
        projectId,
        status: 'open',
      },
    }),
    // Total knowledge items
    prisma.knowledgeItem.count({
      where: { projectId },
    }),
    // Total wiki pages
    prisma.wikiPage.count({
      where: { projectId },
    }),
  ]);

  return {
    issues: issuesCount,
    health: healthCount,
    knowledge: knowledgeCount,
    wiki: wikiCount,
  };
}
