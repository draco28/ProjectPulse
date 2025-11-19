/**
 * MCP Tool: projectpulse.onboarding.listDocuments
 * 
 * Sprint 8.6 Phase 2 - Session 2 List Documents Tool (Agent-Side AI)
 * 
 * List all stored documents from Session 2.
 * Returns metadata (filename, wordCount, category) but NOT full content.
 * Use this to verify all 15 documents were stored successfully.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const listDocumentsSchema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive')
});

type ListDocumentsInput = z.infer<typeof listDocumentsSchema>;

export const listDocumentsTool: ToolDefinition = {
  name: 'projectpulse.onboarding.listDocuments',
  description: 'List all stored documents from Session 2. Returns metadata (filename, wordCount, category) but NOT full content. Use this to verify all 15 documents were stored successfully and check Session 2 status.',
  schema: listDocumentsSchema,
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
    const validated = listDocumentsSchema.parse(params);
    
    try {
      context.logger.info('Listing documents', {
        projectId: validated.projectId
      });
      
      const response = await context.httpClient.get(
        `/api/onboarding/documents?projectId=${validated.projectId}`
      ) as any;
      
      context.logger.info('Documents listed successfully', {
        projectId: validated.projectId,
        totalDocuments: response.totalDocuments,
        totalWordCount: response.totalWordCount,
        status: response.status
      });
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(response, null, 2)
        }]
      };
      
    } catch (error) {
      context.logger.error('Failed to list documents', {
        projectId: validated.projectId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
};
