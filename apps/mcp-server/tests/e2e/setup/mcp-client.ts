/**
 * MCP Test Client
 *
 * Authenticated HTTP client for testing MCP tools.
 * Handles Bearer token authentication automatically.
 *
 * Usage:
 * ```typescript
 * const client = new MCPTestClient('http://192.168.1.15:3001', authToken);
 * const result = await client.callTool('projectpulse_ticket_create', { projectId, title, ... });
 * ```
 */

export class MCPTestClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string = 'http://192.168.1.15:3000/api', token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  /**
   * Call an MCP tool with authentication
   * Returns the tool result or throws an error
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(`MCP tool error: ${result.error.message}`);
    }

    return result.result;
  }

  /**
   * List all available MCP tools
   */
  async listTools(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/list',
      }),
    });

    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(`MCP error: ${result.error.message}`);
    }

    return result.result;
  }
}
