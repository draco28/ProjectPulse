/**
 * Kanban Get Board Tool - Sprint 15 Phase C
 *
 * MCP tool that wraps GET /api/sprints/[sprintId]/kanban
 * Returns complete kanban board with columns, ghost cards, and statistics.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

// Response types (mirroring apps/web/types/kanban.ts)
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
  childProgress?: number;
  assignee: string | null;
  assigneeType: string | null;
  epicRef: string | null;
  sprintNumber: number | null;
  createdAt: string;
  updatedAt: string;
}

interface GhostCard {
  ticketId: number;
  title: string;
  kind: string;
  actualStatus: string;
  ghostInStatus: string;
  ghostType: 'parent' | 'child';
  relatedTicketId: number;
}

interface ColumnStats {
  status: string;
  count: number;
  label: string;
  colorClass: string;
}

interface BoardStats {
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
  progress: number;
  columns: ColumnStats[];
}

interface SprintContext {
  id: string;
  sprintNumber: number;
  title: string;
  status: string;
  progress: number;
  phase: {
    id: string;
    title: string;
  };
}

interface KanbanBoardData {
  sprint: SprintContext;
  columns: Record<string, KanbanTicket[]>;
  ghosts: GhostCard[];
  stats: BoardStats;
}

interface ApiResponse {
  success: boolean;
  data?: KanbanBoardData;
  error?: {
    code: string;
    message: string;
  };
}

// Input schema
const getBoardSchema = z.object({
  sprintId: z.string().min(1, 'Sprint ID is required'),
});

type GetBoardInput = z.infer<typeof getBoardSchema>;

// Handler
async function handler(input: GetBoardInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const { sprintId } = input;

  try {
    const response = await httpClient.get<ApiResponse>(`/api/sprints/${sprintId}/kanban`);

    if (!response.success || !response.data) {
      return JSON.stringify(
        {
          status: 'error',
          error: {
            code: response.error?.code ?? 'FETCH_FAILED',
            message: response.error?.message ?? 'Failed to fetch kanban board',
          },
        },
        null,
        2
      );
    }

    const { sprint, columns, ghosts, stats } = response.data;

    logger.info('[kanban.getBoard] Board fetched', {
      sprintId,
      totalTickets: stats.total,
      columnsWithTickets: Object.entries(columns)
        .filter(([, tickets]) => tickets.length > 0)
        .map(([status]) => status),
    });

    // Return formatted response
    return JSON.stringify(
      {
        status: 'success',
        data: {
          sprint: {
            id: sprint.id,
            sprintNumber: sprint.sprintNumber,
            title: sprint.title,
            status: sprint.status,
            progress: sprint.progress,
            phase: sprint.phase,
          },
          columns,
          ghosts,
          stats: {
            total: stats.total,
            done: stats.done,
            inProgress: stats.inProgress,
            progress: stats.progress,
            columnSummary: stats.columns.map((c) => `${c.label}: ${c.count}`).join(', '),
          },
        },
      },
      null,
      2
    );
  } catch (error) {
    logger.error('[kanban.getBoard] Unexpected error', { error, sprintId });
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

// Tool definition
export const kanbanGetBoardTool: ToolDefinition = {
  name: 'projectpulse_kanban_getBoard',
  description: `[KANBAN] Get complete kanban board for a sprint with tickets grouped by column.

Returns:
- sprint: Sprint context (id, title, sprintNumber, progress, phase)
- columns: Record<status, KanbanTicket[]> - Tickets grouped by 5 columns
- ghosts: GhostCard[] - Parent/child relationship indicators across columns
- stats: Board statistics (total, done, inProgress, progress)

Columns (5-status workflow):
1. backlog - Not yet scheduled
2. todo - Ready to start
3. in-progress - Being worked on
4. in-review - Awaiting review
5. done - Completed

Ghost cards show parent/child relationships when tickets are in different columns.
Use this for kanban board rendering. For individual ticket operations, use ticket tools.

Related tools:
→ kanban_moveTicket - Move ticket between columns
→ ticket_update - Update ticket fields (including displayOrder)
→ sprint_getCurrentPosition - Find current sprint ID`,
  schema: getBoardSchema,
  inputSchema: {
    type: 'object',
    properties: {
      sprintId: {
        type: 'string',
        description:
          'Sprint ID (cuid) to fetch kanban board for. Get from roadmap_getPhaseProgress or sprint_getCurrentPosition.',
      },
    },
    required: ['sprintId'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = getBoardSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
