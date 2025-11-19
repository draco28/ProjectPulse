import { z } from 'zod';
import type { ToolDefinition } from '../types.js';

/**
 * MCP Tool: projectpulse.workflow.getStatus
 *
 * Get current status and details of a workflow run.
 *
 * @see US-041: workflow.getStatus MCP tool (2 points)
 * @see GET /api/workflows/run/:id endpoint
 */

const inputSchema = z.object({
  runId: z.number().int().positive().describe('Workflow run ID'),
});

type WorkflowGetStatusInput = z.infer<typeof inputSchema>;

type WorkflowGetStatusResponse = {
  data: {
    run: {
      id: number;
      templateName: string;
      status: string;
      currentStep: number;
      totalSteps: number;
      completedSteps: number;
      context: Record<string, any>;
      startedAt: string;
      completedAt: string | null;
      pausedAt: string | null;
      steps: Array<{
        stepNumber: number;
        name: string;
        status: string;
        startedAt: string | null;
        completedAt: string | null;
        error: string | null;
      }>;
    };
  };
  error: null | string;
};

export const workflowGetStatusTool: ToolDefinition = {
  name: 'projectpulse_workflow_getStatus',
  description:
    'Get detailed status of a workflow run including current step, progress, and all step statuses. Use this to check workflow progress, diagnose issues, or resume after a pause.',
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      runId: {
        type: 'number',
        description: 'ID of the workflow run to query',
      },
    },
    required: ['runId'],
  },
  execute: async (params, context) => {
    const { runId } = params as WorkflowGetStatusInput;

    try {
      const response = await context.httpClient.get<WorkflowGetStatusResponse>(`/api/workflows/run/${runId}`);

      if (response.error) {
        throw new Error(response.error);
      }

      const { run } = response.data;

      const progressBar = '█'.repeat(Math.floor((run.completedSteps / run.totalSteps) * 20));
      const emptyBar = '░'.repeat(20 - Math.floor((run.completedSteps / run.totalSteps) * 20));
      const percentage = Math.round((run.completedSteps / run.totalSteps) * 100);

      const stepsList = run.steps
        .map((step) => {
          const icon =
            step.status === 'completed'
              ? '✅'
              : step.status === 'running'
                ? '▶️'
                : step.status === 'failed'
                  ? '❌'
                  : '⏸️';
          return `${icon} ${step.stepNumber}. ${step.name} [${step.status}]${step.error ? `\n   Error: ${step.error}` : ''}`;
        })
        .join('\n');

      const summary = `📊 **Workflow Run Status**

**Template**: ${run.templateName}
**Run ID**: ${run.id}
**Status**: ${run.status.toUpperCase()}
**Progress**: [${progressBar}${emptyBar}] ${percentage}% (${run.completedSteps}/${run.totalSteps} steps)
**Current Step**: ${run.currentStep}

${run.pausedAt ? `⏸️ **Paused at**: ${new Date(run.pausedAt).toLocaleString()}\n` : ''}${run.completedAt ? `✅ **Completed at**: ${new Date(run.completedAt).toLocaleString()}\n` : ''}
**Steps**:
${stepsList}

${Object.keys(run.context).length > 0 ? `**Context**:\n\`\`\`json\n${JSON.stringify(run.context, null, 2)}\n\`\`\`\n` : ''}
💡 **Next actions**:
${
  run.status === 'running'
    ? '• Use `workflow.executeStep` to continue'
    : run.status === 'paused'
      ? '• Use `workflow.resume` to continue'
      : run.status === 'pending'
        ? '• Use `workflow.executeStep` to start'
        : '• Workflow is complete or failed'
}`;

      context.logger.info('Workflow status retrieved', {
        runId,
        status: run.status,
        progress: `${run.completedSteps}/${run.totalSteps}`,
      });

      return {
        content: [
          {
            type: 'text',
            text: summary,
          },
        ],
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';

      context.logger.error('Failed to get workflow status', {
        error: errorMessage,
        runId,
      });

      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to get workflow status: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
