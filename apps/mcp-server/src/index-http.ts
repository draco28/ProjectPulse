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
import { authContext, type AgentAuth } from './authContext.js';

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
//
// ROOT CAUSE IDENTIFIED: MCP SDK reads from req.rawHeaders, not req.headers!
// - req.headers is Express's parsed object (mutable)
// - req.rawHeaders is Node.js HTTP parser array (immutable, set before middleware)
// - SDK validation uses raw headers, so we must modify the rawHeaders array
app.use('/mcp', (req, _res, next) => {
  const accept = req.headers.accept || '';

  // MCP SDK requires BOTH: application/json AND text/event-stream
  const needsJson = !accept.includes('application/json');
  const needsStream = !accept.includes('text/event-stream');

  if (needsJson || needsStream) {
    const originalAccept = accept;
    let fixedAccept = accept || '';

    // Add missing content types
    if (needsJson && needsStream) {
      // Neither present - add both
      fixedAccept = fixedAccept
        ? `${fixedAccept}, application/json, text/event-stream`
        : 'application/json, text/event-stream';
    } else if (needsJson) {
      // Only JSON missing
      fixedAccept = fixedAccept
        ? `${fixedAccept}, application/json`
        : 'application/json';
    } else {
      // Only stream missing
      fixedAccept = fixedAccept
        ? `${fixedAccept}, text/event-stream`
        : 'text/event-stream';
    }

    // Fix 1: Update req.headers (for Express/middleware compatibility)
    req.headers.accept = fixedAccept;

    // Fix 2: Update req.rawHeaders array (SDK reads from here!)
    // rawHeaders is ['Header-Name', 'value', 'Another-Header', 'value', ...]
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      if (req.rawHeaders[i]?.toLowerCase() === 'accept') {
        req.rawHeaders[i + 1] = fixedAccept;
        break;
      }
    }

    logger.debug('Fixed Accept header in both req.headers and req.rawHeaders', {
      original: originalAccept || '(empty)',
      fixed: fixedAccept,
      userAgent: req.headers['user-agent'],
    });
  }

  next();
});

// Middleware: Agent Bearer Auth (Sprint 9)
// Validates agent tokens via web app and attaches projectId to request
//
// NOTE: Currently, validated projectId is attached to req.agentAuth but not
// automatically passed to tool context. Tools that require project scoping
// should accept projectId as a parameter, which the web app APIs will validate
// against the token's projectId for defense-in-depth security.
//
// TODO (Future): Refactor tool execution to pass req.agentAuth.projectId
// as part of ToolContext so tools can use validated projectId directly.
app.use('/mcp', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('MCP request missing bearer token', {
      path: req.path,
      method: req.method,
    });
    return res.status(401).json({
      jsonrpc: '2.0',
      error: {
        code: -32001,
        message: 'Unauthorized: Missing bearer token',
      },
      id: null,
    });
  }

  const rawToken = authHeader.slice('Bearer '.length);

  try {
    // Validate token via web app (MCP never hits DB directly)
    // Sprint 10: Now includes tool permissions (blockedTools, allowedTools)
    const agentAuth = await httpClient.post<{
      projectId: number;
      tokenId: number;
      name: string;
      blockedTools: string[];
      allowedTools: string[];
    }>(
      '/api/agent-auth/validate',
      { token: rawToken }
    );
    
    // Attach agent auth to request for tools
    (req as any).agentAuth = agentAuth;
    
    logger.debug('Agent authenticated', {
      projectId: agentAuth.projectId,
      tokenName: agentAuth.name,
      hasToolRestrictions: agentAuth.blockedTools.length > 0 || agentAuth.allowedTools.length > 0,
    });
    
    return next();
  } catch (error: any) {
    logger.warn('Agent auth failed', {
      error: error.message,
      status: error.response?.status,
    });
    
    return res.status(401).json({
      jsonrpc: '2.0',
      error: {
        code: -32001,
        message: 'Unauthorized: Invalid or expired token',
      },
      id: null,
    });
  }
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
  // Sprint 10: Build auth context from validated middleware data
  const reqAgentAuth = (req as any).agentAuth as {
    projectId: number;
    tokenId: number;
    name: string;
    blockedTools: string[];
    allowedTools: string[];
  } | undefined;
  const rawToken = req.headers.authorization?.slice('Bearer '.length) || '';
  
  // Create AgentAuth context for AsyncLocalStorage
  const agentAuthContext: AgentAuth | undefined = reqAgentAuth ? {
    projectId: reqAgentAuth.projectId,
    tokenId: reqAgentAuth.tokenId,
    tokenName: reqAgentAuth.name,
    rawToken,
    blockedTools: reqAgentAuth.blockedTools,
    allowedTools: reqAgentAuth.allowedTools,
  } : undefined;
  
  logger.info('Handling stateful HTTP MCP request', {
    method: req.body?.method,
    hasBody: !!req.body,
    projectId: agentAuthContext?.projectId,
  });

  // Wrap entire request handling with auth context
  // This allows httpClient to access auth via getAgentAuth()
  const handleMcpRequest = async () => {
    // Create transport for this request (STATELESS mode)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
      enableDnsRebindingProtection: false,
    });

    // Defer cleanup to HTTP response lifecycle (SDK pattern)
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
  };

  // Execute with auth context (enables httpClient to access credentials)
  if (agentAuthContext) {
    await authContext.run(agentAuthContext, handleMcpRequest);
  } else {
    // Fallback for unauthenticated requests (should not happen due to middleware)
    await handleMcpRequest();
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
