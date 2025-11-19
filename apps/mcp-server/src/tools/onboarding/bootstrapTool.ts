/**
 * MCP Tool: projectpulse.onboarding.bootstrap
 * 
 * Sprint 8.6 Phase 3 - Session 3 Bootstrap Tool (Template-Based)
 * 
 * Complete Session 3 onboarding: AI workflow bootstrap
 * 
 * Creates:
 * - Agent personas (3-5 based on tech stack detection)
 * - Skills library (5-10 based on frameworks)
 * - Workflow templates (3 static templates)
 * - SOPs (5 static SOPs)
 * - Roadmap materialization (from 13-Project-Plan.md)
 * - CurrentPlan & CurrentTodos (initial state)
 * - CLAUDE.md & AGENTS.md (written to user's repo)
 * 
 * Prerequisites: Sessions 1 & 2 must be complete
 * Architecture: Template-based (NO AI generation)
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

// ============================================================================
// INPUT SCHEMA
// ============================================================================

const bootstrapSchema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),
  repoPath: z.string()
    .min(1, 'Repository path is required')
    .max(500, 'Repository path too long')
    .describe('Absolute path to user\'s repository (where CLAUDE.md and AGENTS.md will be written)')
});

type BootstrapInput = z.infer<typeof bootstrapSchema>;

// ============================================================================
// TOOL DEFINITION
// ============================================================================

export const bootstrapTool: ToolDefinition = {
  name: 'projectpulse_onboarding_bootstrap',
  description: `Complete Session 3 onboarding: AI workflow bootstrap.

Creates all project-specific AI workflow artifacts:
- Agent personas (3-5 experts based on tech stack)
- Skills library (5-10 skills based on frameworks detected)
- Workflow templates (3 standard workflows)
- SOPs (5 standard operating procedures)
- Roadmap materialization (Phase → Sprint → Week → Day hierarchy)
- CurrentPlan & CurrentTodos (initial state for first day)
- CLAUDE.md & AGENTS.md (written to user's repository)

Prerequisites:
- Session 1 complete (executive summary + project-context.json)
- Session 2 complete (15 documents including 13-Project-Plan.md)

Architecture:
- Template-based (NO AI generation)
- Tech stack detection via if/else logic
- Pre-defined persona/skill templates
- Static workflow/SOP templates`,
  schema: bootstrapSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID'
      },
      repoPath: {
        type: 'string',
        description: 'Absolute path to user\'s repository (where CLAUDE.md and AGENTS.md will be written)'
      }
    },
    required: ['projectId', 'repoPath']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = bootstrapSchema.parse(params);
    
    try {
      context.logger.info('Starting Session 3 bootstrap', {
        projectId: validated.projectId,
        repoPath: validated.repoPath
      });
      
      // Call bootstrap API
      const response = await context.httpClient.post(
        '/api/onboarding/bootstrap',
        {
          projectId: validated.projectId,
          repoPath: validated.repoPath
        }
      ) as any;
      
      context.logger.info('Session 3 bootstrap complete! ✅', {
        projectId: validated.projectId,
        agentPersonas: response.created?.agentPersonas,
        skills: response.created?.skills,
        workflows: response.created?.workflows,
        sops: response.created?.sops,
        roadmapId: response.created?.roadmap?.id,
        roadmapStats: response.created?.roadmap
      });
      
      // Format response with next steps
      const result = {
        success: true,
        message: 'Session 3 complete! Your project is fully configured for AI-assisted development.',
        session3Complete: true,
        sessionId: response.sessionId,
        created: {
          agentPersonas: response.created.agentPersonas,
          skills: response.created.skills,
          workflows: response.created.workflows,
          sops: response.created.sops,
          roadmap: {
            id: response.created.roadmap.id,
            phases: response.created.roadmap.phases,
            sprints: response.created.roadmap.sprints,
            weeks: response.created.roadmap.weeks,
            days: response.created.roadmap.days
          },
          currentPlan: response.created.currentPlan,
          currentTodos: response.created.currentTodos,
          files: {
            claudeMd: response.created.files.claudeMd,
            agentsMd: response.created.files.agentsMd
          }
        },
        nextSteps: [
          '✅ Visit /roadmap to see your full development plan',
          '✅ Visit /agents to see available expert personas',
          '✅ Visit /workflows to see workflow templates',
          '✅ Visit /sops to see standard operating procedures',
          '✅ Read CLAUDE.md and AGENTS.md in your repository',
          '✅ Begin development with ProjectPulse tracking!'
        ]
      };
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
      
    } catch (error) {
      context.logger.error('Failed to bootstrap project', {
        projectId: validated.projectId,
        repoPath: validated.repoPath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
};
