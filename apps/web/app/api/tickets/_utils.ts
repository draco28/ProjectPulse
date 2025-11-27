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

  if (filters.linkedTaskId) {
    where.linkedTaskId = filters.linkedTaskId;
  }

  if (filters.source?.length) {
    where.source = { in: filters.source };
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

export function buildTicketOrderBy(filters: TicketFilters): Prisma.TicketOrderByWithRelationInput {
  const direction = filters.sortDirection ?? 'desc';
  switch (filters.sortBy) {
    case 'updatedAt':
      return { updatedAt: direction };
    case 'priority':
      return { priority: direction };
    case 'kind':
      return { kind: direction };
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
      linkedTask: {
        select: { id: true, title: true, status: true },
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
  };
}
