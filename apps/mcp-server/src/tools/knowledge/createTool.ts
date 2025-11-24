/**
 * Knowledge Create MCP Tool
 * Sprint 9 Phase 3: Proxy to POST /api/knowledge
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const inputSchema = z.object({
  projectId: z.number().int().positive().describe('Project ID for multi-tenancy'),
  title: z.string().min(1).max(200).describe('Knowledge item title'),
  content: z.string().min(10).max(50000).describe('Knowledge item content (markdown)'),
  category: z.string().min(1).max(50).describe('Category (e.g., Database, DevOps, Frontend)'),
  tags: z.array(z.string()).max(20).default([]).describe('Tags for categorization'),
});

type CreateInput = z.infer<typeof inputSchema>;

export const knowledgeCreateTool: ToolDefinition = {
  name: 'projectpulse_knowledge_create',
  description: 'Create a new knowledge item in the knowledge base. Automatically generates embeddings and search indexes.',
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number', description: 'Project ID for multi-tenancy' },
      title: { type: 'string', description: 'Knowledge item title' },
      content: { type: 'string', description: 'Knowledge item content (markdown)' },
      category: { type: 'string', description: 'Category (e.g., Database, DevOps)' },
      tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
    },
    required: ['projectId', 'title', 'content', 'category'],
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = inputSchema.parse(params);
    
    context.logger.info('Creating knowledge item', {
      projectId: validated.projectId,
      title: validated.title,
      category: validated.category,
    });

    try {
      const response = await context.httpClient.post(
        '/api/knowledge',
        validated
      ) as any;

      context.logger.info('Knowledge item created', {
        id: response.id,
        title: response.title,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Knowledge creation failed', {
        error: errorMessage,
        projectId: validated.projectId,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({  
              error: 'Knowledge creation failed',
              message: errorMessage,
              projectId: validated.projectId,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  },
};
