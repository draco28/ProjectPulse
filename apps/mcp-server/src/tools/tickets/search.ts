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
  includeRelations: z.boolean().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority']).optional(),
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

Filters: kind, source, status, priority, module, tags, assignee, search text

Returns: Paginated ticket summaries (not full descriptions)

RECOMMENDED: Search existing tickets before creating new ones to avoid duplicates.

Related:
→ projectpulse_ticket_create - Create if no matching ticket found
→ projectpulse_agent_session_start - Track work on found tickets`,
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
      includeRelations: { type: 'boolean' },
      sortBy: { type: 'string', enum: ['createdAt', 'updatedAt', 'priority'] },
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
