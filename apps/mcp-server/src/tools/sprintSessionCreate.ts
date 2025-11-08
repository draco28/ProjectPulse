/**
 * MCP Tool: sprint.session.create
 *
 * Purpose: Create a new session within a task
 *
 * Use Case: Agent invokes when user says "Start a new coding session for task X"
 *
 * Pattern: Zod schema → HTTP API call → Prisma create
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from './types.js';

// ============================================================================
// INPUT SCHEMA
// ============================================================================

const sprintSessionCreateSchema = z.object({
  taskId: z.string()
    .uuid('taskId must be a valid UUID'),

  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),

  description: z.string().optional(),

  startDate: z.string()
    .refine(
      (date) => !isNaN(Date.parse(date)),
      'Start date must be valid ISO 8601 date format'
    ),

  endDate: z.string()
    .refine(
      (date) => !isNaN(Date.parse(date)),
      'End date must be valid ISO 8601 date format'
    )
    .optional(),

  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED'])
    .default('NOT_STARTED'),

  progress: z.number()
    .int()
    .min(0)
    .max(100)
    .default(0),

  notes: z.string().optional(),
});

type SprintSessionCreateInput = z.infer<typeof sprintSessionCreateSchema>;

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

interface SessionCreateData {
  session: {
    id: string;
    title: string;
    description?: string;
    status: string;
    progress: number;
    startDate: string;
    endDate?: string | null;
    notes?: string | null;
  };
  context: {
    task: { id: string; title: string };
    day: { id: string; title: string } | null;
    week: { id: string; title: string } | null;
    phase: { id: string; title: string } | null;
  };
}

// ============================================================================
// TOOL HANDLER
// ============================================================================

async function handler(
  input: SprintSessionCreateInput,
  context: ToolContext
): Promise<string> {
  const { logger, httpClient, config } = context;

  try {
    const url = `${config.PROJECTPULSE_API_URL}/api/sessions`;

    logger.info('[sprint.session.create] Calling POST /api/sessions', {
      taskId: input.taskId,
      title: input.title,
    });

    const response = await httpClient.post<ApiResponse<SessionCreateData>>(url, {
      taskId: input.taskId,
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status,
      progress: input.progress,
      notes: input.notes,
    });

    if (!response.success || !response.data) {
      logger.error('[sprint.session.create] API returned error', {
        error: response.error,
      });

      return JSON.stringify(
        {
          status: 'error',
          error: response.error?.message || 'Failed to create session',
          code: response.error?.code || 'UNKNOWN_ERROR',
        },
        null,
        2
      );
    }

    const { session, context: ctx } = response.data;

    logger.info('[sprint.session.create] Session created successfully', {
      sessionId: session.id,
      title: session.title,
    });

    return JSON.stringify(
      {
        status: 'success',
        session: {
          id: session.id,
          title: session.title,
          description: session.description || null,
          status: session.status,
          progress: `${session.progress}%`,
          startDate: session.startDate,
          endDate: session.endDate || null,
          notes: session.notes || null,
        },
        hierarchy: {
          task: `${ctx.task.title} (${ctx.task.id})`,
          day: ctx.day ? `${ctx.day.title} (${ctx.day.id})` : null,
          week: ctx.week ? `${ctx.week.title} (${ctx.week.id})` : null,
          phase: ctx.phase ? `${ctx.phase.title} (${ctx.phase.id})` : null,
        },
      },
      null,
      2
    );
  } catch (error) {
    logger.error('[sprint.session.create] Unexpected error', { error });

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

export const sprintSessionCreateTool: ToolDefinition = {
  name: 'projectpulse.sprint.session.create',

  description: `Create a new work session within a task. Sessions are the most granular unit of work tracking.

  Use this tool when:
  - User says "Start a new coding session"
  - User wants to log time spent on a task
  - Tracking work breakdown within a task

  Returns created session with full hierarchical context (task → day → week → phase).`,

  schema: sprintSessionCreateSchema,

  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        format: 'uuid',
        description: 'UUID of the task to create session in',
      },
      title: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        description: 'Session title (1-200 characters)',
      },
      description: {
        type: 'string',
        description: 'Optional session description',
      },
      startDate: {
        type: 'string',
        format: 'date-time',
        description: 'Session start date (ISO 8601 format)',
      },
      endDate: {
        type: 'string',
        format: 'date-time',
        description: 'Optional session end date (ISO 8601 format)',
      },
      status: {
        type: 'string',
        enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED'],
        default: 'NOT_STARTED',
        description: 'Session status',
      },
      progress: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        default: 0,
        description: 'Session progress (0-100)',
      },
      notes: {
        type: 'string',
        description: 'Optional session notes',
      },
    },
    required: ['taskId', 'title', 'startDate'],
  },

  execute: async (params: unknown, context: ToolContext) => {
    const result = await handler(params as SprintSessionCreateInput, context);

    context.logger.info('[sprint.session.create] Tool execution complete', {
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
