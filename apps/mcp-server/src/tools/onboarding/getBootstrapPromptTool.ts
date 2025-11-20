/**
 * MCP Tool: projectpulse_onboarding_getBootstrapPrompt
 * 
 * Sprint 9 Refactor: NEW TOOL (replaces monolithic bootstrap)
 * 
 * Get prompt with instructions for parsing 13-Project-Plan.md to JSON hierarchy
 * Returns structured output schema and tech stack context for personas/skills
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const schema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive')
});

type GetBootstrapPromptInput = z.infer<typeof schema>;

export const getBootstrapPromptTool: ToolDefinition = {
  name: 'projectpulse_onboarding_getBootstrapPrompt',
  description: 'Get prompt with instructions for parsing 13-Project-Plan.md to JSON hierarchy. Agent parses with THEIR AI, then calls batch create tools for personas, skills, workflows, SOPs.',
  schema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID'
      }
    },
    required: ['projectId']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = schema.parse(params);
    
    try {
      context.logger.info('Fetching bootstrap prompt', {
        projectId: validated.projectId
      });
      
      // Call API route which will:
      // 1. Fetch 13-Project-Plan.md from Document table
      // 2. Fetch OnboardingPromptTemplate for bootstrap
      // 3. Inject projectPlanMarkdown + techStack into prompt
      // 4. Return parsing instructions with structured output schema
      const response = await context.httpClient.get(
        `/api/onboarding/bootstrap-prompt?projectId=${validated.projectId}`
      ) as any;
      
      context.logger.info('Bootstrap prompt fetched', {
        projectId: validated.projectId,
        projectPlanLength: response.projectPlanMarkdown?.length,
        techStackCount: response.techStack?.length
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Failed to fetch bootstrap prompt', {
        error: errorMessage,
        projectId: validated.projectId
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to fetch bootstrap prompt',
              message: errorMessage,
              projectId: validated.projectId,
              hint: 'Ensure Session 2 is complete (13-Project-Plan.md document stored)'
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
};
