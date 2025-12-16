/**
 * MCP Tool: projectpulse_context_lookup
 * Self-Guiding MCP Architecture - Phase 1
 *
 * Query a specific memory bank by type.
 * Use this for token-efficient partial context loading.
 *
 * RECOMMENDED: Call context_load first to get the full picture.
 * Use context_lookup when you only need one specific bank.
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
});

type ContextLookupInput = z.infer<typeof schema>;

export const contextLookupTool: ToolDefinition = {
  name: 'projectpulse_context_lookup',
  description: `Load a specific memory bank by type.

Use this for token-efficient partial context loading when you only need
one specific bank (e.g., SYSTEM_PATTERNS for coding patterns).

RECOMMENDED: Call projectpulse_context_load first to see all available context.
Use this tool for selective loading when you know exactly what you need.

Bank Types:
- PROJECT_BRIEF: Core requirements, goals, success criteria
- SYSTEM_PATTERNS: Architecture patterns, coding conventions
- TECH_CONTEXT: Technical stack, dependencies, constraints
- ACTIVE_CONTEXT: Current focus, what we're working on
- PROGRESS: What's done, milestones, velocity

Target: ~1K tokens per lookup.`,

  schema,

  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID to query memory bank for',
      },
      bankType: {
        type: 'string',
        enum: ['PROJECT_BRIEF', 'SYSTEM_PATTERNS', 'TECH_CONTEXT', 'ACTIVE_CONTEXT', 'PROGRESS'],
        description: 'Memory bank type to retrieve',
      },
    },
    required: ['projectId', 'bankType'],
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = schema.parse(params);

    try {
      context.logger.info('Looking up context bank', {
        projectId: validated.projectId,
        bankType: validated.bankType,
      });

      const response = await context.httpClient.get(
        `/api/memory/pattern-lookup?projectId=${validated.projectId}&bankType=${validated.bankType}`
      ) as any;

      context.logger.info('Context bank retrieved', {
        projectId: validated.projectId,
        bankType: validated.bankType,
        tokens: response.tokens,
      });

      // Format response for agent readability
      const formattedResponse = `# ${formatBankType(validated.bankType)}

**Project ID**: ${response.projectId}
**Tokens**: ~${response.tokens}

---

${response.content || '_No content in this bank._'}

---

**Next Actions**:
- To load full context: \`projectpulse_context_load\`
- To update this bank: \`projectpulse_context_update\``;

      return {
        content: [
          {
            type: 'text',
            text: formattedResponse,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error('Failed to lookup context bank', {
        error: errorMessage,
        projectId: validated.projectId,
        bankType: validated.bankType,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to lookup context bank',
              message: errorMessage,
              projectId: validated.projectId,
              bankType: validated.bankType,
              hint: 'Ensure the project exists and has memory banks initialized.',
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
