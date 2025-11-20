/**
 * MCP Tool: projectpulse_repo_writeMinimal
 * 
 * Sprint 9 Refactor: NEW TOOL
 * 
 * Optional write claude.md and agents.md to user repository
 * Only called if agent/user explicitly requests file generation
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const schema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),
  repoPath: z.string()
    .min(1, 'Repository path is required')
    .max(500, 'Repository path too long')
});

type WriteMinimalInput = z.infer<typeof schema>;

export const writeMinimalTool: ToolDefinition = {
  name: 'projectpulse_repo_writeMinimal',
  description: 'Optional write claude.md and agents.md to user repository. Only called if agent/user explicitly requests. Keeps repositories clean by default.',
  schema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID'
      },
      repoPath: {
        type: 'string',
        description: 'Absolute path to repository (e.g., "/Users/user/projects/my-app")'
      }
    },
    required: ['projectId', 'repoPath']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = schema.parse(params);
    
    try {
      context.logger.info('Writing minimal repo files', {
        projectId: validated.projectId,
        repoPath: validated.repoPath
      });
      
      // Call API route which will:
      // 1. Verify repoPath exists and is writable
      // 2. Generate claude.md from project context + agent personas
      // 3. Generate agents.md from skills + SOPs
      // 4. Write both files to repo
      // 5. Return filesWritten array
      const response = await context.httpClient.post(
        '/api/repo/write-minimal',
        {
          projectId: validated.projectId,
          repoPath: validated.repoPath
        }
      ) as any;
      
      context.logger.info('Minimal repo files written', {
        projectId: validated.projectId,
        filesWritten: response.filesWritten,
        repoPath: validated.repoPath
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
      context.logger.error('Failed to write minimal repo files', {
        error: errorMessage,
        projectId: validated.projectId,
        repoPath: validated.repoPath
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to write minimal repo files',
              message: errorMessage,
              projectId: validated.projectId,
              repoPath: validated.repoPath,
              hint: 'Check that repoPath exists and is writable'
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
};
