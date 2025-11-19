/**
 * Raw MCP Protocol Client - SSE Bidirectional Communication
 *
 * Properly implements SSE transport with bidirectional communication:
 * - GET /mcp establishes SSE stream (server → client events)
 * - POST /mcp?sessionId=X sends requests (client → server messages)
 * - Responses come via SSE events, NOT POST responses (202 Accepted is normal)
 *
 * This matches how Claude Code, Cascade, and other real agents work.
 *
 * Protocol Flow:
 * 1. GET /mcp - Establish SSE stream, get sessionId from 'endpoint' event
 * 2. Listen continuously for 'message' events on SSE stream
 * 3. POST /mcp?sessionId=X - Send JSON-RPC request (returns 202 Accepted)
 * 4. Parse JSON-RPC response from 'message' event on SSE stream
 * 5. Match response.id to request.id to resolve the correct promise
 *
 * Usage:
 * ```typescript
 * const client = new MCPTestClient('http://192.168.1.15:3001');
 * await client.connect();
 * const result = await client.callToolJSON('projectpulse.health_check', {});
 * await client.disconnect();
 * ```
 */

import * as http from 'node:http';
import { URL } from 'node:url';

export interface MCPToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, any>;
}

interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface PendingRequest {
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  method: string;
}

export class MCPTestClient {
  private sessionId?: string;
  private connected: boolean = false;
  private requestId: number = 0;
  private sseRequest?: http.ClientRequest;
  private sseResponse?: http.IncomingMessage;

  // Map of request ID → pending promise (resolve/reject)
  private pendingRequests = new Map<number, PendingRequest>();

  constructor(private baseUrl: string) {}

  /**
   * Connect to MCP server via SSE transport
   * Opens SSE stream and listens for events continuously
   */
  async connect(): Promise<void> {
    if (this.connected) {
      throw new Error('Client already connected');
    }

    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}/mcp`);

      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      };

      // Create SSE connection (keep alive for entire session)
      this.sseRequest = http.request(options, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`SSE connection failed with status ${res.statusCode}`));
          return;
        }

        this.sseResponse = res;
        let buffer = '';
        let connectionEstablished = false;

        // Parse SSE events continuously
        res.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          let currentEvent = '';
          let currentData = '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
              currentData = line.substring(5).trim();
            } else if (line === '') {
              // End of event - process it
              if (currentEvent && currentData) {
                this.handleSSEEvent(currentEvent, currentData);

                // Resolve connection promise when we get sessionId
                if (currentEvent === 'endpoint' && !connectionEstablished) {
                  connectionEstablished = true;
                  resolve();
                }
              }
              currentEvent = '';
              currentData = '';
            }
          }
        });

        res.on('error', (error) => {
          this.connected = false;
          reject(new Error(`SSE connection error: ${error.message}`));
        });

        res.on('end', () => {
          console.log('[MCPTestClient] SSE stream closed by server');
          this.connected = false;
          // Reject any pending requests
          for (const [id, pending] of this.pendingRequests.entries()) {
            pending.reject(new Error('SSE connection closed'));
            this.pendingRequests.delete(id);
          }
        });
      });

      this.sseRequest.on('error', (error) => {
        this.connected = false;
        reject(new Error(`Failed to connect to MCP server: ${error.message}`));
      });

      this.sseRequest.end();

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('Connection timeout - no sessionId received'));
        }
      }, 5000);
    });
  }

  /**
   * Handle SSE event from server
   */
  private handleSSEEvent(event: string, data: string): void {
    if (event === 'endpoint') {
      // Extract sessionId from endpoint URL
      // Format: /mcp?sessionId=abc-123-def
      const match = data.match(/sessionId=([^&]+)/);
      if (match) {
        this.sessionId = match[1];
        this.connected = true;
        console.log(`[MCPTestClient] Connected to ${this.baseUrl} (session: ${this.sessionId})`);
      }
    } else if (event === 'message') {
      // Parse JSON-RPC response from SSE event
      try {
        const response: JSONRPCResponse = JSON.parse(data);

        // Find pending request with matching ID
        const pending = this.pendingRequests.get(response.id);
        if (pending) {
          this.pendingRequests.delete(response.id);

          // Check for JSON-RPC errors
          if (response.error) {
            pending.reject(new Error(`JSON-RPC error: ${response.error.message} (code: ${response.error.code})`));
          } else {
            pending.resolve(response.result);
          }
        } else {
          console.warn(`[MCPTestClient] Received response for unknown request ID: ${response.id}`);
        }
      } catch (error) {
        console.error(`[MCPTestClient] Failed to parse SSE message event:`, error);
      }
    }
  }

  /**
   * Send JSON-RPC request to MCP server via POST
   * Response will come via SSE 'message' event, NOT via POST response
   *
   * @param timeout - Optional timeout in milliseconds (default: 30000)
   */
  private async sendRequest(method: string, params?: Record<string, any>, timeout: number = 30000): Promise<any> {
    this.ensureConnected();

    const requestId = ++this.requestId;
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params,
    };

    const url = new URL(`${this.baseUrl}/mcp?sessionId=${this.sessionId}`);
    const body = JSON.stringify(request);

    // Create promise that will be resolved when SSE event arrives
    return new Promise((resolve, reject) => {
      // Store pending request
      this.pendingRequests.set(requestId, { resolve, reject, method });

      // Send POST request
      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = http.request(options, (res) => {
        // SSE protocol: POST returns 202 Accepted (response comes via SSE)
        if (res.statusCode !== 202) {
          console.warn(`[MCPTestClient] Unexpected POST status: ${res.statusCode} (expected 202)`);
        }

        // Consume response body (even though we don't use it)
        res.on('data', () => {});
        res.on('end', () => {});
      });

      req.on('error', (error) => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request error: ${error.message}`));
      });

      req.write(body);
      req.end();

      // Configurable timeout for long-running operations
      setTimeout(() => {
        const pending = this.pendingRequests.get(requestId);
        if (pending) {
          this.pendingRequests.delete(requestId);
          reject(new Error(`Request timeout (${timeout}ms) for method: ${method}`));
        }
      }, timeout);
    });
  }

  /**
   * List all available MCP tools
   * Equivalent to: { "method": "tools/list", "params": {} }
   */
  async listTools(): Promise<{ tools: MCPTool[] }> {
    return this.sendRequest('tools/list', {});
  }

  /**
   * Call an MCP tool with arguments
   * Equivalent to: { "method": "tools/call", "params": { "name": "...", "arguments": {...} } }
   *
   * @param name - Full tool name (e.g., "projectpulse.onboarding.getQuestions")
   * @param args - Tool arguments as key-value pairs
   * @param timeout - Optional timeout in milliseconds (default: 30000)
   * @returns Tool result with content array
   */
  async callTool(
    name: string,
    args: Record<string, any>,
    timeout?: number
  ): Promise<MCPToolResult> {
    return this.sendRequest('tools/call', {
      name,
      arguments: args,
    }, timeout);
  }

  /**
   * Call an MCP tool and parse JSON response
   * Convenience method that automatically parses the text content as JSON
   *
   * @param name - Full tool name
   * @param args - Tool arguments
   * @param timeout - Optional timeout in milliseconds (default: 30000)
   * @returns Parsed JSON object
   */
  async callToolJSON<T = any>(
    name: string,
    args: Record<string, any>,
    timeout?: number
  ): Promise<T> {
    const result = await this.callTool(name, args, timeout);

    if (!result.content || result.content.length === 0) {
      throw new Error(`Tool "${name}" returned no content`);
    }

    const textContent = result.content[0].text;

    try {
      // First, try parsing as-is (pure JSON response)
      return JSON.parse(textContent) as T;
    } catch (error) {
      // If that fails, try to extract JSON from formatted text
      // Look for JSON object between { and } (handles formatted tool responses)
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as T;
        } catch (innerError) {
          // Fall through to error below
        }
      }

      throw new Error(
        `Failed to parse tool response as JSON: ${error instanceof Error ? error.message : error}\nRaw response: ${textContent}`
      );
    }
  }

  /**
   * Disconnect from MCP server
   * Closes the SSE transport and cleans up resources
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      // Reject any pending requests
      for (const [id, pending] of this.pendingRequests.entries()) {
        pending.reject(new Error('Client disconnecting'));
      }
      this.pendingRequests.clear();

      // Close SSE connection
      if (this.sseRequest) {
        this.sseRequest.destroy();
        this.sseRequest = undefined;
      }

      if (this.sseResponse) {
        this.sseResponse.destroy();
        this.sseResponse = undefined;
      }

      this.connected = false;
      this.sessionId = undefined;
      console.log(`[MCPTestClient] Disconnected from ${this.baseUrl}`);
    } catch (error) {
      console.error(
        `[MCPTestClient] Error during disconnect: ${error instanceof Error ? error.message : error}`
      );
      // Still mark as disconnected even if close fails
      this.connected = false;
    }
  }

  /**
   * Get current session ID
   * Useful for debugging and logging
   */
  getSessionId(): string | undefined {
    return this.sessionId;
  }

  /**
   * Check if client is currently connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Ensure client is connected, throw error if not
   */
  private ensureConnected(): void {
    if (!this.connected || !this.sessionId) {
      throw new Error('Client not connected. Call connect() first.');
    }
  }
}
