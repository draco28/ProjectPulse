/**
 * MCP Tool: projectpulse.onboarding.generateExecutiveSummary
 * 
 * Sprint 8.6 Phase 1 - Session 1 Executive Summary Tool
 * 
 * Generate AI executive summary from all 10 phases of planning answers
 * Uses OpenAI GPT-4 to synthesize answers into cohesive vision (~500 words)
 * 
 * Use Case: Agent generates executive summary after all 10 phases complete
 * Prerequisites: All 10 phases must be answered
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const generateExecutiveSummarySchema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive')
});

type GenerateExecutiveSummaryInput = z.infer<typeof generateExecutiveSummarySchema>;

export const generateExecutiveSummaryTool: ToolDefinition = {
  name: 'projectpulse.onboarding.generateExecutiveSummary',
  description: 'Generate AI executive summary from all 10 phases of planning answers. Requires all phases complete (1-10). Returns ~500 word summary + project-context.json structure. Uses OpenAI if configured, else fallback generation.',
  schema: generateExecutiveSummarySchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID (must have completed all 10 phases)'
      }
    },
    required: ['projectId']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = generateExecutiveSummarySchema.parse(params);
    
    try {
      context.logger.info('Generating executive summary', {
        projectId: validated.projectId
      });
      
      const response = await context.httpClient.post('/api/onboarding/executive-summary', {
        projectId: validated.projectId
      }) as any;
      
      context.logger.info('Executive summary generated', {
        projectId: validated.projectId,
        wordCount: response.wordCount,
        usedOpenAI: !!process.env.OPENAI_API_KEY
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: response.success,
              wordCount: response.wordCount,
              executiveSummary: response.executiveSummary,
              projectContext: response.projectContextJson,
              message: `Session 1 complete! Executive summary generated with ${response.wordCount} words. Ready for Session 2: Industry Documents Generation.`
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Failed to generate executive summary', {
        error: errorMessage
      });
      
      // Check for common errors
      let helpText = '';
      if (errorMessage.includes('All 10 phases must be complete')) {
        helpText = 'Hint: Use projectpulse.onboarding.saveAnswers to complete all phases (1-10) before generating executive summary.';
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to generate executive summary',
              message: errorMessage,
              help: helpText
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
};
