/**
 * Agent Session Resume Tool
 *
 * Sprint 14: Resume a paused agent work session
 * Returns full session context (plan, todos, progress) for context recovery
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const agentSessionResumeSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

type AgentSessionResumeInput = z.infer<typeof agentSessionResumeSchema>;

interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  ticketId?: number | null;
}

interface AgentSession {
  id: string;
  projectId: number;
  name: string | null;
  plan: string | null;
  todos: TodoItem[] | null;
  progress: string | null;
  activeTicketIds: string[];
  status: string;
  startedAt: string;
  updatedAt: string;
}

interface ResumeResponse {
  success: boolean;
  session?: AgentSession;
  isAlreadyActive?: boolean;
  message?: string;
  error?: string;
  hint?: string;
}

async function handler(input: AgentSessionResumeInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const { sessionId } = input;

  try {
    const response = await httpClient.post<ResumeResponse>(`/api/agent-sessions/${sessionId}/resume`, {});

    if (!response || typeof response !== 'object') {
      return JSON.stringify({
        status: 'error',
        message: 'Failed to resume agent session',
      });
    }

    // Handle error response (e.g., COMPLETED session)
    if ('error' in response && response.error) {
      return JSON.stringify({
        status: 'error',
        message: response.error,
        hint: response.hint || 'Use projectpulse_agent_session_start to create a new session.',
      });
    }

    if (response.success && response.session) {
      const session = response.session;

      logger.info('[agent-session.resume] Session resumed', {
        id: session.id,
        status: session.status,
        isAlreadyActive: response.isAlreadyActive,
      });

      // Calculate todo stats
      const todos = session.todos || [];
      const todoStats = {
        total: todos.length,
        pending: todos.filter(t => t.status === 'pending').length,
        inProgress: todos.filter(t => t.status === 'in_progress').length,
        completed: todos.filter(t => t.status === 'completed').length,
      };

      // Build comprehensive result with full context
      const result: Record<string, unknown> = {
        status: 'success',
        message: response.message || 'Session resumed successfully',
        session: {
          id: session.id,
          projectId: session.projectId,
          name: session.name,
          status: session.status,
          startedAt: session.startedAt,
          updatedAt: session.updatedAt,
          activeTicketIds: session.activeTicketIds,
          todoStats,
        },
      };

      // Include warning if session was already active (multi-instance scenario)
      if (response.isAlreadyActive) {
        result.warning = 'Session was already IN_PROGRESS - this may be running in another Claude Code instance.';
      }

      // Include full plan for context recovery (the "crown jewel")
      if (session.plan) {
        result.plan = session.plan;
      }

      // Include full todos list
      if (todos.length > 0) {
        result.todos = todos;
      }

      // Include progress notes (may be long, but important for recovery)
      if (session.progress) {
        result.progress = session.progress;
      }

      // Add next action hints
      result.nextActions = [
        'projectpulse_agent_session_update - Continue tracking progress',
        'projectpulse_context_load - Get full project context if needed',
        'projectpulse_agent_session_end - Complete when finished',
      ];

      return JSON.stringify(result, null, 2);
    }

    return JSON.stringify({
      status: 'error',
      message: 'Unknown response format',
    });
  } catch (error) {
    logger.error('[agent-session.resume] Unexpected error', { error });
    return JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unexpected error',
    });
  }
}

export const agentSessionResumeTool: ToolDefinition = {
  name: 'projectpulse_agent_session_resume',
  description: `[SESSION] Resume a paused session with full context recovery.

When to Use:
- After projectpulse_context_load shows a PAUSED session
- When returning from a break
- When switching back to a previously paused task

Returns: FULL session context including:
- Plan (your implementation roadmap)
- Todos (all items with status)
- Progress notes
- Active ticket IDs

Behavior:
- PAUSED → IN_PROGRESS: Normal resume
- IN_PROGRESS → Returns context anyway (for multi-instance scenarios)
- COMPLETED → Error (cannot resume, start new session)

After Resume: Continue working with projectpulse_agent_session_update`,
  schema: agentSessionResumeSchema,
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'ID of the paused session to resume (from projectpulse_context_load)',
      },
    },
    required: ['sessionId'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = agentSessionResumeSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return {
      content: [{ type: 'text', text: result }],
    };
  },
};
