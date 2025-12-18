/**
 * Ticket API Utilities (Sprint 10)
 *
 * Helper functions for ticket API routes
 */

import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/lib/types/api';
import type { TicketFilters, TicketKind } from '@/lib/validations/ticket';

export function success<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    {
      data,
      error: null,
    },
    { status }
  );
}

export function failure<T = null>({
  code,
  message,
  status = 400,
  details,
}: {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}) {
  return NextResponse.json<ApiResponse<T>>(
    {
      data: null,
      error: { code, message, details },
    },
    { status }
  );
}

export async function resolveProjectId(projectId?: number) {
  if (projectId) {
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!projectExists) {
      throw new Error(`Project ${projectId} not found`);
    }
    return projectExists.id;
  }

  const defaultProject = await prisma.project.findFirst({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!defaultProject) {
    throw new Error('No projects available. Seed the database first.');
  }

  return defaultProject.id;
}

export function buildTicketWhere(filters: TicketFilters, projectId: number): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {
    projectId,
  };

  // Sprint 10: Kind filter
  if (filters.kind?.length) {
    where.kind = { in: filters.kind };
  }

  if (filters.status?.length) {
    where.status = { in: filters.status };
  }

  if (filters.priority?.length) {
    where.priority = { in: filters.priority };
  }

  if (filters.module?.length) {
    where.module = { in: filters.module };
  }

  if (filters.assignee?.length) {
    where.assignee = { in: filters.assignee };
  }

  // Sprint 10: Additional filters
  if (filters.assigneeType) {
    where.assigneeType = filters.assigneeType;
  }

  // Sprint 12: Scheduling filters (replaces linkedTaskId)
  if (filters.scheduledWeekId) {
    where.scheduledWeekId = filters.scheduledWeekId;
  }

  if (filters.hasSchedule === true) {
    where.scheduledWeekId = { not: null };
  } else if (filters.hasSchedule === false) {
    where.scheduledWeekId = null;
  }

  if (filters.source?.length) {
    where.source = { in: filters.source };
  }

  // Sprint 11.7: Label filtering by ID (preferred)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((filters as any).labelIds?.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const labelIds = (filters as any).labelIds.map((id: string | number) => Number(id));
    where.labels = {
      some: {
        id: { in: labelIds },
      },
    };
  } else if (filters.tags?.length) {
    // Backwards compatibility: filter by label name
    where.labels = {
      some: {
        name: { in: filters.tags },
      },
    };
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {
      ...(filters.createdFrom ? { gte: new Date(filters.createdFrom) } : {}),
      ...(filters.createdTo ? { lte: new Date(filters.createdTo) } : {}),
    };
  }

  // Sprint 11.7: Milestone and Due Date filters
  if (filters.milestoneId) {
    where.milestoneId = filters.milestoneId;
  }

  if (filters.dueDateFrom || filters.dueDateTo) {
    where.dueDate = {
      ...(filters.dueDateFrom ? { gte: new Date(filters.dueDateFrom) } : {}),
      ...(filters.dueDateTo ? { lte: new Date(filters.dueDateTo) } : {}),
    };
  }

  // Filter for overdue tickets (dueDate is set and < now, and status is not closed)
  if (filters.overdue === true) {
    where.dueDate = { lt: new Date() };
    where.status = { not: 'closed' };
  }

  // Sprint 13: Hierarchy filters
  if (filters.parentTicketId !== undefined) {
    where.parentTicketId = filters.parentTicketId;
  }

  // Filter for tickets with/without children
  if (filters.hasChildren === true) {
    where.childTickets = { some: {} };
  } else if (filters.hasChildren === false) {
    where.childTickets = { none: {} };
  }

  // Filter for top-level tickets (no parent)
  if (filters.isTopLevel === true) {
    where.parentTicketId = null;
  }

  // Sprint 13: Traceability filters
  if (filters.epicRef) {
    where.epicRef = filters.epicRef;
  }

  if (filters.sprintNumber !== undefined) {
    where.sprintNumber = filters.sprintNumber;
  }

  return where;
}

export function buildTicketOrderBy(filters: TicketFilters): Prisma.TicketOrderByWithRelationInput {
  const direction = filters.sortDirection ?? 'desc';
  switch (filters.sortBy) {
    case 'updatedAt':
      return { updatedAt: direction };
    case 'priority':
      return { priority: direction };
    case 'kind':
      return { kind: direction };
    case 'dueDate':
      // Sprint 11.7: Sort by due date (nulls last for asc, nulls first for desc)
      return { dueDate: { sort: direction, nulls: direction === 'asc' ? 'last' : 'first' } };
    case 'sprintNumber':
      // Sprint 13: Sort by sprint number (nulls last for asc, nulls first for desc)
      return { sprintNumber: { sort: direction, nulls: direction === 'asc' ? 'last' : 'first' } };
    case 'createdAt':
    default:
      return { createdAt: direction };
  }
}

export function ticketIncludeConfig(includeRelations?: boolean): Prisma.TicketInclude {
  if (includeRelations) {
    return {
      labels: {
        select: { id: true, name: true, color: true },
      },
      linkedFiles: {
        select: { id: true, filePath: true, lineNumber: true },
      },
      comments: {
        select: { id: true, author: true, createdAt: true, content: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      attachments: {
        select: { id: true, filename: true, filepath: true },
      },
      // Sprint 12: Include scheduled week (replaces linkedTask)
      scheduledWeek: {
        select: {
          id: true,
          title: true,
          sprint: {
            select: { id: true, title: true },
          },
        },
      },
      // Sprint 11.7: Include milestone
      milestone: {
        select: { id: true, name: true, targetDate: true, status: true },
      },
      // Sprint 13: Include hierarchy (parent + children summary)
      parentTicket: {
        select: { id: true, title: true, kind: true, status: true },
      },
      childTickets: {
        select: { id: true, title: true, kind: true, status: true },
        orderBy: { createdAt: 'asc' },
        take: 20, // Limit to prevent response bloat
      },
    };
  }

  return {
    labels: {
      select: { id: true, name: true, color: true },
    },
    linkedFiles: {
      select: { id: true, filePath: true, lineNumber: true },
    },
    comments: {
      select: { id: true },
    },
    attachments: {
      select: { id: true },
    },
    // Sprint 12: Include scheduled week (basic info)
    scheduledWeek: {
      select: { id: true, title: true },
    },
    // Sprint 11.7: Include milestone (basic info)
    milestone: {
      select: { id: true, name: true },
    },
    // Sprint 13: Include hierarchy (basic - just counts for list view)
    parentTicket: {
      select: { id: true, title: true },
    },
    _count: {
      select: { childTickets: true },
    },
  };
}
