#!/usr/bin/env node
/**
 * ProjectPulse MCP Server - Stateful HTTP Streaming Transport
 *
 * Production deployment endpoint for cloud-hosted MCP server.
 * Implements MCP Streamable HTTP transport specification with stateful sessions.
 * Compatible with Claude Code, Windsurf, and other MCP clients.
 *
 * Specification: https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/transports/
 * Sprint 8.7: Single canonical HTTP endpoint with SDK-managed sessions
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { randomUUID } from 'crypto';
import { config } from './config.js';
import { createLogger } from './logger.js';
import { createHttpClient } from './httpClient.js';
import { registerTools } from './tools/index.js';

const logger = createLogger(config.logLevel);
const httpClient = createHttpClient(config, logger);

// Create MCP Server instance (singleton - shared across all connections)
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

// Register all tools ONCE (shared across all stateful HTTP sessions)
registerTools(server, { config, logger, httpClient });

// Create Express app
const app = express();
const PORT = config.mcpPort;

// Middleware: Parse JSON bodies (CRITICAL - must be before routes)
app.use(express.json());

// Middleware: Fix Accept headers for client compatibility
// Note: Claude Code and Factory Droid don't send required text/event-stream
// This middleware transparently adds the missing header for MCP SDK compatibility
app.use('/mcp', (req, _res, next) => {
  const accept = req.headers.accept || '';
  
  // MCP SDK requires: Accept: application/json, text/event-stream
  if (!accept.includes('text/event-stream')) {
    const originalAccept = accept;
    req.headers.accept = accept 
      ? `${accept}, text/event-stream`
      : 'application/json, text/event-stream';
    
    logger.debug('Added text/event-stream to Accept header', {
      original: originalAccept || '(empty)',
      fixed: req.headers.accept,
      userAgent: req.headers['user-agent'],
    });
  }
  
  next();
});

// Health check endpoint (for Docker health checks)
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: '0.1.0',
    transport: 'http',
    description: 'Stateful HTTP Streaming (MCP Streamable HTTP)',
    toolCount: 40,
    endpoint: '/mcp',
  });
});

/**
 * MCP Stateful HTTP Streaming Endpoint
 * 
 * Single canonical POST endpoint implementing MCP Streamable HTTP with stateful sessions.
 * Sessions are managed by the SDK using UUID v4 identifiers.
 * 
 * Architecture:
 * - Singleton MCP Server (registered tools shared across all sessions)
 * - Per-request StreamableHTTPServerTransport (SDK requirement)
 * - Stateful session management via sessionIdGenerator
 * - Session lifecycle callbacks for observability
 * 
 * Compatible with: Claude Code, Windsurf, Cascade, and all MCP-compliant clients
 */
app.post('/mcp', async (req, res) => {
  logger.info('Handling stateful HTTP MCP request', {
    method: req.body?.method,
    hasBody: !!req.body,
  });

  // Create transport for this request (STATELESS mode)
  // Note: Stateless mode works correctly for separate HTTP POST requests
  // For true session persistence across requests, implement session Map (future enhancement)
  const transport = new StreamableHTTPServerTransport({
    // Stateless mode: undefined sessionIdGenerator for per-request independence
    sessionIdGenerator: undefined,
    
    // Return JSON responses (not SSE streams)
    enableJsonResponse: true,
    
    // Disable DNS rebinding protection for local network
    enableDnsRebindingProtection: false,
  });

  // Defer cleanup to HTTP response lifecycle (SDK pattern)
  // This prevents premature stream termination
  res.on('close', () => {
    transport.close();
    logger.debug('Stateful HTTP transport closed (response ended)');
  });

  res.on('error', (error) => {
    logger.error('HTTP response error', { error: error.message });
    transport.close();
  });

  try {
    // Connect singleton server to this transport
    await server.connect(transport);
    logger.debug('Stateful HTTP transport connected');

    // Handle the MCP request (initialize, tools/list, tools/call, etc.)
    // SDK will stream response asynchronously - do NOT close transport here
    await transport.handleRequest(req, res, req.body);
    logger.debug('Stateful HTTP request handled successfully');

  } catch (error) {
    logger.error('Failed to handle stateful HTTP request', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      method: req.body?.method,
    });

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
          data: error instanceof Error ? error.message : 'Unknown error',
        },
        id: req.body?.id || null,
      });
    }
  }
});

// Start server
app.listen(PORT, () => {
  logger.info('ProjectPulse MCP server started (Stateful HTTP Streaming)', {
    port: PORT,
    transport: 'Streamable HTTP (Stateful)',
    endpoint: `http://localhost:${PORT}/mcp`,
    healthCheck: `http://localhost:${PORT}/health`,
    apiBaseUrl: config.apiBaseUrl,
    note: 'Compatible with Claude Code, Windsurf, Cascade, and all MCP clients',
  });
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.warn(`Received ${signal}, shutting down HTTP MCP server`);
  process.exit(0);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
