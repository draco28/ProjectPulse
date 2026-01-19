/**
 * Sidebar Counts Helper
 * Fetches project-scoped counts for sidebar badges
 */

import { prisma } from '@/lib/prisma';
import { TICKET_STATUSES } from '@/lib/constants/status';

export interface SidebarCounts {
  issues?: number;
  health?: number;
  knowledge?: number;
  wiki?: number;
}

export async function getSidebarCounts(projectId: number): Promise<SidebarCounts> {
  const [issuesCount, healthCount, knowledgeCount, wikiCount] = await Promise.all([
    // Sprint 10: Use ticket model - count non-completed issues/bugs
    // Bug fix: 'open' doesn't exist in 5-status system. Use proper Kanban statuses.
    prisma.ticket.count({
      where: {
        projectId,
        kind: { in: ['issue', 'bug', 'scanner_finding'] },
        status: {
          in: [
            TICKET_STATUSES.BACKLOG,
            TICKET_STATUSES.TODO,
            TICKET_STATUSES.IN_PROGRESS,
            TICKET_STATUSES.IN_REVIEW,
          ],
        },
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
