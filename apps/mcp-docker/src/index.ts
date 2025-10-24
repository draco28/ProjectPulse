#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Custom MCP Server for Docker management in DevHub
 * Provides tools to interact with Docker containers from Claude Code
 */

interface DockerLogsArgs {
  container: string;
  tail?: number;
}

interface DockerRestartArgs {
  container: string;
}

interface DockerInspectArgs {
  container: string;
}

// Create MCP server instance
const server = new Server(
  {
    name: 'docker-devhub',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available Docker tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'docker_status',
        description: 'Show status of all Docker containers with their names, status, and ports',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'docker_logs',
        description: 'View logs from a specific Docker container. Useful for debugging.',
        inputSchema: {
          type: 'object',
          properties: {
            container: {
              type: 'string',
              description: 'Container name or ID (e.g., "moksha-db", "moksha-web")',
            },
            tail: {
              type: 'number',
              description: 'Number of lines to show from the end (default: 50)',
              default: 50,
            },
          },
          required: ['container'],
        },
      },
      {
        name: 'docker_restart',
        description: 'Restart a specific Docker container. Useful when configuration changes.',
        inputSchema: {
          type: 'object',
          properties: {
            container: {
              type: 'string',
              description: 'Container name or ID to restart',
            },
          },
          required: ['container'],
        },
      },
      {
        name: 'docker_stats',
        description:
          'Show resource usage statistics for all running containers (CPU, memory, network)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'docker_inspect',
        description:
          'Get detailed information about a specific container (config, network, volumes)',
        inputSchema: {
          type: 'object',
          properties: {
            container: {
              type: 'string',
              description: 'Container name or ID to inspect',
            },
          },
          required: ['container'],
        },
      },
      {
        name: 'docker_compose_status',
        description: 'Show status of Docker Compose services in the DevHub project',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

/**
 * Handle tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'docker_status': {
        const { stdout } = await execAsync(
          'docker ps -a --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"'
        );
        return {
          content: [
            {
              type: 'text',
              text: `Docker Container Status:\n\n${stdout}`,
            },
          ],
        };
      }

      case 'docker_logs': {
        const { container, tail = 50 } = args as unknown as DockerLogsArgs;
        const { stdout } = await execAsync(`docker logs ${container} --tail ${tail}`);
        return {
          content: [
            {
              type: 'text',
              text: `Logs for ${container} (last ${tail} lines):\n\n${stdout}`,
            },
          ],
        };
      }

      case 'docker_restart': {
        const { container } = args as unknown as DockerRestartArgs;
        const { stdout } = await execAsync(`docker restart ${container}`);
        return {
          content: [
            {
              type: 'text',
              text: `Container ${container} restarted successfully.\n${stdout}`,
            },
          ],
        };
      }

      case 'docker_stats': {
        const { stdout } = await execAsync(
          'docker stats --no-stream --format "table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}"'
        );
        return {
          content: [
            {
              type: 'text',
              text: `Docker Container Resource Usage:\n\n${stdout}`,
            },
          ],
        };
      }

      case 'docker_inspect': {
        const { container } = args as unknown as DockerInspectArgs;
        const { stdout } = await execAsync(
          `docker inspect ${container} --format "{{json .}}" | node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync(0, 'utf-8')), null, 2))"`
        );
        return {
          content: [
            {
              type: 'text',
              text: `Container ${container} details:\n\n${stdout}`,
            },
          ],
        };
      }

      case 'docker_compose_status': {
        const { stdout } = await execAsync(
          'docker-compose ps --format "table {{.Name}}\\t{{.Status}}\\t{{.Ports}}"',
          { cwd: 'F:\\Web_Projects\\AI_HUB' }
        );
        return {
          content: [
            {
              type: 'text',
              text: `Docker Compose Services Status:\n\n${stdout}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the MCP server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Docker MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
