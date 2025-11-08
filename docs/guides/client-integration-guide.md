# MCP Client Integration Guide

Audience: AI clients connecting to ProjectPulse MCP server

Last Updated: 2025-11-09

---

## Overview

ProjectPulse MCP server supports multiple AI clients:
- Claude Code (Anthropic)
- GPT-based clients (OpenAI)
- Gemini (Google AI)
- Any MCP-compliant client

All clients get identical functionality. Efficiency varies by capability.

---

## Quick Start

### 1) Connection (stdio JSON-RPC)

```bash
# Start server (traditional mode)
PP_MCP_MODE=traditional node ./dist/server.js
```

Client example (Node):

```ts
import { spawn } from 'child_process';

const server = spawn('node', ['./dist/server.js'], {
  env: { ...process.env, PP_MCP_MODE: 'traditional' },
});

server.stdout.on('data', (d) => process.stdout.write(d));
server.stdin.write(JSON.stringify({
  jsonrpc: '2.0', id: 1, method: 'tools/list'
}) + '\n');
```

### 2) List Available Tools

Request:

```json
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
```

Response (truncated):

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { "tools": [
    { "name": "create-issue", "description": "Create a new issue", "inputSchema": { /* ... */ } },
    // ... 40 more tools
  ]}
}
```

### 3) Call a Tool

Request:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "search-issues",
    "arguments": { "query": "bug", "page": 1, "limit": 20 }
  }
}
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "items": [ /* 20 issues */ ],
    "total": 1234,
    "page": 1,
    "pages": 62,
    "hasMore": true
  }
}
```

---

## Client Capability Declaration

- Traditional Mode (All Clients): `PP_MCP_MODE=traditional`
- Code Execution Mode (Claude Code): `PP_MCP_MODE=auto` (or `code-exec` to force)
- Auto-Detect: `PP_MCP_MODE=auto` (default) → probe for code execution, fallback to traditional

Capability Matrix:

| Feature | Traditional | Code Execution |
|--------|-------------|----------------|
| All 41 tools | ✅ | ✅ |
| Same results | ✅ | ✅ |
| Privacy tokenization | ✅ | ✅ |
| Pagination | ✅ 20/page | ✅ Local filter |
| Tool definitions | ✅ Upfront | ✅ On-demand |
| Execution | Server-side | Client-side |

---

## Testing Your Client

Step 1: Basic Connection

```ts
const tools = await client.request('tools/list');
console.assert(tools.tools.length === 41);
```

Step 2: Tool Call

```ts
const result = await client.callTool('create-issue', {
  title: 'Test Issue',
  priority: 'low'
});
console.assert(result.success === true);
```

Step 3: Parity Check

```ts
const search = await client.callTool('search-issues', { query: 'bug', page: 1, limit: 10 });
console.assert(search.items.length === 10);
console.assert(search.total > 0);
```

Step 4: Privacy Check

```ts
const created = await client.callTool('create-issue', {
  title: 'Contact john@example.com',
  description: 'Server 192.168.1.50 is down'
});
console.assert(created.data.title.includes('<EMAIL_'));
console.assert(created.data.description.includes('<IP_'));
```

---

## Example Clients

Minimal Node.js Client

```ts
import { spawn } from 'child_process';
import { createInterface } from 'readline';

class MCPClient {
  private process: any;
  private requestId = 0;
  private pending = new Map<number, (r: any) => void>();

  connect(serverPath: string, mode: 'traditional' | 'code-exec' = 'traditional') {
    this.process = spawn('node', [serverPath], { env: { ...process.env, PP_MCP_MODE: mode } });
    const rl = createInterface({ input: this.process.stdout });
    rl.on('line', (line) => {
      const msg = JSON.parse(line);
      const resolve = this.pending.get(msg.id);
      if (resolve) { resolve(msg.result); this.pending.delete(msg.id); }
    });
  }

  callTool(name: string, args: any) {
    const id = this.requestId++;
    this.process.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } }) + '\n');
    return new Promise((resolve) => this.pending.set(id, resolve as any));
  }
}
```

Python Client (stdio)

```py
import subprocess, json

class MCPClient:
    def __init__(self, server_path):
        self.p = subprocess.Popen(['node', server_path], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
        self.id = 0
    def call_tool(self, name, args):
        req = { 'jsonrpc': '2.0', 'id': self.id, 'method': 'tools/call', 'params': { 'name': name, 'arguments': args } }
        self.p.stdin.write((json.dumps(req) + '\n').encode()); self.p.stdin.flush()
        line = self.p.stdout.readline(); return json.loads(line)['result']
```

---

## Troubleshooting

- Connection timeout → Ensure server starts standalone: `node ./dist/server.js`
- Tool not found → List tools first via `tools/list`
- Invalid input → Refer to `inputSchema` in `tools/list` response

---

## Support

- Documentation: docs/guides/
- Architecture: docs/03-Architecture.md
- Design: docs/archive/plans/mcp-code-execution-design.md
- Examples: test/mock-client/

Document Version: 1.0 (Week 5)
Next Update: Sprint 3 (add code execution examples)
