/**
 * MCP Tool: sprint.queryHierarchy
 *
 * Sprint 12: Updated for 4-level hierarchy (phase, sprint, week, day)
 * Task/Session models removed
 *
 * Purpose: Query hierarchy entities with filters (status, progress)
 *
 * Use Case: Agent invokes when user says "Find all blocked days" or "Show me weeks with low progress"
 *
 * Pattern: Zod schema → HTTP API call → Prisma query with filters
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from './types.js';

// ============================================================================
// INPUT SCHEMA
// ============================================================================

// Sprint 12: 4-level hierarchy (Task/Session removed)
const sprintQueryHierarchySchema = z.object({
  level: z.enum(['phase', 'sprint', 'week', 'day'], {
    description: 'Entity level to query',
  }),

  status: z.array(
    z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED'])
  ).optional()
    .describe('Filter by status (can provide multiple for OR logic)'),

  progressMin: z.number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .describe('Minimum progress threshold (0-100)'),

  progressMax: z.number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .describe('Maximum progress threshold (0-100)'),

  page: z.number()
    .int()
    .min(1)
    .default(1)
    .describe('Page number for pagination'),

  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe('Results per page (max 100)'),
}).refine(
  (data) => {
    // If both progress thresholds provided, min must be <= max
    if (data.progressMin !== undefined && data.progressMax !== undefined) {
      return data.progressMin <= data.progressMax;
    }
    return true;
  },
  {
    message: 'progressMin must be less than or equal to progressMax',
  }
);

type SprintQueryHierarchyInput = z.infer<typeof sprintQueryHierarchySchema>;

// API Response Types
interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

interface QueryResultData {
  entities: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// TOOL HANDLER
// ============================================================================

async function handler(
  input: SprintQueryHierarchyInput,
  context: ToolContext
): Promise<string> {
  const { logger, httpClient, config } = context;

  try {
    // Build query parameters
    const params = new URLSearchParams({
      level: input.level,
      page: input.page.toString(),
      limit: input.limit.toString(),
    });

    // Add status filters (can be multiple)
    if (input.status && input.status.length > 0) {
      input.status.forEach((status) => params.append('status', status));
    }

    // Add progress filters
    if (input.progressMin !== undefined) {
      params.append('progressMin', input.progressMin.toString());
    }
    if (input.progressMax !== undefined) {
      params.append('progressMax', input.progressMax.toString());
    }

    const url = `${config.apiBaseUrl}/api/hierarchy/query?${params.toString()}`;

    logger.info('[sprint.queryHierarchy] Calling GET /api/hierarchy/query', {
      level: input.level,
      filters: {
        status: input.status,
        progressMin: input.progressMin,
        progressMax: input.progressMax,
      },
      pagination: { page: input.page, limit: input.limit },
    });

    const response = await httpClient.get<ApiResponse<QueryResultData>>(url);

    if (!response.data) {
      logger.error('[sprint.queryHierarchy] API returned error', {
        error: response.error,
      });

      return JSON.stringify(
        {
          status: 'error',
          error: response.error?.message || 'Failed to query hierarchy',
          code: response.error?.code || 'UNKNOWN_ERROR',
        },
        null,
        2
      );
    }

    const { entities, pagination } = response.data;

    logger.info('[sprint.queryHierarchy] Query successful', {
      level: input.level,
      resultCount: entities.length,
      total: pagination.total,
    });

    return JSON.stringify(
      {
        status: 'success',
        query: {
          level: input.level,
          filters: {
            status: input.status || null,
            progressRange: input.progressMin !== undefined || input.progressMax !== undefined
              ? { min: input.progressMin ?? 0, max: input.progressMax ?? 100 }
              : null,
          },
        },
        results: entities,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          totalPages: pagination.totalPages,
          hasMore: pagination.page < pagination.totalPages,
        },
      },
      null,
      2
    );
  } catch (error) {
    logger.error('[sprint.queryHierarchy] Unexpected error', { error });

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

export const sprintQueryHierarchyTool: ToolDefinition = {
  name: 'projectpulse_sprint_queryHierarchy',

  description: `Query hierarchy entities with filters (status, progress). Use for reporting and finding specific work items.

  Sprint 12: Updated for 4-level hierarchy. Task/Session models removed.

  Common use cases:
  - Find blocked or stuck work: level=day, status=BLOCKED, progressMax=30
  - Find completed items: level=sprint, status=COMPLETED
  - Find low-progress weeks: level=week, progressMin=0, progressMax=25
  - Find nearly complete phases: level=phase, progressMin=75, progressMax=99

  Returns paginated results with parent context (e.g., Day includes Week → Sprint → Phase).

  Note: Date range filtering deferred to Sprint 2 (full US-007 implementation).`,

  schema: sprintQueryHierarchySchema,

  inputSchema: {
    type: 'object',
    properties: {
      level: {
        type: 'string',
        enum: ['phase', 'sprint', 'week', 'day'],
        description: 'Entity level to query',
      },
      status: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED'],
        },
        description: 'Filter by status (can provide multiple for OR logic)',
      },
      progressMin: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Minimum progress threshold (0-100)',
      },
      progressMax: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Maximum progress threshold (0-100)',
      },
      page: {
        type: 'number',
        minimum: 1,
        default: 1,
        description: 'Page number for pagination',
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        default: 20,
        description: 'Results per page (max 100)',
      },
    },
    required: ['level'],
  },

  execute: async (params: unknown, context: ToolContext) => {
    const result = await handler(params as SprintQueryHierarchyInput, context);

    context.logger.info('[sprint.queryHierarchy] Tool execution complete', {
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
