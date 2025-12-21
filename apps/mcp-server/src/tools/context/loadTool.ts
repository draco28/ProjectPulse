/**
 * MCP Tool: projectpulse_context_load
 * Self-Guiding MCP Architecture - Phase 1
 *
 * START HERE - Unified context loading for AI agents.
 * Call this FIRST when starting work or after context loss.
 *
 * Returns:
 * - All 5 memory banks (project state)
 * - Active session (if resuming previous work)
 * - Available resources (personas, skills, SOPs)
 * - Workflow hints (what to do next)
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const schema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),
  banksToLoad: z.enum(['all', 'active-only']).optional().default('all'),
});

type ContextLoadInput = z.infer<typeof schema>;

export const contextLoadTool: ToolDefinition = {
  name: 'projectpulse_context_load',
  description: `🚀 [ENTRY POINT] START HERE - Load project context and active session.

Call this FIRST when:
- Starting a new work session
- After context compaction (lost memory)
- When unsure about project state

Returns:
- All 5 memory banks (project brief, patterns, tech, current focus, progress)
- Active session if you have work in progress
- Available resources (personas, skills, SOPs)
- Workflow hints for what to do next

Options:
- banksToLoad: 'all' (default) loads all 5 banks, 'active-only' loads just ACTIVE_CONTEXT and PROGRESS

This is your entry point to ProjectPulse.`,

  schema,

  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID to load context for',
      },
      banksToLoad: {
        type: 'string',
        enum: ['all', 'active-only'],
        description: "Which memory banks to load: 'all' (default) or 'active-only' (ACTIVE_CONTEXT + PROGRESS only)",
      },
    },
    required: ['projectId'],
  },

  async execute(params: unknown, context: ToolContext) {
    const validated = schema.parse(params);

    try {
      context.logger.info('Loading context', {
        projectId: validated.projectId,
        banksToLoad: validated.banksToLoad,
      });

      const queryParams = new URLSearchParams({
        projectId: validated.projectId.toString(),
      });

      if (validated.banksToLoad) {
        queryParams.append('banksToLoad', validated.banksToLoad);
      }

      const response = await context.httpClient.get(
        `/api/context/load?${queryParams.toString()}`
      ) as any;

      context.logger.info('Context loaded', {
        projectId: validated.projectId,
        totalTokens: response.totalTokens,
        // Sprint 14: Multi-session support
        activeSessionsCount: response.activeSessions?.length || 0,
        hintsCount: response.hints?.length || 0,
      });

      // Format response for agent readability
      const formattedResponse = formatContextResponse(response);

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
      context.logger.error('Failed to load context', {
        error: errorMessage,
        projectId: validated.projectId,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to load context',
              message: errorMessage,
              projectId: validated.projectId,
              hint: 'Check that the project exists and you have access.',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  },
};

/**
 * Format context response for better agent readability
 */
function formatContextResponse(response: any): string {
  const sections: string[] = [];

  // Header
  sections.push(`# Project Context: ${response.projectName}`);
  sections.push(`**Project ID**: ${response.projectId}`);
  sections.push(`**Loaded**: ${response.timestamp}`);
  sections.push(`**Total Tokens**: ~${response.totalTokens}`);
  sections.push('');

  // Workflow Hints (most important - show first)
  if (response.hints && response.hints.length > 0) {
    sections.push('## Workflow Hints');
    for (const hint of response.hints) {
      sections.push(`- ${hint}`);
    }
    sections.push('');
  }

  // Active Sessions (Sprint 14: Multi-session support)
  if (response.activeSessions && response.activeSessions.length > 0) {
    const sessions = response.activeSessions;
    const inProgressCount = sessions.filter((s: any) => s.status === 'IN_PROGRESS').length;
    const pausedCount = sessions.filter((s: any) => s.status === 'PAUSED').length;

    sections.push('## Active Work Sessions');
    sections.push(`**Total**: ${sessions.length} (${inProgressCount} active, ${pausedCount} paused)`);
    sections.push('');

    // Show details for each session (most recent first)
    for (const session of sessions) {
      const statusIcon = session.status === 'IN_PROGRESS' ? '🟢' : '⏸️';
      sections.push(`### ${statusIcon} ${session.name || '_Unnamed session_'}`);
      sections.push(`**Session ID**: \`${session.id}\``);
      sections.push(`**Status**: ${session.status}`);
      sections.push(`**Started**: ${session.startedAt}`);

      if (session.activeTicketIds && session.activeTicketIds.length > 0) {
        sections.push(`**Active Tickets**: ${session.activeTicketIds.join(', ')}`);
      }

      if (session.todos) {
        const todos = session.todos as Array<{ content: string; status: string }>;
        if (Array.isArray(todos) && todos.length > 0) {
          const completed = todos.filter(t => t.status === 'completed').length;
          sections.push(`**Todos**: ${completed}/${todos.length} completed`);
          // Show first 3 incomplete todos
          const incomplete = todos.filter(t => t.status !== 'completed').slice(0, 3);
          if (incomplete.length > 0) {
            for (const todo of incomplete) {
              sections.push(`  - [ ] ${todo.content}`);
            }
            if (todos.filter(t => t.status !== 'completed').length > 3) {
              sections.push(`  - _...and ${todos.filter(t => t.status !== 'completed').length - 3} more_`);
            }
          }
        }
      }

      if (session.plan) {
        // Truncate plan preview for multi-session view
        const planPreview = session.plan.length > 200
          ? session.plan.substring(0, 200) + '...'
          : session.plan;
        sections.push(`**Plan**: ${planPreview.replace(/\n/g, ' ')}`);
      }
      sections.push('');
    }

    // Helpful guidance for multi-session scenarios
    if (sessions.length > 1) {
      sections.push('> **Tip**: Use `projectpulse_agent_session_resume` with a session ID to continue specific work.');
      sections.push('');
    }
  }

  // Memory Banks
  sections.push('## Memory Banks');
  const banks = response.memoryBanks;

  for (const [type, bank] of Object.entries(banks) as [string, any][]) {
    if (bank) {
      sections.push(`### ${formatBankType(type)} (~${bank.tokens} tokens)`);
      sections.push(`_Updated: ${bank.updatedAt}_`);
      sections.push('');
      sections.push(bank.content || '_No content_');
      sections.push('');
    }
  }

  // Available Resources
  const resources = response.availableResources;
  if (resources) {
    sections.push('## Available Resources');

    if (resources.personas.count > 0) {
      sections.push(`**Personas (${resources.personas.count})**: ${resources.personas.names.join(', ')}`);
    }

    if (resources.skills.count > 0) {
      sections.push(`**Skills (${resources.skills.count})**: Categories: ${resources.skills.categories.join(', ')}`);
    }

    if (resources.sops.count > 0) {
      sections.push(`**SOPs (${resources.sops.count})**: ${resources.sops.names.join(', ')}`);
    }
    sections.push('');
  }

  // Footer with next actions (dynamic based on onboarding status)
  sections.push('---');
  sections.push('**Next Actions**:');

  // Check onboarding status to determine appropriate next actions
  const onboarding = response.onboardingStatus;
  if (onboarding && !onboarding.isComplete) {
    // Onboarding not complete - prioritize onboarding actions
    if (onboarding.inProgressSession) {
      sections.push(`- 🚀 **CONTINUE ONBOARDING**: \`projectpulse_onboarding_getQuestions({ sessionNumber: ${onboarding.inProgressSession} })\``);
      sections.push(`- Check status: \`projectpulse_onboarding_status\``);
    } else {
      const nextSession = onboarding.nextSession || 1;
      sections.push(`- 🚨 **START ONBOARDING**: \`projectpulse_onboarding_start({ sessionNumber: ${nextSession} })\``);
      sections.push(`- Check status: \`projectpulse_onboarding_status\``);
    }
    sections.push('');
    sections.push('_Note: Complete all 3 onboarding sessions before starting work sessions._');
  } else {
    // Onboarding complete - show normal work session actions
    sections.push('- To start tracking work: `projectpulse_agent_session_start`');
    sections.push('- To update progress: `projectpulse_agent_session_update`');
    sections.push('- To load specific bank: `projectpulse_context_lookup`');
    sections.push('- To update static banks: `projectpulse_context_update`');
  }

  return sections.join('\n');
}

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
