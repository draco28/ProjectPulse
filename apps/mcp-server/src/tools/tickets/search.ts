import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  TicketListResponse,
  ticketKindSchema,
  ticketSourceSchema,
  buildErrorPayload,
  buildSuccessPayload,
} from './common.js';

const ticketSearchSchema = z.object({
  kind: z.array(ticketKindSchema).optional(),
  source: z.array(ticketSourceSchema).optional(),
  status: z.array(z.string()).optional(),
  priority: z.array(z.string()).optional(),
  module: z.array(z.string()).optional(),
  assignee: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().max(200).optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  // Sprint 13: Hierarchy filters
  parentTicketId: z.number().int().positive().optional(),
  hasChildren: z.boolean().optional(),
  isTopLevel: z.boolean().optional(),
  // Sprint 13: Traceability filters
  epicRef: z.string().max(200).optional(),
  sprintNumber: z.number().int().min(1).max(999).optional(),
  // Sprint 16: Milestone & due date filters
  milestoneId: z.number().int().positive().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  overdue: z.boolean().optional(),
  // Sprint 16: Label ID filter (more efficient than tags)
  labelIds: z.array(z.number().int().positive()).optional(),
  includeRelations: z.boolean().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'sprintNumber', 'kind', 'dueDate']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

type TicketSearchInput = z.infer<typeof ticketSearchSchema>;

const appendArray = (params: URLSearchParams, key: string, values?: string[]) => {
  if (!values?.length) return;
  params.set(key, values.join(','));
};

async function handler(input: TicketSearchInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const params = new URLSearchParams();

  appendArray(params, 'kind', input.kind);
  appendArray(params, 'source', input.source);
  appendArray(params, 'status', input.status);
  appendArray(params, 'priority', input.priority);
  appendArray(params, 'module', input.module);
  appendArray(params, 'assignee', input.assignee);
  appendArray(params, 'tags', input.tags);

  if (input.search) params.set('search', input.search);
  if (input.createdFrom) params.set('createdFrom', input.createdFrom);
  if (input.createdTo) params.set('createdTo', input.createdTo);
  // Sprint 13: Hierarchy filters
  if (input.parentTicketId) params.set('parentTicketId', String(input.parentTicketId));
  if (input.hasChildren !== undefined) params.set('hasChildren', String(input.hasChildren));
  if (input.isTopLevel !== undefined) params.set('isTopLevel', String(input.isTopLevel));
  // Sprint 13: Traceability filters
  if (input.epicRef) params.set('epicRef', input.epicRef);
  if (input.sprintNumber) params.set('sprintNumber', String(input.sprintNumber));
  // Sprint 16: Milestone & due date filters
  if (input.milestoneId) params.set('milestoneId', String(input.milestoneId));
  if (input.dueDateFrom) params.set('dueDateFrom', input.dueDateFrom);
  if (input.dueDateTo) params.set('dueDateTo', input.dueDateTo);
  if (input.overdue !== undefined) params.set('overdue', String(input.overdue));
  // Sprint 16: Label ID filter
  if (input.labelIds?.length) params.set('labelIds', input.labelIds.join(','));
  if (input.includeRelations !== undefined)
    params.set('includeRelations', String(input.includeRelations));
  if (input.sortBy) params.set('sortBy', input.sortBy);
  if (input.sortDirection) params.set('sortDirection', input.sortDirection);
  if (input.page) params.set('page', String(input.page));
  if (input.pageSize) params.set('pageSize', String(input.pageSize));

  const path = params.toString() ? `/api/tickets?${params.toString()}` : '/api/tickets';

  try {
    const response = await httpClient.get<ApiResponse<TicketListResponse>>(path);
    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Ticket search failed',
        response.error?.code
      );
    }

    logger.info('[ticket.search] Tickets fetched', {
      totalCount: response.data.totalCount,
      page: response.data.page,
      filters: { kind: input.kind, source: input.source },
    });

    // Return flat structure (tests expect tickets array and pagination at root level)
    return JSON.stringify({
      tickets: response.data.tickets.map((ticket) => ({
        id: ticket.id,
        // Sprint 14: Hierarchical display ID (e.g., "30.1" for child of #30)
        displayId: ticket.displayId ?? `${ticket.id}`,
        title: ticket.title,
        kind: ticket.kind,
        source: ticket.source,
        status: ticket.status,
        priority: ticket.priority,
        module: ticket.module ?? null,
        assignee: ticket.assignee ?? null,
        labels: ticket.labels.map((label) => label.name),
        closedAt: ticket.closedAt ?? null,
        updatedAt: ticket.updatedAt,
        // Sprint 13: Hierarchy fields
        parentTicketId: ticket.parentTicketId ?? null,
        parentTicket: ticket.parentTicket ?? null,
        childrenCount: ticket._count?.childTickets ?? 0,
        // Sprint 13: Traceability fields
        epicRef: ticket.epicRef ?? null,
        sprintNumber: ticket.sprintNumber ?? null,
      })),
      total: response.data.totalCount,
      page: response.data.page,
      pageSize: response.data.pageSize,
      totalPages: response.data.totalPages,
    }, null, 2);
  } catch (error) {
    logger.error('[ticket.search] Unexpected error', { error });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const ticketSearchTool: ToolDefinition = {
  name: 'projectpulse_ticket_search',
  description: `[QUERY] Search tickets with advanced filters.

When to Use:
- Finding related tickets before creating new ones
- Checking status of work items
- Discovering open issues in a module
- Filtering by kind (feature, task, bug, etc.)
- Finding feature tickets for a specific sprint (sprintNumber filter)
- Finding children of a feature (parentTicketId filter)
- Finding tickets due soon or overdue (dueDateFrom/To, overdue filters)
- Finding tickets by milestone (milestoneId filter)

HIERARCHY FILTERS (Sprint 13):
- parentTicketId: Find children of a specific feature ticket
- hasChildren: true/false to find feature vs task tickets
- isTopLevel: true to find tickets with no parent
- sprintNumber: Find tickets assigned to a specific sprint
- epicRef: Find tickets referencing a specific epic

MILESTONE & DUE DATE FILTERS (Sprint 16):
- milestoneId: Filter by milestone ID
- dueDateFrom: Tickets due on or after this date (ISO 8601)
- dueDateTo: Tickets due on or before this date (ISO 8601)
- overdue: true = only overdue tickets (dueDate < now, status != done)

LABEL FILTERS (Sprint 16):
- labelIds: Filter by label IDs (more efficient than tags array)

SORT OPTIONS:
- sortBy: createdAt, updatedAt, priority, sprintNumber, kind, dueDate
- sortDirection: asc, desc

Returns: Paginated ticket summaries with hierarchy info

AGENT WORKFLOW:
1. Search for feature tickets by sprintNumber to find your sprint work
2. Use parentTicketId to find existing tasks under a feature
3. Create new tasks with the same parentTicketId
4. Find overdue tickets: overdue=true
5. Find tickets due this week: dueDateTo with end-of-week date

Related:
→ projectpulse_ticket_create - Create if no matching ticket found
→ projectpulse_ticket_getChildren - Get paginated children of a feature
→ projectpulse_ticket_getHierarchy - Get full hierarchy context`,
  schema: ticketSearchSchema,
  inputSchema: {
    type: 'object',
    properties: {
      kind: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['feature', 'task', 'epic', 'issue', 'bug', 'scanner_finding', 'tech_debt'],
        },
        description: 'Filter by ticket kinds',
      },
      source: {
        type: 'array',
        items: { type: 'string', enum: ['manual', 'scanner', 'agent', 'onboarding'] },
        description: 'Filter by ticket sources',
      },
      status: { type: 'array', items: { type: 'string' } },
      priority: { type: 'array', items: { type: 'string' } },
      module: { type: 'array', items: { type: 'string' } },
      assignee: { type: 'array', items: { type: 'string' } },
      tags: { type: 'array', items: { type: 'string' } },
      search: { type: 'string' },
      createdFrom: { type: 'string', description: 'ISO timestamp (inclusive)' },
      createdTo: { type: 'string', description: 'ISO timestamp (inclusive)' },
      // Sprint 13: Hierarchy filters
      parentTicketId: {
        type: 'number',
        description: 'Filter for children of a specific feature ticket',
      },
      hasChildren: {
        type: 'boolean',
        description: 'Filter for tickets with children (true) or without (false)',
      },
      isTopLevel: {
        type: 'boolean',
        description: 'Filter for tickets with no parent (true)',
      },
      // Sprint 13: Traceability filters
      epicRef: {
        type: 'string',
        description: 'Filter by epic reference (soft reference)',
      },
      sprintNumber: {
        type: 'number',
        description: 'Filter by sprint number (1, 2, 3, ...)',
      },
      // Sprint 16: Milestone & due date filters
      milestoneId: {
        type: 'number',
        description: 'Filter by milestone ID',
      },
      dueDateFrom: {
        type: 'string',
        description: 'Filter tickets due on or after this date (ISO 8601)',
      },
      dueDateTo: {
        type: 'string',
        description: 'Filter tickets due on or before this date (ISO 8601)',
      },
      overdue: {
        type: 'boolean',
        description: 'true = only overdue tickets (dueDate < now and status != done)',
      },
      // Sprint 16: Label ID filter
      labelIds: {
        type: 'array',
        items: { type: 'number' },
        description: 'Filter by label IDs (more efficient than tags)',
      },
      includeRelations: { type: 'boolean' },
      sortBy: { type: 'string', enum: ['createdAt', 'updatedAt', 'priority', 'sprintNumber', 'kind', 'dueDate'] },
      sortDirection: { type: 'string', enum: ['asc', 'desc'] },
      page: { type: 'number', minimum: 1 },
      pageSize: { type: 'number', minimum: 1, maximum: 100 },
    },
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = ticketSearchSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
