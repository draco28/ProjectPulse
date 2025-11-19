/**
 * MCP Tool: projectpulse.onboarding.getDocumentPrompts
 * 
 * Sprint 8.6 Phase 2 - Session 2 Get Document Prompts Tool (Agent-Side AI)
 * 
 * Get all 15 document prompt templates with project context injected.
 * Agent will generate documents with their own AI provider using these prompts.
 * 
 * Agent workflow:
 * 1. Complete Session 1 (10 phases + executive summary)
 * 2. Call this tool to get all 15 prompts
 * 3. Agent generates each document with their AI provider
 * 4. Agent stores each document via storeDocument tool
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const getDocumentPromptsSchema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive')
});

type GetDocumentPromptsInput = z.infer<typeof getDocumentPromptsSchema>;

export const getDocumentPromptsTool: ToolDefinition = {
  name: 'projectpulse.onboarding.getDocumentPrompts',
  description: 'Get all 15 document prompt templates with project context injected. Agent will generate documents with their own AI provider using these prompts. Returns systemPrompt + userPrompt for each document. NO server-side AI generation.',
  schema: getDocumentPromptsSchema,
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
    const validated = getDocumentPromptsSchema.parse(params);
    
    try {
      context.logger.info('Fetching document prompts', {
        projectId: validated.projectId
      });
      
      const response = await context.httpClient.get(
        `/api/onboarding/document-prompts?projectId=${validated.projectId}`
      ) as any;
      
      context.logger.info('Document prompts fetched successfully', {
        projectId: validated.projectId,
        totalDocuments: response.totalDocuments,
        estimatedWords: response.estimatedTotalWords,
        projectName: response.metadata?.projectName
      });
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(response, null, 2)
        }]
      };
      
    } catch (error) {
      context.logger.error('Failed to fetch document prompts', {
        projectId: validated.projectId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
};
