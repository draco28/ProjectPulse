/**
 * SOP Get MCP Tool - Sprint 11 (EPIC-013: Client Agent Integration)
 * 
 * Gets full SOP details including content.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

//=============================================================================
// SCHEMA
//=============================================================================

const schema = z.object({
  projectId: z.number().int().positive().describe('Project ID for multi-tenancy'),
  id: z.number().int().positive().optional().describe('SOP ID (use either id or slug)'),
  slug: z.string().optional().describe('SOP slug (use either id or slug)'),
}).refine(data => data.id || data.slug, {
  message: 'Either id or slug is required',
});

type GetSOPInput = z.infer<typeof schema>;

//=============================================================================
// TOOL DEFINITION
//=============================================================================

export const sopGetTool: ToolDefinition = {
  name: 'projectpulse_sop_get',
  description: 'Get full details of a specific Standard Operating Procedure (SOP) including content. Use this to follow project-specific procedures.',
  
  schema,
  
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID for multi-tenancy',
      },
      id: {
        type: 'number',
        description: 'SOP ID (use either id or slug)',
      },
      slug: {
        type: 'string',
        description: 'SOP slug (use either id or slug)',
      },
    },
    required: ['projectId'],
  },
  
  async execute(params: unknown, context: ToolContext) {
    const input = schema.parse(params) as GetSOPInput;
    const { projectId, id, slug } = input;
    
    context.logger.info('Getting SOP', { projectId, id, slug });
    
    try {
      // Determine endpoint
      const endpoint = id 
        ? `/api/sops/${id}?projectId=${projectId}`
        : `/api/sops/by-slug/${slug}?projectId=${projectId}`;
      
      const sop = await context.httpClient.get(endpoint) as any;
      
      context.logger.info('SOP retrieved', {
        projectId,
        id: sop.id,
        title: sop.title,
      });
      
      // Format for agent readability
      const tagsList = sop.tags?.length > 0 ? sop.tags.join(', ') : 'none';
      
      return {
        content: [
          {
            type: 'text',
            text: `# ${sop.title}\n\n` +
              `**Slug**: \`${sop.slug}\`\n` +
              `**Category**: ${sop.category}\n` +
              `**Tags**: ${tagsList}\n\n` +
              `## Description\n\n${sop.description || '_No description_'}\n\n` +
              `## Procedure\n\n${sop.content}`,
          },
        ],
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Failed to get SOP', {
        error: errorMessage,
        projectId,
        id,
        slug,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to get SOP',
              message: errorMessage,
              projectId,
              id,
              slug,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  },
};
