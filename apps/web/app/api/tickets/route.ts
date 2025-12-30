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
import {
  failure,
  success,
  resolveProjectId,
  buildTicketWhere,
  buildTicketOrderBy,
  ticketIncludeConfig,
  addDisplayIdToTickets,
} from './_utils';
import {
  resolveModuleValue,
  resolvePriorityValue,
  resolveStatusValue,
  OptionValidationError,
} from '@/lib/issues/options';
import { deriveAutoTags } from '@/lib/issues/tagging';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';
import { validateAndSetParent, TicketHierarchyError } from '@/lib/tickets/hierarchy';
import { resolveSprintByNumber } from '@/lib/sprints/resolution';
import type { TicketFilters } from '@/lib/validations/ticket';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

function parseArrayParam(searchParams: URLSearchParams, key: string) {
  const direct = searchParams.getAll(key);
  if (direct.length > 0) {
    return direct
      .flatMap((value) => value.split(','))
      .map((value) => value.trim())
      .filter(Boolean);
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
      // Sprint 15: scheduledWeekId filter removed (Week model deleted - Ticket #80)
      // Tickets now filter by sprintNumber for sprint-based work
      createdFrom: url.searchParams.get('createdFrom') ?? undefined,
      createdTo: url.searchParams.get('createdTo') ?? undefined,
      // Sprint 13: Hierarchy filters
      parentTicketId: url.searchParams.get('parentTicketId')
        ? Number(url.searchParams.get('parentTicketId'))
        : undefined,
      hasChildren:
        url.searchParams.get('hasChildren') === 'true'
          ? true
          : url.searchParams.get('hasChildren') === 'false'
            ? false
            : undefined,
      isTopLevel: url.searchParams.get('isTopLevel') === 'true' ? true : undefined,
      // Sprint 13: Traceability filters
      epicRef: url.searchParams.get('epicRef') ?? undefined,
      sprintNumber: url.searchParams.get('sprintNumber')
        ? Number(url.searchParams.get('sprintNumber'))
        : undefined,
      includeRelations: url.searchParams.get('includeRelations') === 'true',
      sortBy: (url.searchParams.get('sortBy') as TicketFilters['sortBy']) ?? undefined,
      sortDirection:
        (url.searchParams.get('sortDirection') as TicketFilters['sortDirection']) ?? undefined,
      page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
      pageSize: url.searchParams.get('pageSize')
        ? Number(url.searchParams.get('pageSize'))
        : undefined,
    };

    const filters = TicketFilterSchema.parse(rawFilters);

    // Sprint 10: Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, filters.projectId);
    const where = buildTicketWhere(filters, projectId);
    const orderBy = buildTicketOrderBy(filters);
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;

    const [rawTickets, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy,
        take: pageSize,
        skip: (page - 1) * pageSize,
        include: ticketIncludeConfig(filters.includeRelations),
      }),
      prisma.ticket.count({ where }),
    ]);

    // Sprint 14: Add displayId to tickets (hierarchical display IDs for children)
    const tickets = addDisplayIdToTickets(rawTickets);

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
      // Sprint 11.7: Filter labels by projectId (labels are now project-scoped)
      const existing = await prisma.label.findMany({
        where: { projectId, name: { in: autoTags.labels } },
        select: { id: true, name: true },
      });

      const missing = autoTags.labels.filter(
        (name) => !existing.some((label) => label.name === name)
      );

      if (missing.length) {
        // Sprint 11.7: Create labels with projectId
        const created = await prisma.$transaction((tx) =>
          Promise.all(
            missing.map((name) =>
              tx.label.create({
                data: { name, color: '#94a3b8', projectId },
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

    // Sprint 11.7: Merge implementation context into customFields with reserved key
    const customFieldsPayload = {
      ...(data.customFields ?? {}),
      ...(data.context?.metadata ?? {}),
      ...(snippets.length ? { contextSnippets: snippets } : {}),
      ...(data.implementationContext ? { _implementationContext: data.implementationContext } : {}),
    };
    const customFields =
      Object.keys(customFieldsPayload).length > 0 ? customFieldsPayload : undefined;

    // Sprint 12: linkedTaskId removed - tickets now schedule to weeks directly via scheduledWeekId

    // Sprint 13: Validate parent ticket if provided
    if (data.parentTicketId) {
      await validateAndSetParent(
        prisma,
        null, // null ticketId for new ticket (no circular reference possible)
        data.parentTicketId,
        projectId,
        data.kind ?? 'issue'
      );
    }

    // Sprint 15: Resolve sprintId from sprintNumber (via roadmap hierarchy)
    // Ticket #91: Use helper with deterministic ordering (global numbering)
    const resolvedSprintId =
      data.sprintNumber && !data.sprintId
        ? await resolveSprintByNumber(prisma, projectId, data.sprintNumber)
        : null;

    // Sprint 15: Auto-assign displayOrder (max + 1 in same status column within sprint)
    let autoDisplayOrder = 0;
    const targetSprintId = data.sprintId ?? resolvedSprintId;
    if (targetSprintId) {
      const maxOrderResult = await prisma.ticket.aggregate({
        where: {
          sprintId: targetSprintId,
          status: status,
        },
        _max: { displayOrder: true },
      });
      autoDisplayOrder = (maxOrderResult._max.displayOrder ?? -1) + 1;
    }

    // Sprint 15: Auto-populate backlogRefs from BacklogItem table when sprintNumber provided
    let backlogRefsToUse = data.backlogRefs ?? [];
    let backlogRefsAutoPopulated = false;

    if (data.sprintNumber && backlogRefsToUse.length === 0) {
      const backlogItems = await prisma.backlogItem.findMany({
        where: { projectId, sprintNumber: data.sprintNumber },
        select: { itemId: true },
      });

      if (backlogItems.length > 0) {
        backlogRefsToUse = backlogItems.map((item) => item.itemId);
        backlogRefsAutoPopulated = true;
      }
    }

    const ticket = await prisma.$transaction(async (tx) => {
      // Sprint 17: Generate project-scoped ticket number
      // Each project has independent sequence: 1, 2, 3...
      const maxResult = await tx.ticket.aggregate({
        where: { projectId },
        _max: { ticketNumber: true },
      });
      const nextTicketNumber = (maxResult._max.ticketNumber ?? 0) + 1;

      const created = await tx.ticket.create({
        data: {
          projectId,
          ticketNumber: nextTicketNumber,
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
          // Sprint 15: scheduledWeekId/scheduledDays removed (Week model deleted - Ticket #80)
          // Tickets now link to Sprint via sprintId FK for Kanban board
          estimatedDays: data.estimatedDays ?? null,
          customFields,
          // Sprint 13: Hierarchy fields
          parentTicketId: data.parentTicketId ?? null,
          // Sprint 13: Traceability fields
          epicRef: data.epicRef ?? null,
          // Sprint 15: Use auto-populated backlogRefs if available
          backlogRefs: backlogRefsToUse,
          sprintNumber: data.sprintNumber ?? null,
          // Sprint 15: FK to Sprint for kanban board (resolved from sprintNumber)
          sprintId: data.sprintId ?? resolvedSprintId,
          // Sprint 15: Auto-assigned displayOrder for kanban column positioning
          displayOrder: autoDisplayOrder,
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

    // Sprint 15: Include auto-population hint in response for MCP tool awareness
    const response = {
      ...ticket,
      _suggestions: backlogRefsAutoPopulated
        ? {
            backlogRefsAutoPopulated: true,
            message: `Auto-populated ${backlogRefsToUse.length} backlogRefs from Sprint ${data.sprintNumber} scope`,
          }
        : undefined,
    };

    return success(response, 201);
  } catch (error) {
    // Sprint 10: Handle auth errors first
    if (error instanceof AuthError) {
      return failure({ code: error.code, message: error.message, status: error.status });
    }

    // Sprint 13: Handle hierarchy validation errors
    if (error instanceof TicketHierarchyError) {
      return failure({
        code: error.code,
        message: error.message,
        status: 400,
      });
    }

    // Sprint 14: Handle option validation errors (invalid status/priority/module)
    if (error instanceof OptionValidationError) {
      return failure({
        code: error.code,
        message: error.message,
        details: {
          field: error.field,
          invalidValue: error.invalidValue,
          validValues: error.validValues,
        },
        status: 400,
      });
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
