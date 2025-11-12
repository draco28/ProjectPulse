import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';
import {
  ApiResponse,
  IssueRecord,
  baseIssueFields,
  buildErrorPayload,
  buildSuccessPayload,
  issueIdSchema,
  issueInputProperties,
  summarizeIssue,
} from './common.js';

const issueUpdateSchema = baseIssueFields.omit({ projectId: true }).extend({
  issueId: issueIdSchema,
}).refine(
  (data) =>
    data.title !== undefined ||
    data.description !== undefined ||
    data.status !== undefined ||
    data.priority !== undefined ||
    data.module !== undefined ||
    data.assignee !== undefined ||
    data.labelIds !== undefined ||
    data.customFields !== undefined ||
    data.context !== undefined,
  {
    message: 'Provide at least one field to update',
    path: [],
  }
);

type IssueUpdateInput = z.infer<typeof issueUpdateSchema>;

async function handler(input: IssueUpdateInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;

  const { issueId, ...payload } = input;

  try {
    const response = await httpClient.patch<ApiResponse<IssueRecord>>(`/api/issues/${issueId}`, payload);

    if (!response.data) {
      return buildErrorPayload(response.error?.message ?? 'Failed to update issue', response.error?.code);
    }

    logger.info('[issue.update] Issue updated', { id: issueId });
    return buildSuccessPayload({ issue: summarizeIssue(response.data) });
  } catch (error) {
    logger.error('[issue.update] Unexpected error', { error, issueId });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const issueUpdateTool: ToolDefinition = {
  name: 'projectpulse.issue.update',
  description:
    'Update an existing issue (status, priority, module, labels, custom fields, or context metadata). Does not change comments; use issue.addComment for notes.',
  schema: issueUpdateSchema,
  inputSchema: {
    type: 'object',
    properties: {
      issueId: {
        type: 'number',
        description: 'Numeric issue identifier',
      },
      title: issueInputProperties.title,
      description: issueInputProperties.description,
      status: issueInputProperties.status,
      priority: issueInputProperties.priority,
      module: issueInputProperties.module,
      assignee: issueInputProperties.assignee,
      labelIds: issueInputProperties.labelIds,
      customFields: issueInputProperties.customFields,
      context: issueInputProperties.context,
    },
    required: ['issueId'],
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = issueUpdateSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
