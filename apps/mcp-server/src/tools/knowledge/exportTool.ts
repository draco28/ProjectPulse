/**
 * Knowledge Export MCP Tool
 * Sprint 9 Phase 3: Proxy to GET /api/knowledge/export
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const inputSchema = z.object({
  projectId: z.number().int().positive().describe('Project ID for multi-tenancy'),
  format: z.enum(['json', 'markdown']).default('json').describe('Export format'),
});

type ExportInput = z.infer<typeof inputSchema>;

export const knowledgeExportTool: ToolDefinition = {
  name: 'projectpulse_knowledge_export',
  description: 'Export all knowledge items for a project in JSON or Markdown format.',
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number', description: 'Project ID for multi-tenancy' },
      format: { type: 'string', enum: ['json', 'markdown'], description: 'Export format' },
    },
    required: ['projectId'],
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = inputSchema.parse(params);
    
    context.logger.info('Exporting knowledge items', {
      projectId: validated.projectId,
      format: validated.format,
    });

    try {
      const response = await context.httpClient.get(
        `/api/knowledge/export?projectId=${validated.projectId}&format=${validated.format}`
      ) as any;

      context.logger.info('Knowledge export completed', {
        projectId: validated.projectId,
        count: response.count || 0,
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
      context.logger.error('Knowledge export failed', {
        error: errorMessage,
        projectId: validated.projectId,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Knowledge export failed',
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
