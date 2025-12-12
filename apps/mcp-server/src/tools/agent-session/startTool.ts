/**
 * Agent Session Start Tool
 *
 * Sprint 12: Start a new agent work session
 * Creates an AgentSession record for tracking work across tickets
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const todoItemSchema = z.object({
  content: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  ticketId: z.number().nullable().optional(),
});

const agentSessionStartSchema = z.object({
  projectId: z.number().int().positive(),
  name: z.string().min(1).max(255).optional(),
  plan: z.string().optional(),
  todos: z.array(todoItemSchema).optional(),
  activeTicketIds: z.array(z.number().int().positive()).optional(),
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

interface ApiResponse {
  session?: AgentSession;
  success?: boolean;
  error?: string;
}

async function handler(input: AgentSessionStartInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  try {
    const response = await httpClient.post<ApiResponse>('/api/agent-sessions', input);

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

    return JSON.stringify({
      status: 'success',
      message: 'Agent session started',
      session: {
        id: session.id,
        name: session.name,
        status: session.status,
        startedAt: session.startedAt,
        todosCount: session.todos ? (session.todos as unknown[]).length : 0,
        activeTicketsCount: session.activeTicketIds?.length || 0,
      },
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
  description:
    'Start a new agent work session. Creates an AgentSession record for tracking implementation work across multiple tickets. Use this at the start of a task to track plan, todos, and progress.',
  schema: agentSessionStartSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID to create the session for',
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
        description: 'IDs of tickets being worked on in this session',
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
