/**
 * MCP Tool: sprint.phase.create
 *
 * Purpose: Create a new sprint phase with automatic child week generation
 *
 * Use Case: Agent invokes when user says "Create Phase 2: API Development
 * starting next Monday for 4 weeks"
 *
 * Pattern: Zod schema → HTTP API call → Prisma nested write
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from './types.js';

// ============================================================================
// INPUT SCHEMA
// ============================================================================

const sprintPhaseCreateSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),

  description: z.string().optional(),

  startDate: z.string()
    .refine(
      (date) => !isNaN(Date.parse(date)),
      'Start date must be valid ISO 8601 date format'
    ),

  durationWeeks: z.number()
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1 week')
    .max(52, 'Duration cannot exceed 52 weeks')
    .default(4),

  goals: z.array(z.string())
    .optional()
    .default([]),
});

type SprintPhaseCreateInput = z.infer<typeof sprintPhaseCreateSchema>;

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

interface PhaseCreateData {
  phase: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    status: string;
    progress: number;
  };
  weeks: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate: string;
  }>;
}

// ============================================================================
// TOOL HANDLER
// ============================================================================

/**
 * Handler for sprint.phase.create tool
 *
 * Flow:
 * 1. Calculate end date from startDate + durationWeeks
 * 2. Build API request payload
 * 3. Call POST /api/phases (Next.js API)
 * 4. Format response for MCP client
 */
async function handler(
  input: SprintPhaseCreateInput,
  context: ToolContext
): Promise<string> {
  try {
    // 1. Calculate end date
    const startDate = new Date(input.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (input.durationWeeks * 7));

    // 2. Build API request
    const requestBody = {
      title: input.title,
      description: input.description,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'NOT_STARTED',
      progress: 0,
    };

    // 3. Call Next.js API
    const response = await context.httpClient.post<ApiResponse<PhaseCreateData>>('/api/phases', requestBody);

    // 4. Format response for MCP
    if (response.success && response.data) {
      return JSON.stringify({
        message: `Phase "${input.title}" created successfully`,
        phase: {
          id: response.data.phase.id,
          title: response.data.phase.title,
          startDate: response.data.phase.startDate,
          endDate: response.data.phase.endDate,
          status: response.data.phase.status,
          progress: response.data.phase.progress,
        },
        weeks: {
          count: response.data.weeks.length,
          summary: response.data.weeks.map((week: { title: string; startDate: string; endDate: string }, index: number) => ({
            number: index + 1,
            title: week.title,
            dateRange: `${week.startDate} to ${week.endDate}`,
          })),
        },
        nextSteps: [
          'Use sprint.week.list to view all weeks',
          'Use sprint.day.create to add days to weeks',
          'Use sprint.task.create to add tasks to days',
        ],
      }, null, 2);
    } else {
      // API returned error
      throw new Error(response.error?.message || 'Unknown API error');
    }
  } catch (error) {
    // Error handling
    return JSON.stringify({
      error: 'Failed to create phase',
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Verify that startDate is valid ISO 8601 format and durationWeeks is between 1-52',
    }, null, 2);
  }
}

// ============================================================================
// TOOL DEFINITION
// ============================================================================

export const sprintPhaseCreateTool: ToolDefinition = {
  name: 'projectpulse.sprint.phase.create',
  description: 'Create a new sprint phase with automatic week generation. Weeks are auto-created based on durationWeeks (default: 4).',
  schema: sprintPhaseCreateSchema,
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Phase name (e.g., "Phase 2: API Development")',
      },
      description: {
        type: 'string',
        description: 'Optional detailed description of the phase goals',
      },
      startDate: {
        type: 'string',
        description: 'Phase start date (ISO 8601 format: "2025-11-10T00:00:00.000Z")',
      },
      durationWeeks: {
        type: 'number',
        description: 'Number of weeks for this phase (1-52, default: 4)',
        default: 4,
      },
      goals: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional array of phase goals/objectives',
      },
    },
    required: ['title', 'startDate'],
  },
  execute: async (params, context) => {
    const input = params as SprintPhaseCreateInput;
    const result = await handler(input, context);

    context.logger.info('Phase creation completed', {
      title: input.title,
      durationWeeks: input.durationWeeks,
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
