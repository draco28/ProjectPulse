/**
 * SOP Get MCP Tool - Sprint 11 (EPIC-013: Client Agent Integration)
 *
 * Gets full SOP details including content.
 *
 * Phase 3 (Self-Guiding MCP): Includes context hints in response
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import { addResourceTipToMarkdown } from '../../utils/contextHints.js';

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
  description: `[RESOURCE] Get full SOP content to follow project-specific procedures.

When to Use:
- Following established workflows for common tasks
- Ensuring compliance with project standards
- Learning step-by-step procedures before executing

Returns: Full procedure content with steps, checklists, and examples

Input: projectId + (id OR slug from projectpulse_sop_list)

Follow the steps exactly as documented for consistency.`,
  
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
      
      // Phase 3: Add resource tip
      const baseMarkdown = `# ${sop.title}\n\n` +
        `**Slug**: \`${sop.slug}\`\n` +
        `**Category**: ${sop.category}\n` +
        `**Tags**: ${tagsList}\n\n` +
        `## Description\n\n${sop.description || '_No description_'}\n\n` +
        `## Procedure\n\n${sop.content}`;
      const markdownWithHint = addResourceTipToMarkdown(baseMarkdown, 'SOPs');

      return {
        content: [
          {
            type: 'text',
            text: markdownWithHint,
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
