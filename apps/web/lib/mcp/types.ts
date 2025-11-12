/**
 * MCP Server Type Definitions
 *
 * Sprint 5.5 - MCP Server Infrastructure
 * Created: 2025-11-12
 *
 * This module defines TypeScript types and constants for the MCP server implementation,
 * including JSON-RPC 2.0 error codes, custom error classes, and session management types.
 *
 * @see https://www.jsonrpc.org/specification
 * @see https://modelcontextprotocol.io/docs
 */

/**
 * JSON-RPC 2.0 Error Codes
 *
 * Standard error codes as defined by JSON-RPC 2.0 specification,
 * plus MCP-specific error codes.
 *
 * @see https://www.jsonrpc.org/specification#error_object
 */
export const JSONRPC_ERROR_CODES = {
  /** Invalid JSON was received by the server */
  PARSE_ERROR: -32700,

  /** The JSON sent is not a valid Request object */
  INVALID_REQUEST: -32600,

  /** The method does not exist / is not available */
  METHOD_NOT_FOUND: -32601,

  /** Invalid method parameter(s) */
  INVALID_PARAMS: -32602,

  /** Internal JSON-RPC error */
  INTERNAL_ERROR: -32603,

  /** Server error (reserved range: -32000 to -32099) */
  SERVER_ERROR: -32000,

  // MCP-specific error codes (custom range: -33000 to -33099)

  /** Tool not found in registry */
  TOOL_NOT_FOUND: -33001,

  /** Tool execution failed */
  TOOL_EXECUTION_ERROR: -33002,

  /** Resource not found */
  RESOURCE_NOT_FOUND: -33003,

  /** Invalid session ID */
  INVALID_SESSION: -33004,

  /** Session expired */
  SESSION_EXPIRED: -33005,

  /** Rate limit exceeded */
  RATE_LIMIT_EXCEEDED: -33006,
} as const;

/**
 * JSON-RPC 2.0 Error Response
 *
 * Standard error object structure.
 */
export interface JSONRPCError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * JSON-RPC 2.0 Request
 *
 * Standard request object structure.
 */
export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

/**
 * JSON-RPC 2.0 Response (Success)
 */
export interface JSONRPCSuccessResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result: unknown;
}

/**
 * JSON-RPC 2.0 Response (Error)
 */
export interface JSONRPCErrorResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  error: JSONRPCError;
}

/**
 * JSON-RPC 2.0 Response (Union type)
 */
export type JSONRPCResponse = JSONRPCSuccessResponse | JSONRPCErrorResponse;

/**
 * Custom MCP Error Class
 *
 * Extends Error with MCP-specific properties for structured error handling.
 * Used throughout the MCP server to provide consistent error responses.
 *
 * @example
 * ```typescript
 * throw new MCPError(
 *   'Tool not found',
 *   JSONRPC_ERROR_CODES.TOOL_NOT_FOUND,
 *   404,
 *   { toolName: 'knowledge.search' }
 * );
 * ```
 */
export class MCPError extends Error {
  /** JSON-RPC error code */
  public readonly code: number;

  /** HTTP status code (for REST API compatibility) */
  public readonly statusCode: number;

  /** Additional error data */
  public readonly data?: unknown;

  /**
   * Create a new MCP error.
   *
   * @param message - Human-readable error message
   * @param code - JSON-RPC error code
   * @param statusCode - HTTP status code (default: 500)
   * @param data - Additional error context
   */
  constructor(
    message: string,
    code: number = JSONRPC_ERROR_CODES.INTERNAL_ERROR,
    statusCode: number = 500,
    data?: unknown
  ) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.statusCode = statusCode;
    this.data = data;

    // Maintain proper stack trace (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MCPError);
    }
  }

  /**
   * Convert error to JSON-RPC error object.
   */
  toJSONRPC(): JSONRPCError {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
    };
  }

  /**
   * Convert error to JSON-RPC error response.
   */
  toJSONRPCResponse(id: string | number | null = null): JSONRPCErrorResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: this.toJSONRPC(),
    };
  }
}

/**
 * MCP Session
 *
 * Represents an active MCP session with metadata and state.
 */
export interface MCPSession {
  /** Unique session identifier (UUID v4) */
  id: string;

  /** Session creation timestamp */
  createdAt: Date;

  /** Last access timestamp (for TTL expiration) */
  lastAccessedAt: Date;

  /** Session-specific metadata (tool state, context, etc.) */
  metadata: Record<string, unknown>;
}

/**
 * MCP Tool Definition
 *
 * Structure for registering tools with the MCP server.
 */
export interface MCPToolDefinition {
  /** Tool name (e.g., "knowledge.search") */
  name: string;

  /** Tool description for AI agents */
  description: string;

  /** JSON Schema for tool input parameters */
  inputSchema: Record<string, unknown>;

  /** Tool handler function */
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * MCP Resource Definition
 *
 * Structure for registering resources with the MCP server.
 */
export interface MCPResourceDefinition {
  /** Resource URI pattern (e.g., "knowledge://item/{id}") */
  uri: string;

  /** Resource name for display */
  name: string;

  /** Resource description */
  description: string;

  /** MIME type (e.g., "text/markdown", "application/json") */
  mimeType: string;

  /** Resource handler function */
  handler: (uri: string) => Promise<unknown>;
}

/**
 * MCP Server Stats
 *
 * Runtime statistics for monitoring and debugging.
 */
export interface MCPServerStats {
  /** Total requests handled */
  totalRequests: number;

  /** Active sessions count */
  activeSessions: number;

  /** Registered tools count */
  toolsCount: number;

  /** Registered resources count */
  resourcesCount: number;

  /** Server uptime in milliseconds */
  uptimeMs: number;

  /** Average response time in milliseconds */
  avgResponseTimeMs: number;
}

/**
 * Type guard: Check if error is MCPError
 */
export function isMCPError(error: unknown): error is MCPError {
  return error instanceof MCPError;
}

/**
 * Type guard: Check if response is error response
 */
export function isJSONRPCErrorResponse(
  response: JSONRPCResponse
): response is JSONRPCErrorResponse {
  return 'error' in response;
}

/**
 * Type guard: Check if response is success response
 */
export function isJSONRPCSuccessResponse(
  response: JSONRPCResponse
): response is JSONRPCSuccessResponse {
  return 'result' in response;
}
