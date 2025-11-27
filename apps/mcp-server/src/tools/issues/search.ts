/**
 * Issue Search Adapter - Backwards Compatibility
 *
 * Maps legacy issue_search to ticket_search with kind filter:
 * - Auto-filters to kind: ['issue', 'bug', 'scanner_finding']
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import { ApiResponse, TicketListResponse, buildErrorPayload } from '../tickets/common.js';

const issueSearchSchema = z.object({
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
  projectId: z.number().int().positive().optional(),
});

type IssueSearchInput = z.infer<typeof issueSearchSchema>;

const appendArray = (params: URLSearchParams, key: string, values?: string[]) => {
  if (!values?.length) return;
  params.set(key, values.join(','));
};

async function handler(input: IssueSearchInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const params = new URLSearchParams();

  // Force filter to legacy issue types
  params.set('kind', 'issue,bug,scanner_finding');

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

  const path = `/api/tickets?${params.toString()}`;

  try {
    const response = await httpClient.get<ApiResponse<TicketListResponse>>(path);
    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Issue search failed',
        response.error?.code
      );
    }

    logger.info('[issue.search] Issues fetched (via ticket adapter)', {
      totalCount: response.data.totalCount,
      page: response.data.page,
    });

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
    logger.error('[issue.search] Unexpected error', { error });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const issueSearchTool: ToolDefinition = {
  name: 'projectpulse_issue_search',
  description:
    '[LEGACY] Search issues. Maps to ticket_search with kind=[issue,bug,scanner_finding]. Use projectpulse_ticket_search for new integrations.',
  schema: issueSearchSchema,
  inputSchema: {
    type: 'object',
    properties: {
      status: { type: 'array', items: { type: 'string' } },
      priority: { type: 'array', items: { type: 'string' } },
      module: { type: 'array', items: { type: 'string' } },
      assignee: { type: 'array', items: { type: 'string' } },
      tags: { type: 'array', items: { type: 'string' } },
      search: { type: 'string' },
      createdFrom: { type: 'string', description: 'ISO timestamp' },
      createdTo: { type: 'string', description: 'ISO timestamp' },
      includeRelations: { type: 'boolean' },
      sortBy: { type: 'string', enum: ['createdAt', 'updatedAt', 'priority'] },
      sortDirection: { type: 'string', enum: ['asc', 'desc'] },
      page: { type: 'number', minimum: 1 },
      pageSize: { type: 'number', minimum: 1, maximum: 100 },
      projectId: { type: 'number' },
    },
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = issueSearchSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
