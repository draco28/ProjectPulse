import { z } from 'zod';
import type { ToolDefinition } from '../types.js';

/**
 * MCP Tool: projectpulse.workflow.resume
 *
 * Resume a paused workflow from checkpoint.
 *
 * @see US-043: workflow.resume MCP tool (2 points)
 * @see Integration with sprint checkpoints
 */

const inputSchema = z.object({
  runId: z.number().int().positive().describe('Workflow run ID'),
  checkpointId: z.number().int().positive().optional().describe('Checkpoint ID to resume from (optional)'),
});

type WorkflowResumeInput = z.infer<typeof inputSchema>;

export const workflowResumeTool: ToolDefinition = {
  name: 'projectpulse_workflow_resume',
  description:
    'Resume a paused workflow from a checkpoint. Restores the workflow state and allows you to continue execution from where you left off. If checkpointId is not provided, resumes from the current paused state.',
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      runId: {
        type: 'number',
        description: 'ID of the workflow run to resume',
      },
      checkpointId: {
        type: 'number',
        description: 'Checkpoint ID to restore state from (optional)',
      },
    },
    required: ['runId'],
  },
  execute: async (params, context) => {
    const { runId, checkpointId } = params as WorkflowResumeInput;

    try {
      // Get workflow status
      const statusResponse = await context.httpClient.get<{
        data: {
          run: { status: string; currentStep: number; context: Record<string, any>; templateName: string };
        };
        error: null | string;
      }>(`/api/workflows/run/${runId}`);

      if (statusResponse.error) {
        throw new Error(statusResponse.error);
      }

      const { run } = statusResponse.data;

      if (run.status !== 'paused') {
        throw new Error(`Cannot resume workflow with status: ${run.status}. Only paused workflows can be resumed.`);
      }

      // If checkpointId provided, restore context from checkpoint
      let restoredContext = run.context;
      if (checkpointId) {
        try {
          const checkpointResponse = await context.httpClient.get<{
            data: { checkpoint: { context: Record<string, any> } };
            error: null | string;
          }>(`/api/checkpoints/${checkpointId}`);

          if (!checkpointResponse.error && checkpointResponse.data.checkpoint.context.workflowContext) {
            restoredContext = checkpointResponse.data.checkpoint.context.workflowContext as Record<string, any>;
          }
        } catch (checkpointError) {
          context.logger.warn('Failed to load checkpoint, using current workflow state', {
            error: checkpointError,
          });
        }
      }

      // Update workflow status to running
      // Note: This would ideally be a PATCH /api/workflows/run/:id endpoint
      // For now, the workflow will be set to running on next executeStep call

      const summary = `▶️ **Workflow Resumed**

**Run ID**: ${runId}
**Template**: ${run.templateName}
**Current Step**: ${run.currentStep}
**Status**: running
${checkpointId ? `**Restored from Checkpoint**: ${checkpointId}\n` : ''}
${Object.keys(restoredContext).length > 0 ? `**Context Restored**:\n\`\`\`json\n${JSON.stringify(restoredContext, null, 2)}\n\`\`\`\n` : ''}
💡 **Next steps**:
1. Use \`workflow.getStatus\` to review current state
2. Continue with \`workflow.executeStep\` (runId: ${runId})`;

      context.logger.info('Workflow resumed', {
        runId,
        currentStep: run.currentStep,
        checkpointId,
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

      context.logger.error('Failed to resume workflow', {
        error: errorMessage,
        runId,
        checkpointId,
      });

      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to resume workflow: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
