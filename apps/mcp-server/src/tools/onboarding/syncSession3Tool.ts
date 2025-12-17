/**
 * MCP Tool: projectpulse_onboarding_syncSession3
 *
 * Sprint 12: Sync Session 3 completion status
 *
 * Use this tool AFTER creating bootstrap artifacts via batch tools
 * to mark Session 3 as complete. It counts existing personas, skills,
 * workflows, and SOPs, then creates/updates the Session 3 record.
 *
 * When to use:
 * - After using batch create tools instead of bootstrap API
 * - When Session 3 shows "not started" but artifacts exist
 * - To fix onboarding status without re-running bootstrap
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

// ============================================================================
// INPUT SCHEMA
// ============================================================================

const syncSession3Schema = z.object({
  projectId: z
    .number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),
});

type SyncSession3Input = z.infer<typeof syncSession3Schema>;

// ============================================================================
// TOOL DEFINITION
// ============================================================================

export const syncSession3Tool: ToolDefinition = {
  name: 'projectpulse_onboarding_syncSession3',
  description: `Sync Session 3 (AI Workflow Bootstrap) completion status.

Use this tool AFTER creating bootstrap artifacts via batch tools to mark Session 3 as complete.
It counts existing personas, skills, workflows, and SOPs, then creates the Session 3 record.

When to use:
- After using batch create tools (personas, skills, workflows, SOPs) instead of bootstrap API
- When Session 3 shows "not started" but artifacts already exist
- To fix onboarding status without re-running bootstrap

This tool:
1. Counts all bootstrap artifacts for the project
2. Creates/updates OnboardingSession record for Session 3
3. Marks Session 3 as 'complete' in the web UI

Note: Requires at least one artifact (persona, skill, workflow, or SOP) to exist.`,

  schema: syncSession3Schema,

  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID to sync Session 3 for',
      },
    },
    required: ['projectId'],
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = syncSession3Schema.parse(params) as SyncSession3Input;

    try {
      context.logger.info('Syncing Session 3 status', {
        projectId: validated.projectId,
      });

      // Call sync API
      const response = (await context.httpClient.post('/api/onboarding/sync-session3', {
        projectId: validated.projectId,
      })) as {
        success: boolean;
        sessionId: number;
        sessionNumber: number;
        status: string;
        artifactCounts: {
          personas: number;
          skills: number;
          workflows: number;
          sops: number;
        };
        message: string;
      };

      context.logger.info('Session 3 synced successfully! ✅', {
        projectId: validated.projectId,
        sessionId: response.sessionId,
        artifactCounts: response.artifactCounts,
      });

      // Format response
      const result = {
        success: true,
        message: response.message,
        sessionId: response.sessionId,
        sessionNumber: 3,
        status: response.status,
        artifactCounts: response.artifactCounts,
        nextSteps: [
          '✅ Session 3 is now marked as complete',
          '✅ Web UI will show onboarding as finished',
          '✅ Visit /agents to see your agent personas',
          '✅ Visit /workflows to see workflow templates',
          '✅ Visit /sops to see SOPs',
        ],
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      context.logger.error('Failed to sync Session 3', {
        projectId: validated.projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
};
