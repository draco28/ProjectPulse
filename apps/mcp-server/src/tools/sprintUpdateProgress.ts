/**
 * MCP Tool: sprint.updateProgress
 *
 * Purpose: Update progress for any sprint entity and trigger automatic roll-up
 *
 * Use Case: Agent invokes when user says "Mark session X as 100% complete"
 * or "Update task progress to 75%"
 *
 * Pattern: Zod schema → HTTP API call → Progress roll-up utility
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from './types.js';

// ============================================================================
// INPUT SCHEMA
// ============================================================================

const sprintUpdateProgressSchema = z.object({
  entityType: z.enum(['session', 'task', 'day', 'week', 'phase'], {
    errorMap: () => ({ message: 'entityType must be one of: session, task, day, week, phase' }),
  }),

  entityId: z.string()
    .cuid('entityId must be a valid CUID'),

  progress: z.number()
    .int('Progress must be an integer')
    .min(0, 'Progress must be between 0 and 100')
    .max(100, 'Progress must be between 0 and 100'),
});

type SprintUpdateProgressInput = z.infer<typeof sprintUpdateProgressSchema>;

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}

interface ProgressUpdateData {
  entity: {
    id: string;
    type: string;
    progress: number;
    status: string;
  };
  propagation: {
    updated: Array<{
      id: string;
      type: string;
      progress: number;
      status: string;
    }>;
    totalAffected: number;
  };
}

// ============================================================================
// TOOL HANDLER
// ============================================================================

/**
 * Handler for sprint.updateProgress tool
 *
 * Flow:
 * 1. Validate input (entityType, entityId, progress)
 * 2. POST to /api/progress
 * 3. Progress utility handles roll-up automatically
 * 4. Return updated entity + affected parent hierarchy
 * 5. Format response for Claude
 *
 * Error Handling:
 * - 400: Validation errors or entity not found
 * - 500: Server/database errors
 */
async function handler(
  input: SprintUpdateProgressInput,
  context: ToolContext
): Promise<string> {
  const { logger, httpClient, config } = context;

  try {
    // 1. Build API URL (generic route: /api/:entity/:id/progress)
    const entityTypePlural = `${input.entityType}s`;
    const url = `${config.apiBaseUrl}/api/${entityTypePlural}/${input.entityId}/progress`;

    // 2. Call API (PUT with progress in body)
    logger.info('[sprint.updateProgress] Calling PUT /api/:entity/:id/progress', {
      entityType: input.entityType,
      entityId: input.entityId,
      progress: input.progress,
    });

    const response = await httpClient.put<ApiResponse<ProgressUpdateData>>(url, {
      progress: input.progress,
    });

    // 3. Handle API errors
    if (!response.success || !response.data) {
      logger.error('[sprint.updateProgress] API returned error', {
        error: response.error,
      });

      return JSON.stringify(
        {
          status: 'error',
          error: response.error?.message || 'Failed to update progress',
          code: response.error?.code || 'UNKNOWN_ERROR',
        },
        null,
        2
      );
    }

    // 4. Format success response
    const { entity, propagation } = response.data;

    // Build propagation chain string
    const propagationChain = propagation.updated
      .map((e) => `${e.type} (${e.progress}% ${e.status})`)
      .join(' → ');

    logger.info('[sprint.updateProgress] Progress updated successfully', {
      entityType: entity.type,
      newProgress: entity.progress,
      totalAffected: propagation.totalAffected,
    });

    return JSON.stringify(
      {
        status: 'success',
        updated: {
          type: entity.type,
          id: entity.id,
          progress: `${entity.progress}%`,
          status: entity.status,
        },
        propagation: {
          message: `Progress propagated to ${propagation.totalAffected} parent entity/entities`,
          chain: propagationChain || 'No parent entities (top level)',
          affected: propagation.updated,
        },
      },
      null,
      2
    );
  } catch (error) {
    // 5. Handle unexpected errors
    logger.error('[sprint.updateProgress] Unexpected error', { error });

    return JSON.stringify(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      null,
      2
    );
  }
}

// ============================================================================
// TOOL DEFINITION
// ============================================================================

export const sprintUpdateProgressTool: ToolDefinition = {
  name: 'projectpulse.sprint.updateProgress',

  description: `Update progress for any sprint entity (session/task/day/week/phase) and automatically propagate to parent entities.

  Use this tool when:
  - User says "Mark session X as complete" (progress = 100)
  - User says "Update task Y to 75% progress"
  - User wants to track progress at any hierarchy level

  Progress automatically rolls up:
  - Session 100% → Task recalculates from all sessions
  - Task updated → Day recalculates from all tasks
  - Day updated → Week recalculates from all days
  - Week updated → Phase recalculates from all weeks

  Returns updated entity + full hierarchy showing propagation.`,

  schema: sprintUpdateProgressSchema,

  inputSchema: {
    type: 'object',
    properties: {
      entityType: {
        type: 'string',
        enum: ['session', 'task', 'day', 'week', 'phase'],
        description: 'Type of entity to update (session, task, day, week, or phase)',
      },
      entityId: {
        type: 'string',
        format: 'uuid',
        description: 'UUID of the entity to update',
      },
      progress: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'New progress value (0-100)',
      },
    },
    required: ['entityType', 'entityId', 'progress'],
  },

  execute: async (params: unknown, context: ToolContext) => {
    const result = await handler(params as SprintUpdateProgressInput, context);

    context.logger.info('[sprint.updateProgress] Tool execution complete', {
      resultLength: result.length,
    });

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  },
};
