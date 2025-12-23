/**
 * Agent Session Update Tool
 *
 * Sprint 12: Update an agent work session
 * Updates plan, todos, progress, or active tickets
 *
 * Phase 3 (Self-Guiding MCP): Includes context hints in response
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import { createContextField, type ContextHintField } from '../../utils/contextHints.js';

const todoItemSchema = z.object({
  content: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  ticketId: z.number().nullable().optional(),
});

const agentSessionUpdateSchema = z.object({
  sessionId: z.string().min(1),
  name: z.string().min(1).max(255).optional(),
  plan: z.string().optional(),
  todos: z.array(todoItemSchema).optional(),
  progress: z.string().optional(),
  appendProgress: z.boolean().optional(), // Ticket #31: Append to existing progress
  activeTicketIds: z.array(z.number().int().positive()).optional(),
  status: z.enum(['IN_PROGRESS', 'PAUSED']).optional(),
});

type AgentSessionUpdateInput = z.infer<typeof agentSessionUpdateSchema>;

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
  updatedAt: string;
}

interface ApiResponse {
  session?: AgentSession;
  success?: boolean;
  error?: string;
}

async function handler(input: AgentSessionUpdateInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const { sessionId, ...updateData } = input;

  try {
    const response = await httpClient.patch<ApiResponse>(`/api/agent-sessions/${sessionId}`, updateData);

    if (!response || typeof response !== 'object') {
      return JSON.stringify({
        status: 'error',
        message: 'Failed to update agent session',
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

    logger.info('[agent-session.update] Session updated', {
      id: session.id,
      status: session.status,
    });

    // Phase 3: Add context hints
    const contextHint: ContextHintField = createContextField({
      sessionActive: true,
      sessionName: session.name,
      hint: '💡 Tip: If you lost context, call projectpulse_context_load to recover your full session state.',
    });

    return JSON.stringify({
      status: 'success',
      message: 'Agent session updated',
      session: {
        id: session.id,
        name: session.name,
        status: session.status,
        updatedAt: session.updatedAt,
        todosCount: session.todos ? (session.todos as unknown[]).length : 0,
        activeTicketsCount: session.activeTicketIds?.length || 0,
      },
      _context: contextHint,
    }, null, 2);
  } catch (error) {
    logger.error('[agent-session.update] Unexpected error', { error });
    return JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unexpected error',
    });
  }
}

export const agentSessionUpdateTool: ToolDefinition = {
  name: 'projectpulse_agent_session_update',
  description: `[SESSION] Update current session with progress, todos, or plan changes.

When to Use:
- After completing a todo item
- When hitting a checkpoint (every ~15 minutes)
- When plan changes mid-session

Requires: Active session (call projectpulse_agent_session_start first)

Updates: todos status, progress notes, plan text, active tickets

If you lost context: Call projectpulse_context_load to recover full session state.

PAUSING vs ENDING:
- Use status: 'PAUSED' for breaks (lunch, switching tasks, end of day)
  → Session saved with full context, can resume anytime
- Use projectpulse_agent_session_end ONLY when work is COMPLETE
  → Syncs to memory banks, CANNOT be resumed

Multi-Instance: Each Claude Code instance should have its own session. When pausing,
your session stays independent from other instances.`,
  schema: agentSessionUpdateSchema,
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'ID of the agent session to update',
      },
      name: {
        type: 'string',
        description: 'Updated session name',
      },
      plan: {
        type: 'string',
        description: 'Updated implementation plan',
      },
      todos: {
        type: 'array',
        description: 'Updated todo list [{content, status, ticketId?}]',
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
      progress: {
        type: 'string',
        description: 'Progress notes (use appendProgress: true to append instead of replace)',
      },
      appendProgress: {
        type: 'boolean',
        description: 'If true, append progress to existing notes instead of replacing (default: false)',
      },
      activeTicketIds: {
        type: 'array',
        description: 'Updated list of active ticket IDs',
        items: { type: 'number' },
      },
      status: {
        type: 'string',
        enum: ['IN_PROGRESS', 'PAUSED'],
        description: 'Session status (use agent_session_end to complete)',
      },
    },
    required: ['sessionId'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = agentSessionUpdateSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return {
      content: [{ type: 'text', text: result }],
    };
  },
};
