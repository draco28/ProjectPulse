/**
 * MCP Tool: Ticket Get Children (Sprint 13, Sprint 17)
 *
 * Get paginated children of a feature ticket
 * Sprint 17: Added dual-input support (ticketId OR ticketNumber+projectId)
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  buildErrorPayload,
  ticketNumberSchema,
  projectIdSchema,
} from './common.js';

interface TicketChildSummary {
  id: number;
  ticketNumber: number;  // Sprint 17
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
    ticketNumber: number;  // Sprint 17
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

// Sprint 17: Dual-input schema - accept either ticketId OR (ticketNumber + projectId)
const getChildrenSchema = z.object({
  ticketId: z.number().int().positive().optional(),      // Global ID (existing)
  ticketNumber: ticketNumberSchema.optional(),           // Project-scoped (NEW)
  projectId: projectIdSchema.optional(),                 // Required with ticketNumber
  status: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
}).refine(
  (data) => data.ticketId || (data.ticketNumber && data.projectId),
  { message: 'Either ticketId OR (ticketNumber + projectId) required' }
);

type GetChildrenInput = z.infer<typeof getChildrenSchema>;

async function handler(input: GetChildrenInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;

  // Sprint 17: Resolve ticketId if ticketNumber was provided
  let resolvedTicketId = input.ticketId;
  if (!resolvedTicketId && input.ticketNumber && input.projectId) {
    const lookupResponse = await httpClient.get<ApiResponse<{ id: number }>>(
      `/api/tickets/by-number/${input.projectId}/${input.ticketNumber}`
    );
    if (!lookupResponse.data) {
      return buildErrorPayload(
        `Ticket #${input.ticketNumber} not found in project ${input.projectId}`,
        'NOT_FOUND'
      );
    }
    resolvedTicketId = lookupResponse.data.id;
  }

  const params = new URLSearchParams();
  if (input.status) params.set('status', input.status);
  if (input.page) params.set('page', String(input.page));
  if (input.pageSize) params.set('pageSize', String(input.pageSize));

  const path = params.toString()
    ? `/api/tickets/${resolvedTicketId}/children?${params.toString()}`
    : `/api/tickets/${resolvedTicketId}/children`;

  try {
    const response = await httpClient.get<ApiResponse<ChildrenResponse>>(path);

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to get children',
        response.error?.code
      );
    }

    const identifier = input.ticketId
      ? { parentId: input.ticketId }
      : { parentTicketNumber: input.ticketNumber, projectId: input.projectId };
    logger.info('[ticket.getChildren] Children fetched', {
      ...identifier,
      childrenCount: response.data.totalCount,
    });

    return JSON.stringify({
      parent: {
        // Sprint 17: ticketNumber first
        ticketNumber: response.data.parent.ticketNumber,
        id: response.data.parent.id,
        title: response.data.parent.title,
        kind: response.data.parent.kind,
      },
      children: response.data.children.map((child) => ({
        // Sprint 17: ticketNumber first
        ticketNumber: child.ticketNumber,
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
    const identifier = input.ticketId
      ? { ticketId: input.ticketId }
      : { ticketNumber: input.ticketNumber, projectId: input.projectId };
    logger.error('[ticket.getChildren] Unexpected error', { error, ...identifier });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const ticketGetChildrenTool: ToolDefinition = {
  name: 'projectpulse_ticket_getChildren',
  description: `[QUERY] Get paginated children of a feature ticket.

TICKET IDENTIFICATION (Sprint 17):
- Use \`ticketNumber\` (+ projectId) for user-referenced tickets: "Ticket #5"
- Use \`ticketId\` for internal/API-retrieved tickets (global ID)

Use this to retrieve all task/issue/bug/tech_debt tickets under a feature.

Returns:
- Parent ticket summary (with ticketNumber)
- Paginated list of children (with ticketNumber)
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
        description: 'Global ticket ID of parent feature (use if you have it from API)',
      },
      ticketNumber: {
        type: 'number',
        description: 'Project-scoped ticket number of parent (use for user-referenced tickets like "#5")',
      },
      projectId: {
        type: 'number',
        description: 'Project ID (required when using ticketNumber)',
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
    required: [],  // Validation uses refine()
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = getChildrenSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
