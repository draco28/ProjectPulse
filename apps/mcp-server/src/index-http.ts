#!/usr/bin/env node
/**
 * ProjectPulse MCP Server - SSE Transport
 *
 * Production deployment endpoint for cloud-hosted MCP server.
 * Implements MCP SSE (Server-Sent Events) transport specification.
 * Compatible with Claude Code's SSE MCP client.
 *
 * Specification: https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/transports/
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { config } from './config.js';
import { createLogger } from './logger.js';
import { createHttpClient } from './httpClient.js';
import { registerTools, loadTools } from './tools/index.js';

const logger = createLogger(config.logLevel);
const httpClient = createHttpClient(config, logger);

// Create MCP Server instance (shared across all connections)
const server = new Server(
  {
    name: 'projectpulse-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register all tools ONCE (shared across all HTTP sessions)
registerTools(server, { config, logger, httpClient });

// SSE session management: Map of session ID -> transport
const sseSessions = new Map<string, SSEServerTransport>();

// Create Express app
const app = express();
const PORT = config.mcpPort;

// Middleware: Parse JSON bodies (CRITICAL - must be before routes)
app.use(express.json());

// Health check endpoint (for Docker health checks)
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: '0.1.0',
    transport: 'hybrid',
    transports: ['sse', 'streamable-http', 'json-rpc'],
    toolCount: 40,
    activeSSESessions: sseSessions.size,
  });
});

// JSON-RPC endpoint for Factory Droid compatibility  
// Simple stateless JSON-RPC 2.0 over HTTP (no special Accept headers required)
// Note: This endpoint provides a workaround for Factory Droid's HTTP client
// which doesn't send the required "text/event-stream" Accept header for Streamable HTTP
app.post('/mcp/json-rpc', async (req, res) => {
  try {
    logger.info('Handling JSON-RPC request', { method: req.body?.method });

    const request = req.body;

    // Validate JSON-RPC 2.0 format
    if (!request || request.jsonrpc !== '2.0' || !request.method) {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: 'Invalid Request: Must be JSON-RPC 2.0 format',
        },
        id: request?.id || null,
      });
    }

    // Handle MCP protocol methods with simple responses
    // This is intentionally simple - no transport overhead, just direct responses
    let result;

    // Check if this is a notification (no id field or id is null/undefined)
    const isNotification = request.id === null || request.id === undefined;

    if (isNotification) {
      // Notifications don't require a JSON-RPC response, just acknowledge with 200 OK
      logger.debug('JSON-RPC notification received', { method: request.method });
      
      // Handle specific notifications if needed
      switch (request.method) {
        case 'notifications/initialized':
          logger.info('Client initialization completed');
          break;
        case 'notifications/cancelled':
          logger.info('Client cancelled request', { params: request.params });
          break;
        default:
          logger.debug('Unhandled notification', { method: request.method });
      }
      
      // For notifications, return empty 200 OK (no body needed for JSON-RPC notifications)
      res.writeHead(200, { 'Content-Length': '0' });
      return res.end();
    }

    // Handle requests (have id field, require response)
    switch (request.method) {
      case 'initialize':
        result = {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'projectpulse-mcp',
            version: '0.1.0',
          },
        };
        break;

      case 'tools/list':
        // Load tools directly (same tools that are registered with the MCP server)
        const tools = loadTools();
        result = {
          tools: tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          })),
        };
        break;

      case 'resources/list':
        result = { resources: [] };
        break;

      case 'prompts/list':
        result = { prompts: [] };
        break;

      case 'ping':
        result = {}; // Simple pong response
        break;

      default:
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`,
          },
          id: request.id,
        });
    }

    res.json({
      jsonrpc: '2.0',
      result,
      id: request.id,
    });

    logger.debug('JSON-RPC request completed', { method: request.method });
  } catch (error) {
    logger.error('JSON-RPC request failed', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : 'Unknown error',
        },
        id: req.body?.id || null,
      });
    }
  }
});

// MCP SSE endpoint - GET establishes SSE stream
app.get('/mcp', async (_req, res) => {
  logger.info('SSE connection established');

  // Create transport with POST endpoint for client messages
  const transport = new SSEServerTransport('/mcp', res, {
    // DNS rebinding protection (optional)
    enableDnsRebindingProtection: false,
  });

  try {
    // Connect server to this transport (connect() automatically calls start())
    await server.connect(transport);

    // Store session for POST message routing
    sseSessions.set(transport.sessionId, transport);
    logger.info('MCP SSE session started', {
      sessionId: transport.sessionId,
      totalSessions: sseSessions.size
    });

    // Clean up on close
    transport.onclose = () => {
      sseSessions.delete(transport.sessionId);
      logger.info('MCP SSE session closed', {
        sessionId: transport.sessionId,
        remainingSessions: sseSessions.size
      });
    };

    transport.onerror = (error) => {
      logger.error('MCP SSE transport error', {
        sessionId: transport.sessionId,
        error: error.message
      });
      sseSessions.delete(transport.sessionId);
    };

  } catch (error) {
    logger.error('Failed to start SSE session', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to start SSE session',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// MCP endpoint - POST handles both SSE messages and Streamable HTTP requests
// DUAL TRANSPORT DETECTION:
// - If sessionId query parameter exists → SSE message (stateful)
// - If no sessionId → Streamable HTTP request (stateless)
app.post('/mcp', async (req, res) => {
  try {
    // Extract session ID from URL query parameter (sent by SSE client)
    const sessionId = req.query.sessionId as string;

    // CASE 1: SSE Message (has sessionId query parameter)
    if (sessionId) {
      logger.debug('Handling SSE message', { sessionId });

      // Find the transport for this session
      const transport = sseSessions.get(sessionId);

      if (!transport) {
        logger.warn('POST message for unknown SSE session', { sessionId });
        return res.status(404).json({ error: 'Session not found' });
      }

      // Handle the message via SSE transport
      await transport.handlePostMessage(req, res, req.body);
      return;
    }

    // CASE 2: Streamable HTTP Request (no sessionId - stateless)
    logger.info('Handling Streamable HTTP request');

    // Create a new transport for this request (stateless mode)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode
      enableDnsRebindingProtection: false,
      enableJsonResponse: true, // Return JSON instead of SSE stream for HTTP clients
    });

    try {
      // Connect server to this transport
      await server.connect(transport);
      logger.debug('Streamable HTTP transport connected');

      // Handle the request
      await transport.handleRequest(req, res, req.body);
      logger.debug('Streamable HTTP request handled');

    } finally {
      // Cleanup (Streamable HTTP is stateless - close after each request)
      await transport.close();
      logger.debug('Streamable HTTP transport closed');
    }

  } catch (error) {
    logger.error('Failed to handle POST message', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to handle message',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// Start server
app.listen(PORT, () => {
  logger.info('ProjectPulse MCP server started (SSE)', {
    port: PORT,
    endpoint: `http://localhost:${PORT}/mcp`,
    healthCheck: `http://localhost:${PORT}/health`,
    apiBaseUrl: config.apiBaseUrl,
  });
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.warn(`Received ${signal}, shutting down HTTP MCP server`);
  process.exit(0);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
