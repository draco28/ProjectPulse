import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/lib/types/api';
import type { IssueFilters } from '@/lib/validations/issue';

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

// Sprint 10: Use Ticket model (Issue is now Ticket with kind filter)
export function buildIssueWhere(filters: IssueFilters, projectId: number): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {
    projectId,
    kind: { in: ['issue', 'bug', 'scanner_finding'] }, // Backwards compatibility
  };

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

  if (filters.tags?.length) {
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

  return where;
}

// Sprint 10: Use Ticket model
export function buildIssueOrderBy(filters: IssueFilters): Prisma.TicketOrderByWithRelationInput {
  const direction = filters.sortDirection ?? 'desc';
  switch (filters.sortBy) {
    case 'updatedAt':
      return { updatedAt: direction };
    case 'priority':
      return { priority: direction };
    case 'createdAt':
    default:
      return { createdAt: direction };
  }
}
