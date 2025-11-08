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
    .uuid('entityId must be a valid UUID'),

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
  updated: {
    type: string;
    id: string;
    title: string;
    progress: number;
    status: string;
  };
  hierarchy: {
    task?: {
      id: string;
      title: string;
      progress: number;
      status: string;
    } | null;
    day?: {
      id: string;
      title: string;
      progress: number;
      status: string;
    } | null;
    week?: {
      id: string;
      title: string;
      progress: number;
      status: string;
    } | null;
    phase?: {
      id: string;
      title: string;
      progress: number;
      status: string;
    } | null;
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
    // 1. Build API URL
    const url = `${config.PROJECTPULSE_API_URL}/api/progress`;

    // 2. Call API
    logger.info('[sprint.updateProgress] Calling POST /api/progress', {
      entityType: input.entityType,
      entityId: input.entityId,
      progress: input.progress,
    });

    const response = await httpClient.post<ApiResponse<ProgressUpdateData>>(url, {
      entityType: input.entityType,
      entityId: input.entityId,
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
    const { updated, hierarchy } = response.data;

    // Build hierarchy string
    const hierarchyParts: string[] = [];
    if (hierarchy.phase) {
      hierarchyParts.push(
        `Phase: ${hierarchy.phase.title} (${hierarchy.phase.progress}% ${hierarchy.phase.status})`
      );
    }
    if (hierarchy.week) {
      hierarchyParts.push(
        `Week: ${hierarchy.week.title} (${hierarchy.week.progress}% ${hierarchy.week.status})`
      );
    }
    if (hierarchy.day) {
      hierarchyParts.push(
        `Day: ${hierarchy.day.title} (${hierarchy.day.progress}% ${hierarchy.day.status})`
      );
    }
    if (hierarchy.task) {
      hierarchyParts.push(
        `Task: ${hierarchy.task.title} (${hierarchy.task.progress}% ${hierarchy.task.status})`
      );
    }

    logger.info('[sprint.updateProgress] Progress updated successfully', {
      entityType: updated.type,
      newProgress: updated.progress,
      affectedParents: hierarchyParts.length,
    });

    return JSON.stringify(
      {
        status: 'success',
        updated: {
          type: updated.type,
          id: updated.id,
          title: updated.title,
          progress: `${updated.progress}%`,
          status: updated.status,
        },
        propagation: {
          message: `Progress propagated to ${hierarchyParts.length} parent entity/entities`,
          hierarchy: hierarchyParts.length > 0 ? hierarchyParts : ['No parent entities to update'],
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
