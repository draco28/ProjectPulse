/**
 * MCP Tool: projectpulse_context_update
 * Self-Guiding MCP Architecture - Phase 1
 *
 * Update a specific memory bank's content.
 * This is a USER-EXPLICIT tool - only call when user asks to update context.
 *
 * Use cases:
 * - User: "Add this pattern to SYSTEM_PATTERNS"
 * - User: "Update TECH_CONTEXT with new dependency"
 * - User: "Update project brief with new requirements"
 *
 * Note: ACTIVE_CONTEXT and PROGRESS are auto-synced via session_end.
 * This tool is primarily for static banks (PROJECT_BRIEF, SYSTEM_PATTERNS, TECH_CONTEXT).
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const schema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),
  bankType: z.enum([
    'PROJECT_BRIEF',
    'SYSTEM_PATTERNS',
    'TECH_CONTEXT',
    'ACTIVE_CONTEXT',
    'PROGRESS',
  ]),
  content: z.string().min(1, 'Content cannot be empty'),
  mode: z.enum(['replace', 'append']).default('replace'),
});

type ContextUpdateInput = z.infer<typeof schema>;

export const contextUpdateTool: ToolDefinition = {
  name: 'projectpulse_context_update',
  description: `Update a specific memory bank's content.

This is a USER-EXPLICIT tool - only call when user asks to update context.

Use cases:
- "Add this pattern to SYSTEM_PATTERNS"
- "Update TECH_CONTEXT with new dependency"
- "Update project brief with new requirements"

Parameters:
- bankType: Which bank to update (PROJECT_BRIEF, SYSTEM_PATTERNS, TECH_CONTEXT, ACTIVE_CONTEXT, PROGRESS)
- content: The new content (markdown)
- mode: 'replace' (overwrite) or 'append' (add to existing)

Token Budgets:
- PROJECT_BRIEF: 3K tokens
- SYSTEM_PATTERNS: 2K tokens
- TECH_CONTEXT: 2K tokens
- ACTIVE_CONTEXT: 1K tokens
- PROGRESS: 2K tokens

Note: ACTIVE_CONTEXT and PROGRESS are typically auto-synced via agent_session_end.
Use this tool for deliberate manual updates.`,

  schema,

  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID to update context for',
      },
      bankType: {
        type: 'string',
        enum: ['PROJECT_BRIEF', 'SYSTEM_PATTERNS', 'TECH_CONTEXT', 'ACTIVE_CONTEXT', 'PROGRESS'],
        description: 'Which memory bank to update',
      },
      content: {
        type: 'string',
        description: 'The new content for the memory bank (markdown format)',
      },
      mode: {
        type: 'string',
        enum: ['replace', 'append'],
        description: "'replace' to overwrite existing content, 'append' to add to it (default: replace)",
      },
    },
    required: ['projectId', 'bankType', 'content'],
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = schema.parse(params);

    try {
      context.logger.info('Updating context', {
        projectId: validated.projectId,
        bankType: validated.bankType,
        mode: validated.mode,
        contentLength: validated.content.length,
      });

      const response = await context.httpClient.put('/api/context/update', {
        projectId: validated.projectId,
        bankType: validated.bankType,
        content: validated.content,
        mode: validated.mode,
      }) as any;

      if (response.error) {
        throw new Error(response.message || response.error);
      }

      context.logger.info('Context updated', {
        projectId: validated.projectId,
        bankType: validated.bankType,
        tokens: response.tokens,
      });

      // Format success response
      const successMessage = `# Context Updated Successfully

**Bank**: ${formatBankType(validated.bankType)}
**Mode**: ${validated.mode}
**Tokens Used**: ${response.tokens}/${response.budget}
**Updated**: ${response.updatedAt}

---

The ${formatBankType(validated.bankType)} memory bank has been updated.

**Next Actions**:
- Call \`projectpulse_context_load\` to verify the update
- Call \`projectpulse_context_lookup\` to read just this bank`;

      return {
        content: [
          {
            type: 'text',
            text: successMessage,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Failed to update context', {
        error: errorMessage,
        projectId: validated.projectId,
        bankType: validated.bankType,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to update context',
              message: errorMessage,
              projectId: validated.projectId,
              bankType: validated.bankType,
              hint: errorMessage.includes('Token budget')
                ? 'Content exceeds token budget. Try trimming or using mode: "replace".'
                : 'Check that the project and bank exist.',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  },
};

/**
 * Format memory bank type for display
 */
function formatBankType(type: string): string {
  const labels: Record<string, string> = {
    PROJECT_BRIEF: 'Project Brief',
    SYSTEM_PATTERNS: 'System Patterns',
    TECH_CONTEXT: 'Tech Context',
    ACTIVE_CONTEXT: 'Active Context',
    PROGRESS: 'Progress',
  };
  return labels[type] || type;
}
