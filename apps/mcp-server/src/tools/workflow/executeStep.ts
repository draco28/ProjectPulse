import { z } from 'zod';
import type { ToolDefinition } from '../types.js';

/**
 * MCP Tool: projectpulse.workflow.executeStep
 *
 * Execute the next step in a workflow run.
 *
 * @see US-040: workflow.executeStep MCP tool (4 points)
 * @see POST /api/workflows/run/:id/step endpoint
 */

const inputSchema = z.object({
  runId: z.number().int().positive().describe('Workflow run ID'),
  stepResult: z.record(z.any()).optional().describe('Result data from completed step (optional)'),
});

type WorkflowExecuteStepInput = z.infer<typeof inputSchema>;

type WorkflowExecuteStepResponse = {
  data: {
    stepNumber: number;
    stepName: string;
    status: 'completed' | 'failed';
    nextStep: {
      stepNumber: number;
      name: string;
      description: string;
    } | null;
    workflowStatus: 'running' | 'completed' | 'failed';
  };
  error: null | string;
};

export const workflowExecuteStepTool: ToolDefinition = {
  name: 'projectpulse.workflow.executeStep',
  description:
    'Execute the current step in a workflow run. Marks the current step as completed and advances to the next step. Optionally provide step result data to be stored. Returns next step details or workflow completion status.',
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      runId: {
        type: 'number',
        description: 'ID of the workflow run',
      },
      stepResult: {
        type: 'object',
        description:
          'Result data from the completed step (optional). Example: {"branchName": "feature/auth", "filesCreated": ["auth.ts"]}',
      },
    },
    required: ['runId'],
  },
  execute: async (params, context) => {
    const { runId, stepResult } = params as WorkflowExecuteStepInput;

    try {
      const response = await context.httpClient.post<WorkflowExecuteStepResponse>(
        `/api/workflows/run/${runId}/step`,
        {
          stepResult,
        }
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const { stepNumber, stepName, status, nextStep, workflowStatus } = response.data;

      if (workflowStatus === 'completed') {
        const summary = `✅ Step ${stepNumber} "${stepName}" completed!

🎉 **Workflow Complete!**
All steps have been executed successfully.

Use \`workflow.complete\` to finalize the workflow run.`;

        context.logger.info('Workflow step executed - workflow complete', {
          runId,
          stepNumber,
          stepName,
          workflowStatus,
        });

        return {
          content: [
            {
              type: 'text',
              text: summary,
            },
          ],
        };
      }

      const summary = `✅ Step ${stepNumber} "${stepName}" completed successfully!

${nextStep ? `➡️ **Next Step**: ${nextStep.stepNumber} - "${nextStep.name}"
${nextStep.description}

💡 Execute the next step with \`workflow.executeStep\` (runId: ${runId})` : '⚠️ No more steps available'}

📊 **Workflow Status**: ${workflowStatus}`;

      context.logger.info('Workflow step executed', {
        runId,
        stepNumber,
        stepName,
        nextStepNumber: nextStep?.stepNumber,
        workflowStatus,
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

      context.logger.error('Failed to execute workflow step', {
        error: errorMessage,
        runId,
      });

      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to execute workflow step: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
