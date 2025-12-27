/**
 * Get Current Position Tool
 *
 * Sprint 15: Updated for 2-level hierarchy (Phase → Sprint)
 * Week/Day models removed (Ticket #80)
 *
 * Returns agent's current position in 2-level hierarchy with 1 query
 * Query: Latest IN_PROGRESS sprint with phase parent
 * Returns: Full hierarchy breadcrumb (Phase → Sprint)
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

/**
 * Current position in hierarchy (Sprint 15: 2-level)
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
    sprintNumber: number;
    title: string;
    status: string;
    progress: number;
  } | null;
  message?: string;
}

// ============================================================================
// MCP TOOL DEFINITION
// ============================================================================

const getCurrentPositionSchema = z.object({
  projectId: z.number().int().positive(),
});

type GetCurrentPositionInput = z.infer<typeof getCurrentPositionSchema>;

/**
 * MCP Tool: projectpulse.sprint.getCurrentPosition
 *
 * Sprint 15: Updated for 2-level hierarchy (Phase → Sprint)
 * Get agent's current position in development hierarchy
 */
export const getCurrentPositionTool: ToolDefinition = {
  name: 'projectpulse_sprint_getCurrentPosition',
  description: 'Get current position in development hierarchy (Phase → Sprint) in 1 query. Sprint 15: Week/Day models removed for Kanban-based UI.',
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

      // Sprint 15: Query for active sprint directly (no week/day)
      const sprintResponse = await context.httpClient.get<{
        data?: {
          entities: Array<{
            id: string;
            sprintNumber?: number;
            title: string;
            status: string;
            progress: number;
            phase?: {
              id: string;
              title: string;
              status: string;
              progress: number;
            };
          }>;
        };
      }>(`/api/hierarchy/query?level=sprint&status=IN_PROGRESS&limit=1`);

      // Build position from sprint data
      const position: CurrentPosition = {
        phase: null,
        sprint: null,
      };

      if (sprintResponse.data?.entities?.[0]) {
        const sprint = sprintResponse.data.entities[0];
        position.sprint = {
          id: sprint.id,
          sprintNumber: sprint.sprintNumber ?? 0,
          title: sprint.title,
          status: sprint.status,
          progress: sprint.progress,
        };

        if (sprint.phase) {
          position.phase = {
            id: sprint.phase.id,
            title: sprint.phase.title,
            status: sprint.phase.status,
            progress: sprint.phase.progress,
          };
        }
      } else {
        // Try to find the first NOT_STARTED sprint if none is IN_PROGRESS
        const firstSprintResponse = await context.httpClient.get<{
          data?: {
            entities: Array<{
              id: string;
              sprintNumber?: number;
              title: string;
              status: string;
              progress: number;
              phase?: {
                id: string;
                title: string;
                status: string;
                progress: number;
              };
            }>;
          };
        }>(`/api/hierarchy/query?level=sprint&status=NOT_STARTED&limit=1`);

        if (firstSprintResponse.data?.entities?.[0]) {
          const sprint = firstSprintResponse.data.entities[0];
          position.sprint = {
            id: sprint.id,
            sprintNumber: sprint.sprintNumber ?? 0,
            title: sprint.title,
            status: sprint.status,
            progress: sprint.progress,
          };

          if (sprint.phase) {
            position.phase = {
              id: sprint.phase.id,
              title: sprint.phase.title,
              status: sprint.phase.status,
              progress: sprint.phase.progress,
            };
          }
          position.message = 'No sprint is IN_PROGRESS. Showing first NOT_STARTED sprint.';
        } else {
          position.message = 'No roadmap found or no sprints exist. Create a roadmap first.';
        }
      }

      context.logger.info('Current position retrieved', {
        projectId: validated.projectId,
        hasSprint: !!position.sprint,
        phase: position.phase?.title,
        sprintNumber: position.sprint?.sprintNumber,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(position, null, 2),
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
