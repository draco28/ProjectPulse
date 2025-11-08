/**
 * MCP Tool: sprint.task.create
 *
 * Purpose: Create a new task within a day
 *
 * Use Case: Agent invokes when user says "Create a task 'Implement feature X' for today"
 *
 * Pattern: Zod schema → HTTP API call → Prisma create
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from './types.js';

// ============================================================================
// INPUT SCHEMA
// ============================================================================

const sprintTaskCreateSchema = z.object({
  dayId: z.string()
    .uuid('dayId must be a valid UUID'),

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
    ),

  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED'])
    .default('NOT_STARTED'),

  progress: z.number()
    .int()
    .min(0)
    .max(100)
    .default(0),
});

type SprintTaskCreateInput = z.infer<typeof sprintTaskCreateSchema>;

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

interface TaskCreateData {
  task: {
    id: string;
    title: string;
    description?: string;
    status: string;
    progress: number;
    startDate: string;
    endDate: string;
  };
  context: {
    day: { id: string; title: string };
    week: { id: string; title: string } | null;
    phase: { id: string; title: string } | null;
  };
}

// ============================================================================
// TOOL HANDLER
// ============================================================================

async function handler(
  input: SprintTaskCreateInput,
  context: ToolContext
): Promise<string> {
  const { logger, httpClient, config } = context;

  try {
    const url = `${config.apiBaseUrl}/api/tasks`;

    logger.info('[sprint.task.create] Calling POST /api/tasks', {
      dayId: input.dayId,
      title: input.title,
    });

    const response = await httpClient.post<ApiResponse<TaskCreateData>>(url, {
      dayId: input.dayId,
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status,
      progress: input.progress,
    });

    if (!response.success || !response.data) {
      logger.error('[sprint.task.create] API returned error', {
        error: response.error,
      });

      return JSON.stringify(
        {
          status: 'error',
          error: response.error?.message || 'Failed to create task',
          code: response.error?.code || 'UNKNOWN_ERROR',
        },
        null,
        2
      );
    }

    const { task, context: ctx } = response.data;

    logger.info('[sprint.task.create] Task created successfully', {
      taskId: task.id,
      title: task.title,
    });

    return JSON.stringify(
      {
        status: 'success',
        task: {
          id: task.id,
          title: task.title,
          description: task.description || null,
          status: task.status,
          progress: `${task.progress}%`,
          startDate: task.startDate,
          endDate: task.endDate,
        },
        hierarchy: {
          day: `${ctx.day.title} (${ctx.day.id})`,
          week: ctx.week ? `${ctx.week.title} (${ctx.week.id})` : null,
          phase: ctx.phase ? `${ctx.phase.title} (${ctx.phase.id})` : null,
        },
      },
      null,
      2
    );
  } catch (error) {
    logger.error('[sprint.task.create] Unexpected error', { error });

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

export const sprintTaskCreateTool: ToolDefinition = {
  name: 'projectpulse.sprint.task.create',

  description: `Create a new task within a day. Tasks are the core work units in the sprint hierarchy.

  Use this tool when:
  - User says "Create a task for implementing feature X"
  - User wants to add a new work item to a specific day
  - Planning daily work breakdown

  Returns created task with full hierarchical context (day → week → phase).`,

  schema: sprintTaskCreateSchema,

  inputSchema: {
    type: 'object',
    properties: {
      dayId: {
        type: 'string',
        format: 'uuid',
        description: 'UUID of the day to create task in',
      },
      title: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        description: 'Task title (1-200 characters)',
      },
      description: {
        type: 'string',
        description: 'Optional task description',
      },
      startDate: {
        type: 'string',
        format: 'date-time',
        description: 'Task start date (ISO 8601 format)',
      },
      endDate: {
        type: 'string',
        format: 'date-time',
        description: 'Task end date (ISO 8601 format)',
      },
      status: {
        type: 'string',
        enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED'],
        default: 'NOT_STARTED',
        description: 'Task status',
      },
      progress: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        default: 0,
        description: 'Task progress (0-100)',
      },
    },
    required: ['dayId', 'title', 'startDate', 'endDate'],
  },

  execute: async (params: unknown, context: ToolContext) => {
    const result = await handler(params as SprintTaskCreateInput, context);

    context.logger.info('[sprint.task.create] Tool execution complete', {
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
