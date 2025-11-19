/**
 * MCP Tool: projectpulse.onboarding.getExecutiveSummaryPrompt
 * 
 * Sprint 8.6 Phase 1 - Session 1 Prompt Tool (Agent-Side AI)
 * 
 * Get prompt template with ALL 96 answers for generating executive summary
 * with agent's own AI provider (Claude, GPT, Gemini, etc.)
 * 
 * Agent workflow:
 * 1. Complete all 10 phases of questions
 * 2. Call this tool to get prompt template
 * 3. Agent generates summary with their AI provider
 * 4. Call storeExecutiveSummary to save result
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const getExecutiveSummaryPromptSchema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive')
});

type GetExecutiveSummaryPromptInput = z.infer<typeof getExecutiveSummaryPromptSchema>;

export const getExecutiveSummaryPromptTool: ToolDefinition = {
  name: 'projectpulse_onboarding_getExecutiveSummaryPrompt',
  description: 'Get prompt template with ALL 96 answers for generating executive summary with agent\'s own AI provider. This tool does NOT generate summaries - it returns a prompt template for the agent to use with their LLM.',
  schema: getExecutiveSummaryPromptSchema,
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
    const validated = getExecutiveSummaryPromptSchema.parse(params);
    
    try {
      context.logger.info('Fetching executive summary prompt template', {
        projectId: validated.projectId
      });
      
      const response = await context.httpClient.get(
        `/api/onboarding/executive-summary-prompt?projectId=${validated.projectId}`
      ) as any;
      
      context.logger.info('Executive summary prompt fetched', {
        projectId: validated.projectId,
        userPromptLength: response.userPrompt?.length || 0,
        totalQuestions: response.metadata?.totalQuestions || 0
      });
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(response, null, 2)
        }]
      };
      
    } catch (error) {
      context.logger.error('Failed to fetch executive summary prompt', {
        projectId: validated.projectId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
};
