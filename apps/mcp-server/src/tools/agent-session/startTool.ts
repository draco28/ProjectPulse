/**
 * Agent Session Start Tool
 *
 * Sprint 12: Start a new agent work session
 * Creates an AgentSession record for tracking work across tickets
 *
 * Phase 3 (Self-Guiding MCP): Includes context hints in response
 * Sprint 17: Added activeTicketNumbers for project-scoped ticket references
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import { createContextField, type ContextHintField } from '../../utils/contextHints.js';

const todoItemSchema = z.object({
  content: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  ticketId: z.number().nullable().optional(),
});

// Sprint 18: projectId now auto-fills from auth context when omitted
const agentSessionStartSchema = z.object({
  projectId: z.number().int().positive().optional(),  // Auto-fills from auth context
  name: z.string().min(1).max(255).optional(),
  plan: z.string().optional(),
  todos: z.array(todoItemSchema).optional(),
  // Sprint 17: Support both global IDs and project-scoped ticket numbers
  activeTicketIds: z.array(z.number().int().positive()).optional(),
  activeTicketNumbers: z.array(z.number().int().positive()).optional(),
});

type AgentSessionStartInput = z.infer<typeof agentSessionStartSchema>;

interface AgentSession {
  id: string;
  projectId: number;
  name: string | null;
  plan: string | null;
  todos: unknown[] | null;
  progress: string | null;
  activeTicketIds: string[];
  status: string;
  startedAt: string;
}

// Sprint 16: Ticket claim info returned by API
interface TicketClaimInfo {
  ticketId: number;
  previousStatus: string;
  newStatus: string;
}

interface ApiResponse {
  session?: AgentSession;
  success?: boolean;
  error?: string;
  ticketsClaimed?: TicketClaimInfo[];
  message?: string;
}

async function handler(input: AgentSessionStartInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;

  // Sprint 18: Auto-fill projectId from authenticated context
  const resolvedProjectId = input.projectId ?? context.projectId;

  // Validate we have projectId (required for session creation)
  if (!resolvedProjectId) {
    return JSON.stringify({
      status: 'error',
      message: 'projectId required (not available from auth context)',
    });
  }

  try {
    // Sprint 17: Resolve activeTicketNumbers to global IDs if provided
    let resolvedTicketIds = input.activeTicketIds || [];
    if (input.activeTicketNumbers && input.activeTicketNumbers.length > 0) {
      const resolvedIds: number[] = [];
      for (const ticketNumber of input.activeTicketNumbers) {
        const lookupResponse = await httpClient.get<{ data?: { id: number }; error?: string }>(
          `/api/tickets/by-number/${resolvedProjectId}/${ticketNumber}`
        );
        if (!lookupResponse.data?.id) {
          return JSON.stringify({
            status: 'error',
            message: `Ticket #${ticketNumber} not found in project ${resolvedProjectId}`,
          });
        }
        resolvedIds.push(lookupResponse.data.id);
      }
      // Merge with any explicitly provided IDs (dedup)
      resolvedTicketIds = [...new Set([...resolvedTicketIds, ...resolvedIds])];
    }

    // Build payload with resolved ticket IDs and projectId
    const payload = {
      ...input,
      projectId: resolvedProjectId,  // Sprint 18: Use resolved projectId
      activeTicketIds: resolvedTicketIds.length > 0 ? resolvedTicketIds : undefined,
      activeTicketNumbers: undefined, // Don't send to API - it only accepts IDs
    };

    const response = await httpClient.post<ApiResponse>('/api/agent-sessions', payload);

    if (!response || typeof response !== 'object') {
      return JSON.stringify({
        status: 'error',
        message: 'Failed to create agent session',
      });
    }

    // Handle error response
    if (response.error) {
      return JSON.stringify({
        status: 'error',
        message: response.error,
      });
    }

    const session = response.session;
    if (!session) {
      return JSON.stringify({
        status: 'error',
        message: 'No session returned from API',
      });
    }

    logger.info('[agent-session.start] Session started', {
      id: session.id,
      projectId: session.projectId,
      name: session.name,
    });

    // Phase 3: Add context hints
    const contextHint: ContextHintField = createContextField({
      sessionActive: true,
      sessionName: session.name,
      hint: '💡 Tip: Call projectpulse_context_load to see full project context including memory banks and available resources.',
    });

    // Sprint 16: Include ticket claim info in response
    const ticketsClaimed = response.ticketsClaimed;
    const claimMessage = ticketsClaimed && ticketsClaimed.length > 0
      ? `${ticketsClaimed.length} ticket(s) claimed and moved to in-progress.`
      : undefined;

    return JSON.stringify({
      status: 'success',
      message: claimMessage
        ? `Agent session started. ${claimMessage}`
        : 'Agent session started',
      session: {
        id: session.id,
        name: session.name,
        status: session.status,
        startedAt: session.startedAt,
        todosCount: session.todos ? (session.todos as unknown[]).length : 0,
        activeTicketsCount: session.activeTicketIds?.length || 0,
      },
      // Sprint 16: Ticket claiming results
      ticketsClaimed: ticketsClaimed,
      _context: contextHint,
    }, null, 2);
  } catch (error) {
    logger.error('[agent-session.start] Unexpected error', { error });
    return JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unexpected error',
    });
  }
}

export const agentSessionStartTool: ToolDefinition = {
  name: 'projectpulse_agent_session_start',
  description: `[SESSION] Start a new agent work session to track progress.

When to Use:
- After calling projectpulse_context_load
- When beginning a new task or ticket
- When resuming work after a break

RECOMMENDED: Call projectpulse_context_load first to see if you have an
existing session to resume.

Creates:
- Session with name, plan, and todo tracking
- Links to active tickets (optional)

Next Actions:
→ projectpulse_agent_session_update - Save progress checkpoints
→ projectpulse_agent_session_end - Complete session (auto-syncs to memory banks)

SESSION LIFECYCLE:
1. START: Creates new session (IN_PROGRESS)
2. UPDATE: Save progress, todos, plan changes
3. PAUSE (optional): Set status='PAUSED' to take breaks - can resume later with full context
4. END: Mark COMPLETED - syncs to memory banks, CANNOT be resumed

TICKET IDENTIFICATION (Sprint 17):
- Use \`activeTicketNumbers\` for user-referenced tickets: "Tickets #5 and #7"
- Use \`activeTicketIds\` for internal/API-retrieved tickets (global ID)
- Can provide both - they will be merged with deduplication

TICKET AUTO-CLAIM (Sprint 16):
When activeTicketIds or activeTicketNumbers is provided:
1. Validates ALL tickets are in "todo" status (not backlog/in-progress/in-review/done)
2. Validates tickets aren't already claimed by another session
3. Auto-claims: status → "in-progress", assignee → "Claude Code", linkedSessionId → this session
4. Returns ticketsClaimed array with claim details

Only "todo" tickets can be claimed. Use ticket_search({ status: ['todo'] }) to find claimable tickets.`,
  schema: agentSessionStartSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID (auto-fills from auth context when omitted)',
      },
      name: {
        type: 'string',
        description: 'Session name (e.g., "Implementing user authentication")',
      },
      plan: {
        type: 'string',
        description: 'Implementation plan in markdown format',
      },
      todos: {
        type: 'array',
        description: 'Initial list of todo items [{content, status, ticketId?}]',
        items: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
            ticketId: { type: 'number', nullable: true },
          },
          required: ['content', 'status'],
        },
      },
      activeTicketIds: {
        type: 'array',
        description: 'Global ticket IDs to claim (use if you have them from API responses)',
        items: { type: 'number' },
      },
      activeTicketNumbers: {
        type: 'array',
        description: 'Project-scoped ticket numbers to claim (use for user-referenced tickets like "#5, #7")',
        items: { type: 'number' },
      },
    },
    required: ['projectId'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = agentSessionStartSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return {
      content: [{ type: 'text', text: result }],
    };
  },
};
