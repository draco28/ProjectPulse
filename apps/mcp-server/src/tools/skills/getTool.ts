/**
 * Skill Get MCP Tool - Sprint 11 (EPIC-013: Client Agent Integration)
 * 
 * Gets full skill details including content.
 * Automatically tracks usage for analytics.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

//=============================================================================
// SCHEMA
//=============================================================================

const schema = z.object({
  projectId: z.number().int().positive().describe('Project ID for multi-tenancy'),
  slug: z.string().min(1).describe('Skill slug'),
});

type GetSkillInput = z.infer<typeof schema>;

//=============================================================================
// TOOL DEFINITION
//=============================================================================

export const skillGetTool: ToolDefinition = {
  name: 'projectpulse_skill_get',
  description: 'Get full details of a specific skill including content. Automatically tracks usage for analytics. Use this to load skill patterns and procedures on-demand.',
  
  schema,
  
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID for multi-tenancy',
      },
      slug: {
        type: 'string',
        description: 'Skill slug',
      },
    },
    required: ['projectId', 'slug'],
  },
  
  async execute(params: unknown, context: ToolContext) {
    const input = schema.parse(params) as GetSkillInput;
    const { projectId, slug } = input;
    
    context.logger.info('Getting skill', { projectId, slug });
    
    try {
      const response = await context.httpClient.get(
        `/api/skills/${slug}?projectId=${projectId}`
      ) as any;
      
      const skill = response.data || response;
      
      context.logger.info('Skill retrieved', {
        projectId,
        id: skill.id,
        title: skill.title,
        usageCount: skill.usageCount,
      });
      
      // Format for agent readability
      const tagsList = skill.tags?.length > 0 ? skill.tags.join(', ') : 'none';
      const frameworksList = skill.frameworks?.length > 0 ? skill.frameworks.join(', ') : 'none';
      
      return {
        content: [
          {
            type: 'text',
            text: `# ${skill.title}\n\n` +
              `**Slug**: \`${skill.slug}\`\n` +
              `**Category**: ${skill.category}\n` +
              `**Tags**: ${tagsList}\n` +
              `**Frameworks**: ${frameworksList}\n` +
              `**Usage Count**: ${skill.usageCount}\n\n` +
              `## Description\n\n${skill.description || '_No description_'}\n\n` +
              `## Content\n\n${skill.content}`,
          },
        ],
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Failed to get skill', {
        error: errorMessage,
        projectId,
        slug,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to get skill',
              message: errorMessage,
              projectId,
              slug,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  },
};
