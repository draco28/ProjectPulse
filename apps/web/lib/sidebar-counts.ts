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
    // Sprint 10: Use ticket model - Open + In Progress issues
    prisma.ticket.count({
      where: {
        projectId,
        kind: { in: ['issue', 'bug', 'scanner_finding'] },
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
