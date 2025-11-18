/**
 * MCP Tool: projectpulse.onboarding.storeExecutiveSummary
 * 
 * Sprint 8.6 Phase 1 - Session 1 Storage Tool (Agent-Side AI)
 * 
 * Store agent-generated executive summary (after agent generated it with their own AI)
 * 
 * Agent workflow:
 * 1. Get prompt template from getExecutiveSummaryPrompt
 * 2. Generate summary using agent's AI provider (Claude, GPT, Gemini, etc.)
 * 3. Call this tool to store the generated summary
 * 4. ProjectPulse stores summary and marks Session 1 complete
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const storeExecutiveSummarySchema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),
  executiveSummary: z.string()
    .min(100, 'Executive summary must be at least 100 characters')
    .max(5000, 'Executive summary must not exceed 5000 characters'),
  wordCount: z.number()
    .int('Word count must be an integer')
    .positive('Word count must be positive')
    .optional()
});

type StoreExecutiveSummaryInput = z.infer<typeof storeExecutiveSummarySchema>;

export const storeExecutiveSummaryTool: ToolDefinition = {
  name: 'projectpulse.onboarding.storeExecutiveSummary',
  description: 'Store agent-generated executive summary (after agent generated it with their own AI). This completes Session 1 and generates project-context.json for Session 2.',
  schema: storeExecutiveSummarySchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID'
      },
      executiveSummary: {
        type: 'string',
        description: 'Agent-generated executive summary (100-5000 characters, ~500 words recommended)'
      },
      wordCount: {
        type: 'number',
        description: 'Word count (optional, will be calculated if not provided)'
      }
    },
    required: ['projectId', 'executiveSummary']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = storeExecutiveSummarySchema.parse(params);
    
    try {
      context.logger.info('Storing agent-generated executive summary', {
        projectId: validated.projectId,
        wordCount: validated.wordCount || 'auto-calculate'
      });
      
      const response = await context.httpClient.post(
        '/api/onboarding/executive-summary',
        {
          projectId: validated.projectId,
          executiveSummary: validated.executiveSummary,
          wordCount: validated.wordCount
        }
      ) as any;
      
      context.logger.info('Executive summary stored successfully', {
        projectId: validated.projectId,
        wordCount: response.wordCount,
        success: response.success
      });
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(response, null, 2)
        }]
      };
      
    } catch (error) {
      context.logger.error('Failed to store executive summary', {
        projectId: validated.projectId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
};
