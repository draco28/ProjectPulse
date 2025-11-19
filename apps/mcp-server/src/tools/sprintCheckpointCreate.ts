/**
 * MCP Tool: sprint.checkpoint.create
 *
 * Purpose: Create a checkpoint to save agent progress every 15K tokens
 *
 * Use Case: Agent invokes automatically every 15K tokens or when context compaction is near
 *
 * Pattern: Zod schema → HTTP API call → Prisma create
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from './types.js';

// ============================================================================
// INPUT SCHEMA
// ============================================================================

const sessionContextSchema = z.object({
  taskId: z.string().optional(),
  taskTitle: z.string().optional(),
  dayId: z.string().optional(),
  dayTitle: z.string().optional(),
  completionPercentage: z.number().optional(),
  checkpointCount: z.number().optional(),
  filesModified: z.array(z.string()).optional(),
  filesCreated: z.array(z.string()).optional(),
  endpointsImplemented: z.array(z.string()).optional(),
  uncommittedChanges: z.boolean().optional(),
  currentBranch: z.string().optional(),
  tokenBudgetRemaining: z.number().optional(),
}).strict();

const sprintCheckpointCreateSchema = z.object({
  sessionId: z.string()
    .uuid('sessionId must be a valid UUID'),

  notes: z.string()
    .min(1, 'Notes cannot be empty')
    .max(5000, 'Notes must be at most 5000 characters'),

  tokenUsage: z.number()
    .int('Token usage must be an integer')
    .min(0, 'Token usage cannot be negative')
    .max(200000, 'Token usage exceeds maximum (200K)'),

  sessionContext: sessionContextSchema.optional(),
});

type SprintCheckpointCreateInput = z.infer<typeof sprintCheckpointCreateSchema>;

// API Response Types
interface ApiResponse<T> {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
}

interface CheckpointData {
  id: string;
  sessionId: string;
  notes: string;
  tokenUsage: number;
  sessionContext: Record<string, unknown> | null;
  checkpointNumber: number;
  createdAt: string;
}

// ============================================================================
// TOOL HANDLER
// ============================================================================

async function handler(
  input: SprintCheckpointCreateInput,
  context: ToolContext
): Promise<string> {
  const { logger, httpClient, config } = context;

  try {
    const url = `${config.apiBaseUrl}/api/checkpoints`;

    logger.info('[sprint.checkpoint.create] Calling POST /api/checkpoints', {
      sessionId: input.sessionId,
      tokenUsage: input.tokenUsage,
      hasContext: !!input.sessionContext,
    });

    const response = await httpClient.post<ApiResponse<CheckpointData>>(url, {
      sessionId: input.sessionId,
      notes: input.notes,
      tokenUsage: input.tokenUsage,
      sessionContext: input.sessionContext,
    });

    if (response.error || !response.data) {
      logger.error('[sprint.checkpoint.create] API returned error', {
        error: response.error,
      });

      return JSON.stringify(
        {
          status: 'error',
          error: response.error?.message || 'Failed to create checkpoint',
          code: response.error?.code || 'UNKNOWN_ERROR',
        },
        null,
        2
      );
    }

    const checkpoint = response.data;

    logger.info('[sprint.checkpoint.create] Checkpoint created successfully', {
      checkpointId: checkpoint.id,
      checkpointNumber: checkpoint.checkpointNumber,
    });

    return JSON.stringify(
      {
        status: 'success',
        checkpoint: {
          id: checkpoint.id,
          checkpointNumber: checkpoint.checkpointNumber,
          sessionId: checkpoint.sessionId,
          tokenUsage: checkpoint.tokenUsage,
          createdAt: checkpoint.createdAt,
        },
        message: `Checkpoint #${checkpoint.checkpointNumber} created successfully`,
        nextCheckpoint: `Create next checkpoint at ${checkpoint.tokenUsage + 15000} tokens`,
      },
      null,
      2
    );
  } catch (error) {
    logger.error('[sprint.checkpoint.create] Unexpected error', { error });

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

export const sprintCheckpointCreateTool: ToolDefinition = {
  name: 'projectpulse_sprint_checkpoint_create',

  description: `Create a checkpoint to save agent progress every 15K tokens.

  Use this tool when:
  - Token usage reaches 15K, 30K, 45K, 60K, 75K, 90K milestones
  - Before context compaction or session interruption
  - At major implementation milestones (component complete, tests passing)

  Checkpoints enable context recovery after compaction or session restart.
  Sequential numbering per session enables chronological checkpoint ordering.`,

  schema: sprintCheckpointCreateSchema,

  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        format: 'uuid',
        description: 'UUID of the session to attach checkpoint to',
      },
      notes: {
        type: 'string',
        minLength: 1,
        maxLength: 5000,
        description: 'Checkpoint notes describing current progress (1-5000 characters)',
      },
      tokenUsage: {
        type: 'number',
        minimum: 0,
        maximum: 200000,
        description: 'Current token usage (0-200000)',
      },
      sessionContext: {
        type: 'object',
        description: 'Optional session context snapshot',
        properties: {
          taskId: { type: 'string' },
          taskTitle: { type: 'string' },
          dayId: { type: 'string' },
          dayTitle: { type: 'string' },
          completionPercentage: { type: 'number' },
          checkpointCount: { type: 'number' },
          filesModified: { type: 'array', items: { type: 'string' } },
          filesCreated: { type: 'array', items: { type: 'string' } },
          endpointsImplemented: { type: 'array', items: { type: 'string' } },
          uncommittedChanges: { type: 'boolean' },
          currentBranch: { type: 'string' },
          tokenBudgetRemaining: { type: 'number' },
        },
      },
    },
    required: ['sessionId', 'notes', 'tokenUsage'],
  },

  execute: async (params: unknown, context: ToolContext) => {
    const result = await handler(params as SprintCheckpointCreateInput, context);

    context.logger.info('[sprint.checkpoint.create] Tool execution complete', {
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
