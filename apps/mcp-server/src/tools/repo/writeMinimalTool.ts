/**
 * MCP Tool: projectpulse_repo_writeMinimal
 *
 * Sprint 9 Refactor: NEW TOOL
 * Sprint 14: Returns content for agent to write (Docker filesystem isolation fix)
 *
 * Generates CLAUDE.md and AGENTS.md content for user repository.
 * Returns file content for agent to write using its own tools (Claude Code Write, etc.)
 * This approach works regardless of Docker filesystem isolation.
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

// Response type from the API
interface WriteMinimalResponse {
  success: boolean;
  dryRun: boolean;
  projectId: number;
  repoPath: string;
  message: string;
  files: Array<{
    filename: string;
    path: string;
    content: string;
  }>;
  hint: string;
}

export const writeMinimalTool: ToolDefinition = {
  name: 'projectpulse_repo_writeMinimal',
  description: `Generate CLAUDE.md and AGENTS.md workflow guides for your project repository.

Returns the generated file content for you to write using your file tools.

Creates two files:
- CLAUDE.md: AI workflow guide with daily routines, ticket handling, session lifecycle, MCP tools reference
- AGENTS.md: Resource catalog listing personas, skills, SOPs available via MCP

Files are pre-populated with your project's actual data (personas, skills, SOPs from Session 3).

USAGE:
1. Call this tool with projectId and repoPath
2. Tool returns file content in the response
3. Use your Write tool to save each file to disk

Example:
  projectpulse_repo_writeMinimal({ projectId: 7, repoPath: "/Users/you/projects/my-app" })`,
  schema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Your ProjectPulse project ID (find it in dashboard URL or from context_load)'
      },
      repoPath: {
        type: 'string',
        description: 'Absolute path to your repository (e.g., "/Users/you/projects/my-app")'
      }
    },
    required: ['projectId', 'repoPath']
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = schema.parse(params);

    try {
      context.logger.info('Generating minimal repo files', {
        projectId: validated.projectId,
        repoPath: validated.repoPath
      });

      // Call API route with dryRun=true (default) to generate content
      // The API runs inside Docker and can't write to host filesystem paths
      // So we return the content for the calling agent to write
      const response = await context.httpClient.post(
        '/api/repo/write-minimal',
        {
          projectId: validated.projectId,
          repoPath: validated.repoPath,
          dryRun: true  // Return content instead of writing
        }
      ) as WriteMinimalResponse;

      context.logger.info('Minimal repo files generated', {
        projectId: validated.projectId,
        fileCount: response.files?.length || 0,
        repoPath: validated.repoPath
      });

      // Format a clear response for the agent
      const instructions = [
        `✅ Generated ${response.files?.length || 0} files for ${validated.repoPath}`,
        '',
        '📝 **ACTION REQUIRED**: Use your Write tool to save these files:',
        '',
      ];

      // Add file details
      for (const file of (response.files || [])) {
        instructions.push(`### ${file.filename}`);
        instructions.push(`**Path**: \`${file.path}\``);
        instructions.push('');
      }

      instructions.push('---');
      instructions.push('');
      instructions.push('The full content is provided below. Copy each file\'s content to the corresponding path.');

      return {
        content: [
          {
            type: 'text',
            text: instructions.join('\n')
          },
          // Return each file as a separate content block for clarity
          ...((response.files || []).map(file => ({
            type: 'text' as const,
            text: `\n\n=== FILE: ${file.path} ===\n\n${file.content}`
          })))
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Failed to generate minimal repo files', {
        error: errorMessage,
        projectId: validated.projectId,
        repoPath: validated.repoPath
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to generate minimal repo files',
              message: errorMessage,
              projectId: validated.projectId,
              repoPath: validated.repoPath,
              hint: 'Check that projectId is valid and you have network connectivity'
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
};
