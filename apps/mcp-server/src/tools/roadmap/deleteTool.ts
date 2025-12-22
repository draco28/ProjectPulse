/**
 * Roadmap Delete MCP Tool
 *
 * Sprint 14 - Ticket #35
 * Created: 2025-12-22
 *
 * Enables agents to delete existing roadmaps and all materialized hierarchy.
 * Cascade deletes: Roadmap → Phases → Sprints → Weeks → Days
 *
 * This tool wraps DELETE /api/roadmap/[id] to provide agent access.
 */

import { z } from 'zod';
import type { ToolContext } from '../types.js';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const deleteRoadmapSchema = z.object({
  roadmapId: z.string().min(1).describe('Roadmap ID to delete (cuid format)'),
  projectId: z.number().int().positive().describe('Project ID for authorization verification'),
});

// ============================================================================
// MCP TOOL DEFINITION
// ============================================================================

export const roadmapDeleteTool = {
  name: 'projectpulse_roadmap_delete',
  description: `[ACTION] Delete an existing roadmap and all its materialized hierarchy.

Use this tool when:
- Need to replace an existing roadmap with a new one
- Cleaning up test/dummy roadmaps
- Resetting project planning state

CASCADE DELETE: This permanently removes:
- The roadmap record
- All materialized Phases
- All Sprints under those phases
- All Weeks under those sprints
- All Days under those weeks

After deletion, you can create a new roadmap with projectpulse_roadmap_create.

WORKFLOW:
1. Get roadmap ID from projectpulse_context_load or database
2. Call this tool with roadmapId and projectId
3. Create new roadmap with projectpulse_roadmap_create

WARNING: This action cannot be undone!`,

  schema: deleteRoadmapSchema,

  inputSchema: {
    type: 'object' as const,
    properties: {
      roadmapId: {
        type: 'string' as const,
        description: 'Roadmap ID to delete (cuid format)',
      },
      projectId: {
        type: 'number' as const,
        description: 'Project ID for authorization verification',
      },
    },
    required: ['roadmapId', 'projectId'],
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = deleteRoadmapSchema.parse(params);

    try {
      context.logger.info('Deleting roadmap', {
        roadmapId: validated.roadmapId,
        projectId: validated.projectId,
      });

      // Call DELETE /api/roadmap/[id] using httpClient (includes auth header)
      await context.httpClient.delete<{
        success?: boolean;
        message?: string;
        error?: {
          code?: string;
          message?: string;
        };
      }>(`/api/roadmap/${validated.roadmapId}`);

      context.logger.info('Roadmap deleted successfully', {
        roadmapId: validated.roadmapId,
        projectId: validated.projectId,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message:
                  'Roadmap deleted successfully. All phases, sprints, weeks, and days have been cascade deleted.',
                deletedRoadmapId: validated.roadmapId,
                projectId: validated.projectId,
                hint: 'You can now create a new roadmap with projectpulse_roadmap_create.',
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('roadmap_delete failed', {
        error: errorMessage,
        roadmapId: validated.roadmapId,
        projectId: validated.projectId,
      });

      // Check for specific error types
      const isNotFound = errorMessage.includes('404') || errorMessage.includes('NOT_FOUND');
      const isAuthError =
        errorMessage.includes('401') ||
        errorMessage.includes('403') ||
        errorMessage.includes('UNAUTHORIZED');

      let hint = 'Check that the roadmap exists and you have access to this project.';
      if (isNotFound) {
        hint = 'The roadmap was not found. It may have already been deleted.';
      } else if (isAuthError) {
        hint = 'Authorization failed. Verify your agent token has access to this project.';
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: isNotFound ? 'NOT_FOUND' : isAuthError ? 'UNAUTHORIZED' : 'DELETION_FAILED',
                message: errorMessage,
                roadmapId: validated.roadmapId,
                projectId: validated.projectId,
                hint,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  },
};
