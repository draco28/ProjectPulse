/**
 * Get Current Position Tool
 *
 * Sprint 15: Updated for 2-level hierarchy (Phase → Sprint)
 * Sprint 15.1: Added globalSprintNumber for Kanban navigation
 *
 * Returns agent's current position in 2-level hierarchy with 1 query
 * Query: Uses /api/roadmap/overview which calculates globalSprintNumber
 * Returns: Full hierarchy breadcrumb (Phase → Sprint) with Kanban URL
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

/**
 * Current position in hierarchy (Sprint 15: 2-level, Sprint 15.1: with globalSprintNumber)
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
    globalSprintNumber: number; // Cross-phase number for Kanban navigation
    kanbanUrl: string; // "/roadmap/sprint/{globalSprintNumber}"
    title: string;
    status: string;
    progress: number;
  } | null;
  message?: string;
}

/**
 * Sprint data from roadmap overview response
 */
interface SprintOverview {
  id: string;
  sprintNumber: number;
  globalSprintNumber: number;
  title: string;
  status: string;
  progress: number;
}

/**
 * Phase data from roadmap overview response
 */
interface PhaseOverview {
  id: string;
  title: string;
  status: string;
  progress: number;
  sprints: SprintOverview[];
}

/**
 * Roadmap overview API response
 */
interface RoadmapOverviewResponse {
  success: boolean;
  data?: {
    projectId: number;
    roadmapId: string;
    title: string;
    phases: PhaseOverview[];
    currentPhaseId?: string;
    currentGlobalSprintNumber?: number;
  };
  error?: {
    code: string;
    message: string;
  };
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
 * Sprint 15.1: Added globalSprintNumber for Kanban navigation
 * Get agent's current position in development hierarchy
 */
export const getCurrentPositionTool: ToolDefinition = {
  name: 'projectpulse_sprint_getCurrentPosition',
  description:
    'Get current position in development hierarchy (Phase → Sprint). Returns globalSprintNumber for Kanban board navigation (/roadmap/sprint/X). Sprint 15: 2-level hierarchy.',
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

      // Sprint 15.1: Use roadmap overview API which already calculates globalSprintNumber
      const overviewResponse = await context.httpClient.get<RoadmapOverviewResponse>(
        `/api/roadmap/overview?projectId=${validated.projectId}`
      );

      // Build position from overview data
      const position: CurrentPosition = {
        phase: null,
        sprint: null,
      };

      // Handle no roadmap case
      if (!overviewResponse.success || !overviewResponse.data) {
        position.message =
          overviewResponse.error?.message ||
          'No roadmap found or no sprints exist. Create a roadmap first.';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(position, null, 2),
            },
          ],
        };
      }

      const { phases, currentGlobalSprintNumber } = overviewResponse.data;

      // Find the current sprint using the same logic as the overview API:
      // 1. First IN_PROGRESS sprint
      // 2. Fallback: First NOT_STARTED sprint
      // 3. Fallback: First sprint overall
      let foundSprint: SprintOverview | null = null;
      let foundPhase: PhaseOverview | null = null;
      let fallbackMessage: string | undefined;

      // Strategy 1: Use currentGlobalSprintNumber from overview if available
      if (currentGlobalSprintNumber) {
        for (const phase of phases) {
          const sprint = phase.sprints.find(
            (s) => s.globalSprintNumber === currentGlobalSprintNumber
          );
          if (sprint) {
            foundSprint = sprint;
            foundPhase = phase;
            break;
          }
        }
      }

      // Strategy 2: Find first IN_PROGRESS sprint
      if (!foundSprint) {
        for (const phase of phases) {
          const sprint = phase.sprints.find((s) => s.status === 'IN_PROGRESS');
          if (sprint) {
            foundSprint = sprint;
            foundPhase = phase;
            break;
          }
        }
      }

      // Strategy 3: Find first NOT_STARTED sprint
      if (!foundSprint) {
        for (const phase of phases) {
          const sprint = phase.sprints.find((s) => s.status === 'NOT_STARTED');
          if (sprint) {
            foundSprint = sprint;
            foundPhase = phase;
            fallbackMessage = 'No sprint is IN_PROGRESS. Showing first NOT_STARTED sprint.';
            break;
          }
        }
      }

      // Strategy 4: Just get the first sprint
      if (!foundSprint && phases.length > 0) {
        const firstPhase = phases[0];
        if (firstPhase && firstPhase.sprints.length > 0) {
          const firstSprint = firstPhase.sprints[0];
          if (firstSprint) {
            foundPhase = firstPhase;
            foundSprint = firstSprint;
            fallbackMessage = 'All sprints are COMPLETED. Showing first sprint.';
          }
        }
      }

      // Build position response
      if (foundSprint && foundPhase) {
        position.sprint = {
          id: foundSprint.id,
          sprintNumber: foundSprint.sprintNumber,
          globalSprintNumber: foundSprint.globalSprintNumber,
          kanbanUrl: `/roadmap/sprint/${foundSprint.globalSprintNumber}`,
          title: foundSprint.title,
          status: foundSprint.status,
          progress: foundSprint.progress,
        };

        position.phase = {
          id: foundPhase.id,
          title: foundPhase.title,
          status: foundPhase.status,
          progress: foundPhase.progress,
        };

        if (fallbackMessage) {
          position.message = fallbackMessage;
        }
      } else {
        position.message = 'No sprints found in roadmap. Add sprints to phases first.';
      }

      context.logger.info('Current position retrieved', {
        projectId: validated.projectId,
        hasSprint: !!position.sprint,
        phase: position.phase?.title,
        sprintNumber: position.sprint?.sprintNumber,
        globalSprintNumber: position.sprint?.globalSprintNumber,
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
