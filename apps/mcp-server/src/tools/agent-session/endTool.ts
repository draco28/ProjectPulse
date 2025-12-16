/**
 * Agent Session End Tool
 *
 * Sprint 12: Mark an agent work session as complete
 * Sets status to COMPLETED and records completedAt timestamp
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const agentSessionEndSchema = z.object({
  sessionId: z.string().min(1),
  progress: z.string().optional(), // Final progress notes
});

type AgentSessionEndInput = z.infer<typeof agentSessionEndSchema>;

interface EndResponse {
  success: boolean;
  session?: {
    id: string;
    status: string;
    completedAt: string;
  };
  message?: string;
  error?: string;
}

async function handler(input: AgentSessionEndInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const { sessionId, progress } = input;

  try {
    const body = progress ? { progress } : {};
    const response = await httpClient.post<EndResponse>(`/api/agent-sessions/${sessionId}/end`, body);

    if (!response || typeof response !== 'object') {
      return JSON.stringify({
        status: 'error',
        message: 'Failed to end agent session',
      });
    }

    // Handle error response
    if ('error' in response && response.error) {
      return JSON.stringify({
        status: 'error',
        message: response.error,
      });
    }

    if (response.success && response.session) {
      logger.info('[agent-session.end] Session completed', {
        id: response.session.id,
        completedAt: response.session.completedAt,
      });

      return JSON.stringify({
        status: 'success',
        message: response.message || 'Agent session completed',
        session: response.session,
      }, null, 2);
    }

    return JSON.stringify({
      status: 'error',
      message: 'Unknown response format',
    });
  } catch (error) {
    logger.error('[agent-session.end] Unexpected error', { error });
    return JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unexpected error',
    });
  }
}

export const agentSessionEndTool: ToolDefinition = {
  name: 'projectpulse_agent_session_end',
  description: `[SESSION] End current session and auto-sync progress to memory banks.

When to Use:
- Task/ticket completed
- Switching to different work
- End of work period

Auto-Syncs (automatic):
- PROGRESS bank: Adds session summary with tickets and todos completed
- ACTIVE_CONTEXT bank: Updates current focus

Optionally: Add final progress notes before completion.

Next: Call projectpulse_context_load to start new work.`,
  schema: agentSessionEndSchema,
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'ID of the agent session to complete',
      },
      progress: {
        type: 'string',
        description: 'Final progress notes to append before completion',
      },
    },
    required: ['sessionId'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = agentSessionEndSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return {
      content: [{ type: 'text', text: result }],
    };
  },
};
