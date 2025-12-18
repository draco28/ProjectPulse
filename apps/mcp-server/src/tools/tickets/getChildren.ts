/**
 * MCP Tool: Ticket Get Children (Sprint 13)
 *
 * Get paginated children of a feature ticket
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  buildErrorPayload,
  ticketIdSchema,
} from './common.js';

interface TicketChildSummary {
  id: number;
  title: string;
  kind: string;
  status: string;
  priority: string;
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
  labels: Array<{ id: number; name: string; color: string }>;
}

interface ChildrenResponse {
  parent: {
    id: number;
    title: string;
    kind: string;
  };
  children: TicketChildSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts: Record<string, number>;
}

const getChildrenSchema = z.object({
  ticketId: ticketIdSchema,
  status: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

type GetChildrenInput = z.infer<typeof getChildrenSchema>;

async function handler(input: GetChildrenInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;

  const params = new URLSearchParams();
  if (input.status) params.set('status', input.status);
  if (input.page) params.set('page', String(input.page));
  if (input.pageSize) params.set('pageSize', String(input.pageSize));

  const path = params.toString()
    ? `/api/tickets/${input.ticketId}/children?${params.toString()}`
    : `/api/tickets/${input.ticketId}/children`;

  try {
    const response = await httpClient.get<ApiResponse<ChildrenResponse>>(path);

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to get children',
        response.error?.code
      );
    }

    logger.info('[ticket.getChildren] Children fetched', {
      parentId: input.ticketId,
      childrenCount: response.data.totalCount,
    });

    return JSON.stringify({
      parent: response.data.parent,
      children: response.data.children.map((child) => ({
        id: child.id,
        title: child.title,
        kind: child.kind,
        status: child.status,
        priority: child.priority,
        assignee: child.assignee,
        labels: child.labels?.map((l) => l.name) ?? [],
        createdAt: child.createdAt,
        updatedAt: child.updatedAt,
      })),
      total: response.data.totalCount,
      page: response.data.page,
      pageSize: response.data.pageSize,
      totalPages: response.data.totalPages,
      statusCounts: response.data.statusCounts,
    }, null, 2);
  } catch (error) {
    logger.error('[ticket.getChildren] Unexpected error', { error, ticketId: input.ticketId });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const ticketGetChildrenTool: ToolDefinition = {
  name: 'projectpulse_ticket_getChildren',
  description: `[QUERY] Get paginated children of a feature ticket.

Use this to retrieve all task/issue/bug/tech_debt tickets under a feature.

Returns:
- Parent ticket summary
- Paginated list of children
- Status counts for progress tracking (e.g., { open: 3, in_progress: 2, done: 5 })

AGENT WORKFLOW:
1. Search for feature tickets by sprintNumber
2. Use this tool to see tasks under each feature
3. Pick unclaimed tasks or create new ones

Related:
→ projectpulse_ticket_search - Find feature tickets first
→ projectpulse_ticket_create - Create new child tasks
→ projectpulse_ticket_getHierarchy - Get full hierarchy including siblings`,
  schema: getChildrenSchema,
  inputSchema: {
    type: 'object',
    properties: {
      ticketId: {
        type: 'number',
        description: 'ID of the parent feature ticket',
      },
      status: {
        type: 'string',
        description: 'Filter children by status (e.g., "open", "in_progress")',
      },
      page: {
        type: 'number',
        minimum: 1,
        default: 1,
        description: 'Page number',
      },
      pageSize: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        default: 20,
        description: 'Items per page',
      },
    },
    required: ['ticketId'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = getChildrenSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
