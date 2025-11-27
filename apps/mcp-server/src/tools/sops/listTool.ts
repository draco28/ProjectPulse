/**
 * SOP List MCP Tool - Sprint 11 (EPIC-013: Client Agent Integration)
 * 
 * Lists all SOPs for a project.
 * Returns metadata only (no content) for token efficiency.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

//=============================================================================
// SCHEMA
//=============================================================================

const schema = z.object({
  projectId: z.number().int().positive().describe('Project ID for multi-tenancy'),
  category: z.string().optional().describe('Filter by category (Development, Testing, Deployment, etc.)'),
});

type ListSOPsInput = z.infer<typeof schema>;

//=============================================================================
// TOOL DEFINITION
//=============================================================================

export const sopListTool: ToolDefinition = {
  name: 'projectpulse_sop_list',
  description: 'List all Standard Operating Procedures (SOPs) for a project (metadata only, no content). Use sop.get to load full content on-demand.',
  
  schema,
  
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID for multi-tenancy',
      },
      category: {
        type: 'string',
        description: 'Filter by category (Development, Testing, Deployment, etc.)',
      },
    },
    required: ['projectId'],
  },
  
  async execute(params: unknown, context: ToolContext) {
    const input = schema.parse(params) as ListSOPsInput;
    const { projectId, category } = input;
    
    context.logger.info('Listing SOPs', { projectId, category });
    
    try {
      const queryParams = new URLSearchParams({
        projectId: projectId.toString(),
      });
      
      if (category) queryParams.append('category', category);
      
      const response = await context.httpClient.get(
        `/api/sops?${queryParams.toString()}`
      ) as any;
      
      const sops = response.sops || [];
      
      context.logger.info('SOPs listed', {
        projectId,
        count: response.count,
      });
      
      // Group SOPs by category for readability
      const byCategory: Record<string, any[]> = {};
      for (const sop of sops) {
        const cat = sop.category || 'Uncategorized';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(sop);
      }
      
      // Format for agent readability
      const sections = Object.entries(byCategory).map(([cat, catSOPs]) => {
        const sopLines = catSOPs.map((s: any) => 
          `  - **${s.title}** (\`${s.slug}\`)\n    ${s.description || 'No description'}\n    Tags: ${s.tags?.join(', ') || 'none'}`
        ).join('\n');
        return `### ${cat}\n\n${sopLines}`;
      }).join('\n\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `# Available SOPs (${response.count})\n\n${sections || '_No SOPs found._'}\n\n---\n_Use \`sop.get\` to load full content on-demand._`,
          },
        ],
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Failed to list SOPs', {
        error: errorMessage,
        projectId,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to list SOPs',
              message: errorMessage,
              projectId,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  },
};
