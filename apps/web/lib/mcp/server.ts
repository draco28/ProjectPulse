/**
 * MCP Server Singleton
 *
 * Sprint 5.5 - MCP Server Infrastructure (Day 2)
 * Created: 2025-11-12, Updated: 2025-11-13
 *
 * This module provides a singleton instance of the MCP (Model Context Protocol) server
 * that handles tool registration, resource management, and request processing for
 * AI coding agents (Claude Code, Cursor AI, Codex).
 *
 * Architecture:
 * - Singleton pattern ensures single server instance across all HTTP requests
 * - Tools are registered via handler exports
 * - Resources provide context injection for agents
 * - HTTP transport via app/api/mcp/route.ts
 *
 * @see https://modelcontextprotocol.io/docs
 * @see apps/web/.agent/task/sprint-5.5-mcp-server-plan.md
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { createLogger } from '@/lib/logger';

const log = createLogger({ module: 'MCP:Server' });

/**
 * MCP Server Configuration
 */
const SERVER_CONFIG = {
  name: 'projectpulse-mcp',
  version: '1.0.0',
} as const;

/**
 * MCP Server Capabilities
 *
 * Declares what features this MCP server supports.
 * Phase 1 (MVP): Tools and resources
 *
 * Note: The SDK expects specific capability shapes.
 * Empty objects indicate support but no specific config needed.
 */
const SERVER_CAPABILITIES = {
  // Phase 1: Tool invocation support
  tools: {},

  // Phase 1: Resource access support (knowledge items, issues, etc.)
  resources: {},

  // Future: Prompt templates (not in Sprint 5.5 scope)
  // prompts: {},
} as const;

/**
 * Singleton MCP Server Instance
 *
 * Created once on first import, reused across all HTTP requests.
 * This ensures tool registry is shared and consistent.
 */
let mcpServerInstance: Server | null = null;

/**
 * Get or create the singleton MCP server instance.
 *
 * This function initializes the MCP server with:
 * - Server metadata (name, version)
 * - Capabilities (tools, resources)
 * - Tool registry (populated by route handler)
 *
 * @returns MCP Server instance
 *
 * @example
 * ```typescript
 * import { getMCPServer } from '@/lib/mcp/server';
 *
 * const server = getMCPServer();
 * // Use server in route handler
 * ```
 */
export function getMCPServer(): Server {
  if (mcpServerInstance) {
    return mcpServerInstance;
  }

  // Create new MCP server instance
  mcpServerInstance = new Server(
    {
      name: SERVER_CONFIG.name,
      version: SERVER_CONFIG.version,
    },
    {
      capabilities: SERVER_CAPABILITIES,
    }
  );

  // Log server initialization
  log.info({ name: SERVER_CONFIG.name, version: SERVER_CONFIG.version }, 'MCP Server initialized');
  log.info({ capabilities: Object.keys(SERVER_CAPABILITIES) }, 'MCP Server capabilities');

  return mcpServerInstance;
}

/**
 * Reset the singleton instance (for testing only).
 *
 * @internal
 */
export function resetMCPServer(): void {
  if (mcpServerInstance) {
    // Note: Server class doesn't have a close() method in SDK v1.20.2
    // Just clear the reference
    mcpServerInstance = null;
    log.info('MCP Server instance reset');
  }
}

/**
 * Get server metadata.
 *
 * @returns Server name and version
 */
export function getServerInfo() {
  return {
    ...SERVER_CONFIG,
    capabilities: Object.keys(SERVER_CAPABILITIES),
  };
}

/**
 * Export knowledge tool handlers for registration in route handler
 */
export {
  knowledgeSearchHandler,
  knowledgeCreateHandler,
  knowledgeRelatedHandler,
  knowledgeGetMetricsHandler,
  knowledgeExportHandler,
  knowledgeImportHandler,
  knowledgeArchiveHandler,
} from './handlers/knowledge-handler';

/**
 * Export skill tool handlers for registration in route handler
 */
export {
  skillListHandler,
  skillLoadHandler,
  skillSearchHandler,
  skillUpdateHandler,
  skillDeleteHandler,
  skillExportHandler,
  skillImportHandler,
  skillLinkKnowledgeHandler,
} from './handlers/skill-handler';

/**
 * Export knowledge resource handlers for registration in route handler
 */
export { listKnowledgeResources, readKnowledgeResource } from './resources/knowledge-resource';

/**
 * Export ticket tool handlers for registration in route handler (Sprint 10)
 */
export {
  ticketCreateHandler,
  ticketBulkCreateHandler,
  ticketUpdateHandler,
  ticketSearchHandler,
  ticketAddCommentHandler,
  ticketSetStatusHandler,
  // Issue compatibility handlers (adapters)
  issueCreateHandler,
  issueBulkCreateHandler,
  issueUpdateHandler,
  issueSearchHandler,
  issueAddCommentHandler,
  issueSetStatusHandler,
} from './handlers/ticket-handler';
