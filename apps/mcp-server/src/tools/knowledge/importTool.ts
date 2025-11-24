/**
 * Knowledge Import MCP Tool
 * Sprint 9 Phase 3: Proxy to POST /api/knowledge/import
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const inputSchema = z.object({
  projectId: z.number().int().positive().describe('Project ID for multi-tenancy'),
  items: z.array(z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(10).max(50000),
    category: z.string().min(1).max(50),
    tags: z.array(z.string()).default([]),
  })).min(1).describe('Knowledge items to import'),
  overwrite: z.boolean().default(false).describe('Overwrite existing items with same title'),
});

type ImportInput = z.infer<typeof inputSchema>;

export const knowledgeImportTool: ToolDefinition = {
  name: 'projectpulse_knowledge_import',
  description: 'Bulk import knowledge items into a project. Optionally overwrite existing items.',
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number', description: 'Project ID for multi-tenancy' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            category: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
          },
          required: ['title', 'content', 'category'],
        },
        description: 'Knowledge items to import',
      },
      overwrite: { type: 'boolean', description: 'Overwrite existing items' },
    },
    required: ['projectId', 'items'],
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = inputSchema.parse(params);
    
    context.logger.info('Importing knowledge items', {
      projectId: validated.projectId,
      itemCount: validated.items.length,
      overwrite: validated.overwrite,
    });

    try {
      const response = await context.httpClient.post(
        '/api/knowledge/import',
        validated
      ) as any;

      context.logger.info('Knowledge import completed', {
        imported: response.imported || 0,
        skipped: response.skipped || 0,
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
      context.logger.error('Knowledge import failed', {
        error: errorMessage,
        projectId: validated.projectId,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Knowledge import failed',
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
