import { z } from 'zod';
import type { ToolDefinition, ToolContext } from './types.js';

const sprintGetCurrentTaskSchema = z.object({
  includeHistory: z.boolean().optional().default(false),
});

type SprintGetCurrentTaskInput = z.infer<typeof sprintGetCurrentTaskSchema>;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

interface CurrentTaskData {
  currentTask: {
    id: string;
    title: string;
    status: string;
    progress: number;
    day: { id: string; title: string; progress: number };
    week: { id: string; title: string; progress: number };
    phase: { id: string; title: string; progress: number };
  } | null;
}

async function handler(input: SprintGetCurrentTaskInput, context: ToolContext): Promise<string> {
  try {
    const queryParams = input.includeHistory ? '?includeHistory=true' : '';
    const url = `/api/tasks/current${queryParams}`;
    const response = await context.httpClient.get<ApiResponse<CurrentTaskData>>(url);

    if (response.success && response.data) {
      const { currentTask } = response.data;
      if (!currentTask) {
        return JSON.stringify({ status: 'no_active_task', message: 'No task is currently in progress' }, null, 2);
      }
      return JSON.stringify({
        status: 'active_task_found',
        currentTask: { id: currentTask.id, title: currentTask.title, status: currentTask.status, progress: currentTask.progress + '%' },
        context: {
          hierarchy: {
            phase: currentTask.phase.title + ' (' + currentTask.phase.progress + '% complete)',
            week: currentTask.week.title + ' (' + currentTask.week.progress + '% complete)',
            day: currentTask.day.title + ' (' + currentTask.day.progress + '% complete)',
          },
        },
      }, null, 2);
    } else {
      throw new Error(response.error?.message || 'Unknown API error');
    }
  } catch (error) {
    return JSON.stringify({ error: 'Failed to fetch current task', details: error instanceof Error ? error.message : 'Unknown error' }, null, 2);
  }
}

export const sprintGetCurrentTaskTool: ToolDefinition = {
  name: 'projectpulse.sprint.getCurrentTask',
  description: 'Retrieve the currently active task (status=IN_PROGRESS) with full hierarchical context (phase, week, day). Returns null if no task is active.',
  schema: sprintGetCurrentTaskSchema,
  inputSchema: {
    type: 'object',
    properties: {
      includeHistory: { type: 'boolean', description: 'Include recent session history (last 5 sessions)', default: false },
    },
  },
  execute: async (params, context) => {
    const input = params as SprintGetCurrentTaskInput;
    const result = await handler(input, context);
    context.logger.info('Current task query completed', { includeHistory: input.includeHistory });
    return { content: [{ type: 'text', text: result }] };
  },
};
