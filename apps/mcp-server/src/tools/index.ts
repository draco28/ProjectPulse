import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { ToolDefinition, ToolContext } from './types.js';
import { healthCheckTool } from './healthCheck.js';
import { sprintPhaseCreateTool } from './sprintPhaseCreate.js';
import { sprintGetCurrentTaskTool } from './sprintGetCurrentTask.js';
import { sprintUpdateProgressTool } from './sprintUpdateProgress.js';
import { sprintTaskCreateTool } from './sprintTaskCreate.js';
import { sprintSessionCreateTool } from './sprintSessionCreate.js';

const loadTools = (): ToolDefinition[] => [
  healthCheckTool,
  sprintPhaseCreateTool,
  sprintGetCurrentTaskTool,
  sprintUpdateProgressTool,
  sprintTaskCreateTool,
  sprintSessionCreateTool,
];

export const registerTools = (server: Server, context: ToolContext) => {
  const tools = loadTools();

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;
    const tool = tools.find((item) => item.name === name);

    if (!tool) {
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool "${name}". Available tools: ${tools.map((t) => t.name).join(', ')}`,
          },
        ],
        isError: true,
      };
    }

    try {
      const parsed = tool.schema.parse(rawArgs ?? {});
      return await tool.execute(parsed, context);
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      context.logger.error('Tool execution failed', { tool: tool.name, error: details });
      return {
        content: [
          {
            type: 'text',
            text: `Tool "${tool.name}" failed: ${details}`,
          },
        ],
        isError: true,
      };
    }
  });

  context.logger.info('Tools registered', { count: tools.length });
};
