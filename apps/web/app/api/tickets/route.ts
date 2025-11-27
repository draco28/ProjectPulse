/**
 * Tickets API Route (Sprint 10)
 *
 * GET /api/tickets - List tickets with filters
 * POST /api/tickets - Create a new ticket
 *
 * Tickets are the unified WorkItem model - Issues are a subtype (kind='issue')
 *
 * Security (Sprint 10):
 * - All requests MUST be authenticated (user session OR agent token)
 * - Agent tokens enforce project isolation (cannot access other projects)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { CreateTicketSchema, TicketFilterSchema, TicketKind } from '@/lib/validations/ticket';
import { failure, success, resolveProjectId, buildTicketWhere, buildTicketOrderBy, ticketIncludeConfig } from './_utils';
import { resolveModuleValue, resolvePriorityValue, resolveStatusValue } from '@/lib/issues/options';
import { deriveAutoTags } from '@/lib/issues/tagging';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';
import type { TicketFilters } from '@/lib/validations/ticket';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

function parseArrayParam(searchParams: URLSearchParams, key: string) {
  const direct = searchParams.getAll(key);
  if (direct.length > 0) {
    return direct.flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean);
  }
  const single = searchParams.get(key);
  if (single) {
    return single
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rawFilters: Partial<TicketFilters> = {
      projectId: url.searchParams.get('projectId')
        ? Number(url.searchParams.get('projectId'))
        : undefined,
      kind: parseArrayParam(url.searchParams, 'kind') as TicketKind[] | undefined,
      status: parseArrayParam(url.searchParams, 'status'),
      priority: parseArrayParam(url.searchParams, 'priority'),
      module: parseArrayParam(url.searchParams, 'module'),
      assignee: parseArrayParam(url.searchParams, 'assignee'),
      tags: parseArrayParam(url.searchParams, 'tags'),
      search: url.searchParams.get('search') ?? undefined,
      linkedTaskId: url.searchParams.get('linkedTaskId') ?? undefined,
      createdFrom: url.searchParams.get('createdFrom') ?? undefined,
      createdTo: url.searchParams.get('createdTo') ?? undefined,
      includeRelations: url.searchParams.get('includeRelations') === 'true',
      sortBy: (url.searchParams.get('sortBy') as TicketFilters['sortBy']) ?? undefined,
      sortDirection: (url.searchParams.get('sortDirection') as TicketFilters['sortDirection']) ?? undefined,
      page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
      pageSize: url.searchParams.get('pageSize') ? Number(url.searchParams.get('pageSize')) : undefined,
    };

    const filters = TicketFilterSchema.parse(rawFilters);
    
    // Sprint 10: Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, filters.projectId);
    const where = buildTicketWhere(filters, projectId);
    const orderBy = buildTicketOrderBy(filters);
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;

    const [tickets, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy,
        take: pageSize,
        skip: (page - 1) * pageSize,
        include: ticketIncludeConfig(filters.includeRelations),
      }),
      prisma.ticket.count({ where }),
    ]);

    return success({
      tickets,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      filters: { ...filters, projectId },
    });
  } catch (error) {
    // Sprint 10: Handle auth errors first
    if (error instanceof AuthError) {
      return failure({ code: error.code, message: error.message, status: error.status });
    }
    
    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid filter parameters',
        details: error.flatten(),
      });
    }

    console.error('[API] GET /api/tickets failed', error);
    return failure({ code: 'INTERNAL_ERROR', message: 'Failed to fetch tickets', status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const data = CreateTicketSchema.parse(payload);
    
    // Sprint 10: Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, data.projectId);

    const autoTags = await deriveAutoTags(data.context?.files);
    const status = await resolveStatusValue(data.status);
    const priority = await resolvePriorityValue(data.priority ?? autoTags.priority);
    const ticketModule = await resolveModuleValue(data.module ?? autoTags.module);

    const labelIdSet = new Set<number>(data.labelIds ?? []);
    if (labelIdSet.size) {
      const existingById = await prisma.label.findMany({
        where: { id: { in: Array.from(labelIdSet) } },
        select: { id: true },
      });
      if (existingById.length !== labelIdSet.size) {
        return failure({
          code: 'INVALID_LABEL',
          message: 'One or more labels do not exist',
          status: 400,
        });
      }
    }

    if (autoTags.labels?.length) {
      const existing = await prisma.label.findMany({
        where: { name: { in: autoTags.labels } },
        select: { id: true, name: true },
      });

      const missing = autoTags.labels.filter(
        (name) => !existing.some((label) => label.name === name)
      );

      if (missing.length) {
        const created = await prisma.$transaction((tx) =>
          Promise.all(
            missing.map((name) =>
              tx.label.create({
                data: { name, color: '#94a3b8' },
                select: { id: true, name: true },
              })
            )
          )
        );
        created.forEach((label) => labelIdSet.add(label.id));
      }

      existing.forEach((label) => labelIdSet.add(label.id));
    }

    const files = data.context?.files ?? [];
    const snippets =
      files
        .filter((file) => file.snippet)
        .map((file) => ({
          filePath: file.filePath,
          lineNumber: file.lineNumber ?? null,
          snippet: file.snippet,
        })) ?? [];

    const customFieldsPayload = {
      ...(data.customFields ?? {}),
      ...(data.context?.metadata ?? {}),
      ...(snippets.length ? { contextSnippets: snippets } : {}),
    };
    const customFields =
      Object.keys(customFieldsPayload).length > 0 ? customFieldsPayload : undefined;

    // Validate linkedTaskId if provided
    if (data.linkedTaskId) {
      const task = await prisma.task.findUnique({
        where: { id: data.linkedTaskId },
        select: { id: true },
      });
      if (!task) {
        return failure({
          code: 'INVALID_LINKED_TASK',
          message: `Task ${data.linkedTaskId} not found`,
          status: 400,
        });
      }
    }

    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          projectId,
          title: data.title,
          description: data.description,
          status,
          priority,
          module: ticketModule,
          assignee: data.assignee,
          kind: data.kind ?? 'issue',
          source: data.source ?? 'manual',
          assigneeType: data.assigneeType,
          assigneeId: data.assigneeId,
          linkedTaskId: data.linkedTaskId,
          customFields,
          labels:
            labelIdSet.size > 0
              ? {
                  connect: Array.from(labelIdSet).map((id) => ({ id })),
                }
              : undefined,
        },
        select: { id: true },
      });

      if (files.length) {
        await tx.ticketLinkedFile.createMany({
          data: files.map((file) => ({
            ticketId: created.id,
            filePath: file.filePath,
            lineNumber: file.lineNumber ?? null,
          })),
        });
      }

      return tx.ticket.findUniqueOrThrow({
        where: { id: created.id },
        include: ticketIncludeConfig(true),
      });
    });

    revalidatePath('/tickets');
    revalidatePath(`/tickets/${ticket.id}`);
    // Also revalidate issues paths for backwards compatibility
    revalidatePath('/issues');
    revalidatePath(`/issues/${ticket.id}`);

    return success(ticket, 201);
  } catch (error) {
    // Sprint 10: Handle auth errors first
    if (error instanceof AuthError) {
      return failure({ code: error.code, message: error.message, status: error.status });
    }
    
    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid ticket payload',
        details: error.flatten(),
      });
    }

    console.error('[API] POST /api/tickets failed', error);
    return failure({ code: 'INTERNAL_ERROR', message: 'Failed to create ticket', status: 500 });
  }
}
