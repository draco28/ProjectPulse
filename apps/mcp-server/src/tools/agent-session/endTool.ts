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
  tokenCount: z.number().int().nonnegative().optional(), // Sprint 15: Phase F - Final token usage
});

type AgentSessionEndInput = z.infer<typeof agentSessionEndSchema>;

interface SyncBankStatus {
  success: boolean;
  error?: string;
}

interface SyncStatus {
  progress: SyncBankStatus;
  activeContext: SyncBankStatus;
}

interface EndResponse {
  success: boolean;
  session?: {
    id: string;
    status: string;
    completedAt: string;
  };
  syncStatus?: SyncStatus | null;
  ticketsMovedToReview?: number[]; // Sprint 16: Tickets moved to in-review
  message?: string;
  error?: string;
}

async function handler(input: AgentSessionEndInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;
  const { sessionId, progress, tokenCount } = input;

  try {
    const body: Record<string, unknown> = {};
    if (progress) body.progress = progress;
    if (tokenCount !== undefined) body.tokenCount = tokenCount;
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

      // Build result with sync status visibility
      const result: Record<string, unknown> = {
        status: 'success',
        message: response.message || 'Agent session completed',
        session: response.session,
      };

      // Sprint 16: Include tickets moved to in-review
      if (response.ticketsMovedToReview && response.ticketsMovedToReview.length > 0) {
        result.ticketsMovedToReview = response.ticketsMovedToReview;
        result.ticketMessage = `${response.ticketsMovedToReview.length} ticket(s) moved to in-review for user verification.`;
      }

      // Parse sync status and add warnings if any sync failed
      if (response.syncStatus) {
        const syncWarnings: string[] = [];

        if (!response.syncStatus.progress.success) {
          syncWarnings.push(`PROGRESS bank sync failed: ${response.syncStatus.progress.error || 'Unknown error'}`);
        }
        if (!response.syncStatus.activeContext.success) {
          syncWarnings.push(`ACTIVE_CONTEXT bank sync failed: ${response.syncStatus.activeContext.error || 'Unknown error'}`);
        }

        if (syncWarnings.length > 0) {
          result.syncWarnings = syncWarnings;
          result.hint = 'Memory bank sync partially failed. Context may not be fully updated for next session. Consider calling projectpulse_context_update manually if needed.';
          logger.warn('[agent-session.end] Memory bank sync warnings', { warnings: syncWarnings });
        } else {
          result.syncStatus = {
            progress: '✓ synced',
            activeContext: '✓ synced',
          };
        }
      }

      return JSON.stringify(result, null, 2);
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

Next: Call projectpulse_context_load to start new work.

⚠️ IMPORTANT:
- COMPLETED sessions CANNOT be resumed - use PAUSED for breaks instead
- If you need to take a break: call projectpulse_agent_session_update({ status: 'PAUSED' })
- Only call session_end when work is truly FINISHED

TICKET AUTO-MOVE (Sprint 16):
When session ends, linked tickets are automatically moved:
1. Tickets in "in-progress" → "in-review"
2. Tickets already in "done" are skipped (user may have closed manually)
3. linkedSessionId is preserved for traceability
4. Returns ticketsMovedToReview array

User then verifies completed work and moves tickets: in-review → done.`,
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
      tokenCount: {
        type: 'number',
        description: 'Total tokens used in this session (Sprint 15: Phase F)',
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
