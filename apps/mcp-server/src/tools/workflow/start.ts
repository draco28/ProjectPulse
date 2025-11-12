import { z } from 'zod';
import type { ToolDefinition } from '../types.js';

/**
 * MCP Tool: projectpulse.workflow.start
 *
 * Start a new workflow run from a template.
 *
 * @see US-039: workflow.start MCP tool (4 points)
 * @see POST /api/workflows/run endpoint
 */

const inputSchema = z.object({
  templateId: z.number().int().positive().describe('Workflow template ID'),
  projectId: z.number().int().positive().optional().describe('Project ID to associate with workflow (optional)'),
  initialContext: z.record(z.any()).optional().describe('Initial context data for workflow execution (optional)'),
});

type WorkflowStartInput = z.infer<typeof inputSchema>;

type WorkflowStartResponse = {
  data: {
    runId: number;
    status: string;
    currentStep: number;
    nextStepName: string;
  };
  error: null | string;
};

export const workflowStartTool: ToolDefinition = {
  name: 'projectpulse.workflow.start',
  description:
    'Start a new workflow run from a template. Returns the run ID and first step details. Use workflow.list to find available templates before starting. The workflow will be initialized in "pending" status and ready to execute steps.',
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      templateId: {
        type: 'number',
        description: 'ID of the workflow template to start',
      },
      projectId: {
        type: 'number',
        description: 'Project ID to associate with this workflow run (optional)',
      },
      initialContext: {
        type: 'object',
        description:
          'Initial context data for workflow execution (optional). Example: {"featureName": "auth", "branchName": "feature/auth"}',
      },
    },
    required: ['templateId'],
  },
  execute: async (params, context) => {
    const { templateId, projectId, initialContext } = params as WorkflowStartInput;

    try {
      const response = await context.httpClient.post<WorkflowStartResponse>('/api/workflows/run', {
        templateId,
        projectId,
        initialContext,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const { runId, status, currentStep, nextStepName } = response.data;

      const summary = `✅ Workflow run started successfully!

📋 **Run Details**:
• Run ID: ${runId}
• Status: ${status}
• Current Step: ${currentStep} - "${nextStepName}"

${projectId ? `🔗 Associated with Project ID: ${projectId}\n` : ''}${
        initialContext && Object.keys(initialContext).length > 0
          ? `📦 Initial Context: ${JSON.stringify(initialContext, null, 2)}\n`
          : ''
      }
💡 **Next steps**:
1. Execute the first step using \`workflow.executeStep\` with runId ${runId}
2. Monitor progress with \`workflow.getStatus\`
3. Use \`workflow.pause\` if you need to checkpoint and resume later`;

      context.logger.info('Workflow run started', {
        runId,
        templateId,
        projectId,
        status,
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

      context.logger.error('Failed to start workflow run', {
        error: errorMessage,
        templateId,
        projectId,
      });

      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to start workflow run: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
