/**
 * MCP Tool: projectpulse_onboarding_storeBatch
 * 
 * Sprint 9 Refactor: Extends storeDocumentTool with bulk mode
 * 
 * Bulk store documents after agent generation
 * Stores multiple documents atomically in a single transaction
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const documentSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  content: z.string()
    .min(500, 'Content must be at least 500 characters')
    .max(50000, 'Content must be at most 50,000 characters'),
  category: z.enum(['planning', 'architecture', 'implementation', 'operations']),
  wordCount: z.number().int().positive()
});

const schema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),
  documents: z.array(documentSchema)
    .min(1, 'At least 1 document required')
    .max(5, 'Maximum 5 documents per batch')
});

type StoreBatchInput = z.infer<typeof schema>;

export const storeBatchTool: ToolDefinition = {
  name: 'projectpulse_onboarding_storeBatch',
  description: 'Bulk store documents after agent generation. Stores in Document table linked to OnboardingSession. Maximum 5 documents per batch.',
  schema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID'
      },
      documents: {
        type: 'array',
        description: 'Array of documents to store (1-5 documents)',
        items: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Document filename (e.g., "01-PRD.md", "13-Project-Plan.md")'
            },
            content: {
              type: 'string',
              description: 'Full markdown content (500-50,000 characters)'
            },
            category: {
              type: 'string',
              enum: ['planning', 'architecture', 'implementation', 'operations'],
              description: 'Document category'
            },
            wordCount: {
              type: 'number',
              description: 'Word count (calculated by agent)'
            }
          },
          required: ['filename', 'content', 'category', 'wordCount']
        }
      }
    },
    required: ['projectId', 'documents']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = schema.parse(params);
    
    try {
      context.logger.info('Storing document batch', {
        projectId: validated.projectId,
        documentCount: validated.documents.length,
        filenames: validated.documents.map(d => d.filename)
      });
      
      // Call API route which will:
      // 1. Get or create Session 2 OnboardingSession
      // 2. Bulk insert documents in transaction
      // 3. Update metrics (batchesComplete, tokensUsed)
      // 4. Calculate progress (based on 15 docs total)
      const response = await context.httpClient.post(
        '/api/onboarding/documents/batch',
        {
          projectId: validated.projectId,
          documents: validated.documents
        }
      ) as any;
      
      context.logger.info('Document batch stored', {
        projectId: validated.projectId,
        created: response.created,
        batchesComplete: response.batchesComplete,
        totalDocuments: response.totalDocuments,
        progress: response.progress
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
      context.logger.error('Failed to store document batch', {
        error: errorMessage,
        projectId: validated.projectId,
        documentCount: validated.documents?.length
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to store document batch',
              message: errorMessage,
              projectId: validated.projectId,
              documentCount: validated.documents?.length,
              hint: 'Check that filenames are unique and content is valid markdown'
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
};
