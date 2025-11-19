/**
 * Get Current Position Tool - Sprint 8.5 Phase 1
 *
 * Returns agent's current position in 5-level hierarchy with 1 query
 * Replaces 5 sequential queries (80% token reduction, 70% latency reduction)
 *
 * Query: Latest IN_PROGRESS task with nested includes
 * Returns: Full hierarchy breadcrumb (Phase → Sprint → Week → Day → Task)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Current position in hierarchy
 */
export interface CurrentPosition {
  phase: {
    id: string;
    title: string;
    status: string;
    progress: number;
  } | null;
  sprint: {
    id: string;
    title: string;
    status: string;
    progress: number;
  } | null;
  week: {
    id: string;
    title: string;
    status: string;
    progress: number;
  } | null;
  day: {
    id: string;
    title: string;
    status: string;
    progress: number;
  } | null;
  task: {
    id: string;
    title: string;
    status: string;
    progress: number;
  } | null;
  message?: string;
}

/**
 * Get agent's current position in development hierarchy
 *
 * Algorithm:
 * 1. Query latest IN_PROGRESS task with full 5-level includes
 * 2. Extract hierarchy: day.week.sprint.phase
 * 3. Return breadcrumb structure
 *
 * @param projectId - Project ID to query
 * @returns Current position or null if no active task
 */
export async function getCurrentPosition(projectId: number): Promise<CurrentPosition> {
  // Query latest IN_PROGRESS task with full hierarchy
  const currentTask = await prisma.task.findFirst({
    where: {
      status: 'IN_PROGRESS',
      day: {
        week: {
          sprint: {
            phase: {
              roadmap: {
                projectId,
              },
            },
          },
        },
      },
    },
    include: {
      day: {
        include: {
          week: {
            include: {
              sprint: {
                include: {
                  phase: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // No active task found
  if (!currentTask) {
    return {
      phase: null,
      sprint: null,
      week: null,
      day: null,
      task: null,
      message: 'No active task found. Start working on a task first.',
    };
  }

  // Extract hierarchy from nested includes
  const day = currentTask.day;
  const week = day.week;
  const sprint = week.sprint;
  const phase = sprint?.phase || null;

  // Return full hierarchy breadcrumb
  return {
    phase: phase ? {
      id: phase.id,
      title: phase.title,
      status: phase.status,
      progress: phase.progress,
    } : null,
    sprint: sprint ? {
      id: sprint.id,
      title: sprint.title,
      status: sprint.status,
      progress: sprint.progress,
    } : null,
    week: {
      id: week.id,
      title: week.title,
      status: week.status,
      progress: week.progress,
    },
    day: {
      id: day.id,
      title: day.title,
      status: day.status,
      progress: day.progress,
    },
    task: {
      id: currentTask.id,
      title: currentTask.title,
      status: currentTask.status,
      progress: currentTask.progress,
    },
  };
}

// ============================================================================
// MCP TOOL DEFINITION
// ============================================================================

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types';

const getCurrentPositionSchema = z.object({
  projectId: z.number().int().positive(),
});

type GetCurrentPositionInput = z.infer<typeof getCurrentPositionSchema>;

/**
 * MCP Tool: projectpulse.sprint.getCurrentPosition
 *
 * Get agent's current position in 1 call (vs 5 sequential calls)
 * 80% token reduction, 70% latency reduction
 */
export const getCurrentPositionTool: ToolDefinition = {
  name: 'projectpulse_sprint_getCurrentPosition',
  description: 'Get current position in development hierarchy (Phase → Sprint → Week → Day → Task) in 1 query',
  schema: getCurrentPositionSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID',
      },
    },
    required: ['projectId'],
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = getCurrentPositionSchema.parse(params);
    
    try {
      context.logger.info('Getting current position', { projectId: validated.projectId });
      
      // Sprint 8.5 Phase 4: Follow MCP pattern (MCP server → Next.js API → Database)
      const response = await context.httpClient.get(
        `/api/roadmap/current-position?projectId=${validated.projectId}`
      ) as any;

      if (!response.task) {
        context.logger.info('No active task found', { projectId: validated.projectId });
      } else {
        context.logger.info('Current position retrieved', {
          projectId: validated.projectId,
          taskId: response.task.id,
          phase: response.phase?.title,
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Failed to get current position', {
        error: errorMessage,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Failed to get current position: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
