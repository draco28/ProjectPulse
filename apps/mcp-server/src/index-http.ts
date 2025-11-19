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
import { registerTools } from './tools/index.js';

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
    transports: ['sse', 'streamable-http'],
    toolCount: 40,
    activeSSESessions: sseSessions.size,
  });
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
