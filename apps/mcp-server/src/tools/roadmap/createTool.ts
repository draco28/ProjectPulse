/**
 * Roadmap Creation MCP Tool
 *
 * Sprint 9 - Roadmap UI Enhancement
 * Created: 2025-11-25
 *
 * Enables MCP client agents to create complete development roadmaps
 * with phases, sprints, and automatic materialization to database records.
 *
 * This tool wraps POST /api/roadmap to provide agent access to roadmap creation.
 *
 * @see .agent/task/roadmap-ui/ROADMAP-API-SPEC.md
 */

import { z } from 'zod';
import type { ToolContext } from '../types.js';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const sprintSchema = z.object({
  name: z.string().min(1).max(200).describe('Sprint name (e.g., "Sprint 1: Foundation")'),
  duration: z.string().optional().describe('Sprint duration (e.g., "2 weeks")'),
  weeks: z.string().optional().describe('Week range (e.g., "Weeks 1-2")'),
  goals: z.array(z.string()).default([]).describe('Sprint goals'),
  deliverables: z.array(z.string()).default([]).describe('Sprint deliverables'),
  storyPoints: z.number().int().positive().optional().describe('Estimated story points'),
});

const phaseSchema = z.object({
  title: z.string().min(1).max(200).describe('Phase title (e.g., "Phase 1: Foundation")'),
  description: z.string().max(2000).optional().describe('Phase description'),
  duration: z.string().optional().describe('Phase duration (e.g., "4 weeks")'),
  sprints: z.array(sprintSchema).min(1).describe('Sprints within this phase (at least 1)'),
});

const createRoadmapSchema = z.object({
  projectId: z.number().int().positive().describe('Project ID to create roadmap for'),
  title: z.string().min(1).max(200).describe('Roadmap title'),
  description: z.string().max(2000).optional().describe('Roadmap description'),
  startDate: z.string().describe('Start date in ISO 8601 format (e.g., "2025-01-01T00:00:00.000Z")'),
  phases: z.array(phaseSchema).min(1).describe('Phases array (at least 1 phase)'),
  materialize: z.boolean().default(true).describe('Auto-materialize to Phase/Sprint/Week/Day records (default: true)'),
});

// ============================================================================
// MCP TOOL DEFINITION
// ============================================================================

export const roadmapCreateTool = {
  name: 'projectpulse_roadmap_create',
  description: `Create a complete development roadmap with phases and sprints. Auto-materializes to database records.

Use this tool when:
- User wants to create a new project roadmap
- Agent needs to set up development phases and sprints
- Planning a multi-phase development cycle

The roadmap will be automatically materialized into Phase → Sprint → Week → Day records,
enabling progress tracking and navigation tools (getCurrentPosition, getPhaseProgress).

Note: Each project can only have ONE roadmap. If a roadmap already exists, this will fail.
Use the roadmap_materialize tool to re-materialize an existing roadmap.`,

  schema: createRoadmapSchema,

  inputSchema: {
    type: 'object' as const,
    properties: {
      projectId: {
        type: 'number' as const,
        description: 'Project ID to create roadmap for',
      },
      title: {
        type: 'string' as const,
        description: 'Roadmap title',
      },
      description: {
        type: 'string' as const,
        description: 'Roadmap description (optional)',
      },
      startDate: {
        type: 'string' as const,
        description: 'Start date in ISO 8601 format (e.g., "2025-01-01T00:00:00.000Z")',
      },
      phases: {
        type: 'array' as const,
        description: 'Phases array with sprints',
        items: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' as const, description: 'Phase title' },
            description: { type: 'string' as const, description: 'Phase description' },
            duration: { type: 'string' as const, description: 'Phase duration (e.g., "4 weeks")' },
            sprints: {
              type: 'array' as const,
              description: 'Sprints within this phase',
              items: {
                type: 'object' as const,
                properties: {
                  name: { type: 'string' as const, description: 'Sprint name' },
                  duration: { type: 'string' as const, description: 'Sprint duration' },
                  weeks: { type: 'string' as const, description: 'Week range' },
                  goals: { type: 'array' as const, items: { type: 'string' as const }, description: 'Sprint goals' },
                  deliverables: { type: 'array' as const, items: { type: 'string' as const }, description: 'Sprint deliverables' },
                },
                required: ['name'],
              },
            },
          },
          required: ['title', 'sprints'],
        },
      },
      materialize: {
        type: 'boolean' as const,
        default: true,
        description: 'Auto-materialize to Phase/Sprint/Week/Day records (default: true)',
      },
    },
    required: ['projectId', 'title', 'startDate', 'phases'],
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = createRoadmapSchema.parse(params);

    try {
      context.logger.info('Creating roadmap', { projectId: validated.projectId, title: validated.title });

      // Call POST /api/roadmap using httpClient (includes auth header)
      const result = await context.httpClient.post<{
        data?: {
          roadmap?: {
            id: string;
            currentPhase?: string;
            currentSprint?: string;
          };
          materialization?: unknown;
        };
        error?: {
          code?: string;
          message?: string;
          details?: unknown;
        };
      }>('/api/roadmap', {
        projectId: validated.projectId,
        title: validated.title,
        description: validated.description,
        startDate: validated.startDate,
        phases: validated.phases,
        materialize: validated.materialize,
      });

      // Success response
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: 'Roadmap created successfully',
                data: {
                  roadmapId: result.data?.roadmap?.id,
                  projectId: validated.projectId,
                  title: validated.title,
                  phasesCount: validated.phases.length,
                  sprintsCount: validated.phases.reduce((sum, p) => sum + p.sprints.length, 0),
                  currentPhase: result.data?.roadmap?.currentPhase,
                  currentSprint: result.data?.roadmap?.currentSprint,
                },
                materialization: result.data?.materialization || null,
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
      context.logger.error('roadmap_create failed', { error: errorMessage, projectId: validated.projectId });

      // Check for specific error types
      const isAuthError = errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('UNAUTHORIZED');
      
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: isAuthError ? 'UNAUTHORIZED' : 'API_ERROR',
                message: errorMessage,
                projectId: validated.projectId,
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
