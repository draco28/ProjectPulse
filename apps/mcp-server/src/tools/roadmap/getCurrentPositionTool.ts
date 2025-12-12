/**
 * Get Current Position Tool
 *
 * Sprint 12: Updated for 4-level hierarchy (Phase → Sprint → Week → Day)
 * Task model removed - Days are now leaf nodes
 *
 * Returns agent's current position in 4-level hierarchy with 1 query
 * Query: Latest IN_PROGRESS day with nested includes
 * Returns: Full hierarchy breadcrumb (Phase → Sprint → Week → Day)
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

/**
 * Current position in hierarchy (Sprint 12: 4-level)
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
 * Sprint 12: Updated for 4-level hierarchy
 * Get agent's current position in development hierarchy
 */
export const getCurrentPositionTool: ToolDefinition = {
  name: 'projectpulse_sprint_getCurrentPosition',
  description: 'Get current position in development hierarchy (Phase → Sprint → Week → Day) in 1 query. Sprint 12: Task model removed, Days are now leaf nodes.',
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

      // Query the API for current roadmap position
      // Sprint 12: This now queries the roadmap's currentDay/currentWeek/currentSprint/currentPhase
      const response = await context.httpClient.get<{
        roadmap: {
          id: string;
          currentPhase: string | null;
          currentSprint: string | null;
          currentWeek: string | null;
          currentDay: string | null;
        } | null;
        phase: { id: string; title: string; status: string; progress: number } | null;
        sprint: { id: string; title: string; status: string; progress: number } | null;
        week: { id: string; title: string; status: string; progress: number } | null;
        day: { id: string; title: string; status: string; progress: number } | null;
        message?: string;
      }>(`/api/roadmap?projectId=${validated.projectId}`);

      // Build position from roadmap data
      const position: CurrentPosition = {
        phase: null,
        sprint: null,
        week: null,
        day: null,
      };

      // If we have a roadmap, query for the active day
      if (response.roadmap) {
        // Query for IN_PROGRESS day in this project's roadmap
        const dayResponse = await context.httpClient.get<{
          data?: {
            entities: Array<{
              id: string;
              title: string;
              status: string;
              progress: number;
              week?: {
                id: string;
                title: string;
                status: string;
                progress: number;
                sprint?: {
                  id: string;
                  title: string;
                  status: string;
                  progress: number;
                  phase?: {
                    id: string;
                    title: string;
                    status: string;
                    progress: number;
                  };
                };
              };
            }>;
          };
        }>(`/api/hierarchy/query?level=day&status=IN_PROGRESS&limit=1`);

        if (dayResponse.data?.entities?.[0]) {
          const day = dayResponse.data.entities[0];
          position.day = {
            id: day.id,
            title: day.title,
            status: day.status,
            progress: day.progress,
          };

          if (day.week) {
            position.week = {
              id: day.week.id,
              title: day.week.title,
              status: day.week.status,
              progress: day.week.progress,
            };

            if (day.week.sprint) {
              position.sprint = {
                id: day.week.sprint.id,
                title: day.week.sprint.title,
                status: day.week.sprint.status,
                progress: day.week.sprint.progress,
              };

              if (day.week.sprint.phase) {
                position.phase = {
                  id: day.week.sprint.phase.id,
                  title: day.week.sprint.phase.title,
                  status: day.week.sprint.phase.status,
                  progress: day.week.sprint.phase.progress,
                };
              }
            }
          }
        } else {
          position.message = 'No active day found. Set a day to IN_PROGRESS to track position.';
        }
      } else {
        position.message = 'No roadmap found for this project. Create a roadmap first.';
      }

      context.logger.info('Current position retrieved', {
        projectId: validated.projectId,
        hasDay: !!position.day,
        phase: position.phase?.title,
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
