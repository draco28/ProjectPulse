/**
 * MCP Tool: projectpulse.onboarding.storeDocument
 * 
 * Sprint 8.6 Phase 2 - Session 2 Store Document Tool (Agent-Side AI)
 * 
 * Store ONE agent-generated document (after agent generated it with their own AI).
 * Call this 15 times (once per document) after generating with your AI provider.
 * Returns progress (e.g., "3/15 documents stored, 20% complete").
 * 
 * Agent workflow:
 * 1. Get document prompts from getDocumentPrompts
 * 2. Generate document with YOUR AI (Claude, GPT, Gemini, etc.)
 * 3. Call this tool to store the generated document
 * 4. Repeat for all 15 documents
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const storeDocumentSchema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),
  filename: z.string()
    .min(1, 'Filename required')
    .regex(/^\d{2}-[A-Za-z-]+\.md$/, 'Filename must match pattern: 01-Name.md'),
  content: z.string()
    .min(500, 'Content must be at least 500 characters')
    .max(50000, 'Content must not exceed 50000 characters'),
  category: z.enum(['planning', 'architecture', 'implementation', 'operations']),
  wordCount: z.number()
    .int('Word count must be an integer')
    .positive('Word count must be positive')
    .optional(),
  overwrite: z.boolean().optional().describe('Set to true to update an existing document instead of failing')
});

type StoreDocumentInput = z.infer<typeof storeDocumentSchema>;

export const storeDocumentTool: ToolDefinition = {
  name: 'projectpulse_onboarding_storeDocument',
  description: 'Store ONE agent-generated document. Call this 15 times. Returns progress. Use overwrite=true to update existing documents.',
  schema: storeDocumentSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID'
      },
      filename: {
        type: 'string',
        description: 'Document filename (e.g., "01-PRD.md", "13-Project-Plan.md")'
      },
      content: {
        type: 'string',
        description: 'Full markdown content (500-50000 characters)'
      },
      category: {
        type: 'string',
        enum: ['planning', 'architecture', 'implementation', 'operations'],
        description: 'Document category'
      },
      wordCount: {
        type: 'number',
        description: 'Word count (optional, will be calculated if not provided)'
      },
      overwrite: {
        type: 'boolean',
        description: 'Set to true to update an existing document instead of failing with 409 Conflict'
      }
    },
    required: ['projectId', 'filename', 'content', 'category']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = storeDocumentSchema.parse(params);
    
    try {
      context.logger.info('Storing agent-generated document', {
        projectId: validated.projectId,
        filename: validated.filename,
        wordCount: validated.wordCount || 'auto-calculate',
        overwrite: validated.overwrite || false,
        contentLength: validated.content.length
      });
      
      const response = await context.httpClient.post('/api/onboarding/documents', {
        projectId: validated.projectId,
        filename: validated.filename,
        content: validated.content,
        category: validated.category,
        wordCount: validated.wordCount,
        overwrite: validated.overwrite
      }) as any;
      
      context.logger.info('Document stored successfully', {
        projectId: validated.projectId,
        filename: validated.filename,
        documentId: response.document?.id,
        progress: `${response.progress?.documentsStored || 0}/${response.progress?.totalDocuments || 15}`,
        percentComplete: response.progress?.percentComplete || 0,
        isComplete: response.progress?.isComplete || false
      });
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(response, null, 2)
        }]
      };
      
    } catch (error) {
      context.logger.error('Failed to store document', {
        projectId: validated.projectId,
        filename: validated.filename,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
};
