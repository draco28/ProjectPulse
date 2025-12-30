/**
 * Kanban Move Ticket Tool - Sprint 15 Phase C
 *
 * MCP tool that wraps PATCH /api/tickets/[id]/move
 * Moves a ticket to a new column and/or position with automatic progress cascade.
 *
 * Sprint 17: Added dual-input support (ticketId OR ticketNumber+projectId)
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import { resolveProjectId } from '../tickets/common.js';

// Sprint 17: API response for ticketNumber lookup
interface TicketLookupResponse {
  data?: { id: number };
  error?: string;
}

// Valid kanban statuses (5-column workflow)
const KANBAN_STATUSES = ['backlog', 'todo', 'in-progress', 'in-review', 'done'] as const;

// Response types
interface KanbanTicket {
  id: number;
  title: string;
  status: string;
  priority: string | null;
  kind: string;
  displayOrder: number;
  parentTicketId: number | null;
  parentTicket?: {
    id: number;
    title: string;
    status: string;
  } | null;
  childTickets?: Array<{
    id: number;
    status: string;
  }>;
  assignee: string | null;
  assigneeType: string | null;
  epicRef: string | null;
  sprintNumber: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ProgressUpdates {
  ticketId: number;
  parentProgress?: number;
  sprintProgress?: number;
  phaseProgress?: number;
}

interface MoveTicketData {
  success: boolean;
  ticket: KanbanTicket;
  progressUpdates?: ProgressUpdates;
}

interface ApiResponse {
  success: boolean;
  data?: MoveTicketData;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Input schema - Sprint 17: Dual-input support
// Sprint 18: projectId now auto-fills from auth context when omitted
const moveTicketSchema = z.object({
  // Sprint 17: Accept either ticketId OR ticketNumber
  ticketId: z.number().int().positive('Ticket ID must be a positive integer').optional(),
  ticketNumber: z.number().int().positive('Ticket number must be a positive integer').optional(),
  projectId: z.number().int().positive('Project ID must be a positive integer').optional(),  // Auto-fills from auth context
  status: z.enum(KANBAN_STATUSES, {
    errorMap: () => ({
      message: `Status must be one of: ${KANBAN_STATUSES.join(', ')}`,
    }),
  }),
  displayOrder: z
    .number()
    .int()
    .min(0, 'Display order must be non-negative')
    .max(10000, 'Display order must be at most 10000'),
}).refine(
  (data) => data.ticketId || data.ticketNumber,
  { message: 'Either ticketId OR ticketNumber required' }
);

type MoveTicketInput = z.infer<typeof moveTicketSchema>;

// Handler
async function handler(input: MoveTicketInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const { ticketId, ticketNumber, projectId, status, displayOrder } = input;

  // Sprint 18: Auto-fill projectId from authenticated context
  const resolvedProjectId = resolveProjectId(projectId, context.projectId);

  // Validate we have projectId when using ticketNumber
  if (ticketNumber && !ticketId && !resolvedProjectId) {
    return JSON.stringify({
      status: 'error',
      error: {
        code: 'MISSING_PROJECT_ID',
        message: 'projectId required when using ticketNumber (not available from auth context)',
      },
    }, null, 2);
  }

  try {
    // Sprint 17: Resolve ticketId if ticketNumber was provided
    let resolvedTicketId = ticketId;
    if (!resolvedTicketId && ticketNumber && resolvedProjectId) {
      const lookupResponse = await httpClient.get<TicketLookupResponse>(
        `/api/tickets/by-number/${resolvedProjectId}/${ticketNumber}`
      );
      if (!lookupResponse.data?.id) {
        return JSON.stringify({
          status: 'error',
          error: {
            code: 'NOT_FOUND',
            message: `Ticket #${ticketNumber} not found in project ${resolvedProjectId}`,
          },
        }, null, 2);
      }
      resolvedTicketId = lookupResponse.data.id;
    }

    const response = await httpClient.patch<ApiResponse>(`/api/tickets/${resolvedTicketId}/move`, {
      status,
      displayOrder,
    });

    if (!response.success || !response.data) {
      return JSON.stringify(
        {
          status: 'error',
          error: {
            code: response.error?.code ?? 'MOVE_FAILED',
            message: response.error?.message ?? 'Failed to move ticket',
            details: response.error?.details,
          },
        },
        null,
        2
      );
    }

    const { ticket, progressUpdates } = response.data;

    const identifier = ticketId ? { ticketId } : { ticketNumber, projectId: resolvedProjectId };
    logger.info('[kanban.moveTicket] Ticket moved', {
      ...identifier,
      resolvedTicketId,
      newStatus: status,
      newPosition: displayOrder,
      hadProgressCascade: !!progressUpdates,
    });

    // Build response with progress cascade info
    const result: Record<string, unknown> = {
      status: 'success',
      data: {
        ticket: {
          id: ticket.id,
          title: ticket.title,
          status: ticket.status,
          displayOrder: ticket.displayOrder,
          priority: ticket.priority,
          kind: ticket.kind,
          parentTicketId: ticket.parentTicketId,
          assignee: ticket.assignee,
        },
      },
    };

    // Include progress updates if status changed
    if (progressUpdates) {
      (result.data as Record<string, unknown>).progressUpdates = {
        ticketId: progressUpdates.ticketId,
        ...(progressUpdates.parentProgress !== undefined && {
          parentProgress: `${progressUpdates.parentProgress}%`,
        }),
        ...(progressUpdates.sprintProgress !== undefined && {
          sprintProgress: `${progressUpdates.sprintProgress}%`,
        }),
        ...(progressUpdates.phaseProgress !== undefined && {
          phaseProgress: `${progressUpdates.phaseProgress}%`,
        }),
      };

      // Add helpful message about cascade
      (result.data as Record<string, unknown>).message = buildProgressMessage(progressUpdates);
    }

    return JSON.stringify(result, null, 2);
  } catch (error) {
    const identifier = ticketId ? { ticketId } : { ticketNumber, projectId: resolvedProjectId };
    logger.error('[kanban.moveTicket] Unexpected error', { error, ...identifier, status, displayOrder });
    return JSON.stringify(
      {
        status: 'error',
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unexpected error',
        },
      },
      null,
      2
    );
  }
}

// Helper to build progress message
function buildProgressMessage(updates: ProgressUpdates): string {
  const parts: string[] = [];

  if (updates.parentProgress !== undefined) {
    parts.push(`Parent feature: ${updates.parentProgress}%`);
  }
  if (updates.sprintProgress !== undefined) {
    parts.push(`Sprint: ${updates.sprintProgress}%`);
  }
  if (updates.phaseProgress !== undefined) {
    parts.push(`Phase: ${updates.phaseProgress}%`);
  }

  if (parts.length === 0) return 'No progress cascade triggered';
  return `Progress updated: ${parts.join(', ')}`;
}

// Tool definition
export const kanbanMoveTicketTool: ToolDefinition = {
  name: 'projectpulse_kanban_moveTicket',
  description: `[KANBAN] Move a ticket to a new column and/or position with automatic progress cascade.

TICKET IDENTIFICATION (Sprint 17):
- Use \`ticketNumber\` (+ projectId) for user-referenced tickets: "Move Ticket #5 to done"
- Use \`ticketId\` for internal/API-retrieved tickets (global ID)

Use this for kanban drag-drop operations. Returns:
- ticket: Updated ticket with new status and position
- progressUpdates: Progress changes at parent/sprint/phase levels (only if status changed)

This is preferred over ticket_update when moving tickets because:
1. Handles reordering of other tickets in column automatically
2. Returns progress cascade for immediate UI feedback
3. Manages closedAt timestamp automatically (set when moving to 'done')

Columns (5-status workflow):
- backlog: Not yet scheduled
- todo: Ready to start
- in-progress: Being worked on
- in-review: Awaiting review
- done: Completed

Related tools:
→ kanban_getBoard - Fetch complete board state
→ ticket_update - Update other ticket fields
→ ticket_setStatus - Simple status change (no reorder, no progress)`,
  schema: moveTicketSchema,
  inputSchema: {
    type: 'object',
    properties: {
      ticketId: {
        type: 'number',
        description: 'Global ticket ID (use if you have it from API responses)',
      },
      ticketNumber: {
        type: 'number',
        description: 'Project-scoped ticket number (use for user-referenced tickets like "#5")',
      },
      projectId: {
        type: 'number',
        description: 'Project ID (auto-fills from auth context when omitted)',
      },
      status: {
        type: 'string',
        enum: KANBAN_STATUSES as unknown as string[],
        description: 'Target column (status): backlog, todo, in-progress, in-review, or done',
      },
      displayOrder: {
        type: 'number',
        description: 'Target position in column (0-indexed). 0 = top of column.',
      },
    },
    required: ['status', 'displayOrder'],  // ticketId or (ticketNumber + projectId) validated via refine()
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = moveTicketSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
