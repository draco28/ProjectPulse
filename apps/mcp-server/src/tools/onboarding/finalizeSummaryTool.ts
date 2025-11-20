/**
 * MCP Tool: projectpulse_onboarding_finalizeSummary
 * 
 * Sprint 9 Refactor: NEW TOOL
 * 
 * Get prompt template to generate executive summary from all 96 Q&A pairs
 * Returns system/user prompts with all phase answers injected
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const schema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive')
});

type FinalizeSummaryInput = z.infer<typeof schema>;

export const finalizeSummaryTool: ToolDefinition = {
  name: 'projectpulse_onboarding_finalizeSummary',
  description: 'Get prompt template to generate executive summary from all 96 Q&A pairs. Agent generates summary with THEIR AI provider, then calls storeExecutiveSummary.',
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
      context.logger.info('Fetching executive summary prompt', {
        projectId: validated.projectId
      });
      
      // Call API route which will:
      // 1. Fetch OnboardingSession with all planningAnswers
      // 2. Fetch OnboardingPromptTemplate for executive summary
      // 3. Inject all 96 Q&A pairs into userPrompt
      // 4. Return systemPrompt + userPrompt + metadata
      const response = await context.httpClient.get(
        `/api/onboarding/summary-prompt?projectId=${validated.projectId}`
      ) as any;
      
      context.logger.info('Executive summary prompt fetched', {
        projectId: validated.projectId,
        totalQuestions: response.metadata?.totalQuestions,
        estimatedTokens: response.metadata?.estimatedTokens,
        wordCountTarget: response.wordCountTarget
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
      context.logger.error('Failed to fetch executive summary prompt', {
        error: errorMessage,
        projectId: validated.projectId
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to fetch executive summary prompt',
              message: errorMessage,
              projectId: validated.projectId,
              hint: 'Ensure all 10 phases are complete before finalizing summary'
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
};
