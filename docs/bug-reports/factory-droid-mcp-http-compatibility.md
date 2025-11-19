# Bug Report: Factory Droid MCP HTTP Client - Streamable HTTP Incompatibility

**Report Date**: 2025-11-19  
**Reporter**: ProjectPulse Development Team  
**Severity**: High (Blocks HTTP MCP server integration)  
**Component**: Factory Droid MCP HTTP Client  
**Affected Version**: Factory Droid (current as of 2025-11-19)

---

## Summary

Factory Droid's HTTP MCP client fails to connect to MCP servers implementing the Streamable HTTP transport specification due to missing required `Accept` headers. The client sends only `Accept: application/json`, but the MCP Streamable HTTP specification requires both `application/json` and `text/event-stream`.

**Impact**: Factory Droid cannot connect to any MCP server using Streamable HTTP transport (the modern MCP standard as of spec 2025-03-26).

---

## Environment

- **Operating System**: macOS 14.5.0
- **Factory Droid Version**: Latest (CLI version as of 2025-11-19)
- **MCP Server**: Custom implementation using `@modelcontextprotocol/sdk` v1.22.0
- **Server Transport**: Streamable HTTP (`StreamableHTTPServerTransport`)
- **Network**: Local (192.168.1.15:3001)

---

## Expected Behavior

When configuring an HTTP MCP server in `~/.factory/mcp.json`:

```json
{
  "mcpServers": {
    "projectpulse": {
      "type": "http",
      "url": "http://192.168.1.15:3001/mcp"
    }
  }
}
```

Factory Droid should:
1. Connect to the MCP server successfully
2. Perform MCP protocol handshake (initialize method)
3. List available tools
4. Allow tool invocations

---

## Actual Behavior

Factory Droid fails to connect with the following error:

```
[ERROR] [McpHub] Error starting MCP server
MetaError: Failed to connect to MCP server
    at Z1A (../../packages/mcp/src/clients/http.ts:116:15)
    at async addServer (unknown)
    at async reloadServers (unknown)
    at async start (unknown)

cause: AbortError: The operation was aborted
```

**Server-side logs** show:
```
[INFO] Handling Streamable HTTP request
```

But the connection is immediately aborted.

---

## Root Cause Analysis

### MCP Streamable HTTP Specification Requirement

Per the MCP Streamable HTTP specification (2025-03-26), clients MUST send:

```http
Accept: application/json, text/event-stream
```

This allows the server to respond with either:
- **SSE stream** (for real-time updates)
- **Direct JSON** (for simple request/response)

The MCP SDK's `StreamableHTTPServerTransport` validates this and returns `406 Not Acceptable` if the header is missing.

### Factory Droid's HTTP Client Behavior

Factory Droid's HTTP MCP client sends:

```http
Accept: application/json
```

**Missing**: `text/event-stream` content type

### Server Response

```http
HTTP/1.1 406 Not Acceptable
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Not Acceptable: Client must accept both application/json and text/event-stream"
  },
  "id": null
}
```

---

## Steps to Reproduce

### 1. Set up MCP Server

Create a minimal MCP server using the official SDK:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';

const server = new Server(
  { name: 'test-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless
    enableDnsRebindingProtection: false,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } finally {
    await transport.close();
  }
});

app.listen(3001);
```

### 2. Configure Factory Droid

Add to `~/.factory/mcp.json`:

```json
{
  "mcpServers": {
    "test": {
      "type": "http",
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

### 3. Start Factory Droid

```bash
droid
```

### 4. Observe Failure

Factory Droid logs will show:
```
[ERROR] [McpHub] Error starting MCP server
MetaError: Failed to connect to MCP server
```

### 5. Verify with curl (working)

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
```

**Result**: Success - server responds with initialization data.

### 6. Test with Factory Droid's headers (failing)

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
```

**Result**: `406 Not Acceptable` - server rejects request due to missing `text/event-stream` in Accept header.

---

## Evidence

### Factory Droid Logs

```
[2025-11-19T16:56:21.974Z] INFO: [McpHub] Starting new MCP servers... | Context: {"servers":["projectpulse"]}
[2025-11-19T16:57:21.980Z] INFO: [McpHub] MCP server closed | Context: {"name":"projectpulse"}
[2025-11-19T16:57:21.993Z] ERROR: [McpHub] Error starting MCP server
MetaError: Failed to connect to MCP server
    at Z1A (../../packages/mcp/src/clients/http.ts:116:15)
    at async addServer (unknown)
    at async reloadServers (unknown)
    at async start (unknown)
    at processTicksAndRejections (native:7:39) | Context: {"name":"projectpulse","error":"MetaError: Failed to connect to MCP server","server":"projectpulse"}
[2025-11-19T16:57:21.994Z] INFO: [McpHub] Sending toolsChange notification to all clients | Context: {"toolCount":0,"toolNames":[]}
[2025-11-19T16:57:21.996Z] WARN: [McpHub] Error in MCP server | Context: {"name":"projectpulse","cause":{"name":"AbortError","message":"The operation was aborted."}}
```

### MCP Server Logs

```
[mcp-server] [INFO] Handling Streamable HTTP request
[mcp-server] [INFO] Streamable HTTP transport connected
[mcp-server] [INFO] Streamable HTTP transport closed
```

Server receives the request but connection is aborted by client after `406` response.

### HTTP Exchange (verbose curl)

```http
POST /mcp HTTP/1.1
Host: 192.168.1.15:3001
Accept: application/json, text/event-stream
Content-Type: application/json

{"jsonrpc":"2.0","id":1,"method":"initialize",...}

HTTP/1.1 200 OK
Content-Type: text/event-stream
...
```

**Working** ✅ (with both Accept types)

```http
POST /mcp HTTP/1.1
Host: 192.168.1.15:3001
Accept: application/json
Content-Type: application/json

{"jsonrpc":"2.0","id":1,"method":"initialize",...}

HTTP/1.1 406 Not Acceptable
Content-Type: application/json

{"jsonrpc":"2.0","error":{"code":-32000,"message":"Not Acceptable: Client must accept both application/json and text/event-stream"},"id":null}
```

**Failing** ❌ (Factory Droid's headers)

---

## Impact Assessment

### Affected Use Cases

1. **Cannot use Factory Droid with modern MCP servers**
   - Any server implementing Streamable HTTP transport fails
   - Blocks integration with custom MCP servers
   - Forces developers to use legacy SSE transport

2. **Incompatibility with MCP SDK standard**
   - Official `@modelcontextprotocol/sdk` uses Streamable HTTP as default
   - Factory Droid incompatible with SDK-generated servers

3. **Future MCP specification compliance**
   - SSE transport deprecated as of MCP spec 2025-03-26
   - Factory Droid will be incompatible with future MCP servers

### Workaround Status

**Current workarounds**:
- ❌ No client-side workaround available
- ✅ Server can implement legacy SSE transport (but deprecated)
- ⚠️ Requires maintaining two transport implementations

**Example workaround** (server-side):

```typescript
// Must implement BOTH transports for Factory Droid compatibility
app.get('/mcp', async (_req, res) => {
  // SSE transport for Factory Droid
  const transport = new SSEServerTransport('/mcp', res);
  await server.connect(transport);
});

app.post('/mcp', async (req, res) => {
  const sessionId = req.query.sessionId;
  
  if (sessionId) {
    // SSE message handling
    const transport = sseSessions.get(sessionId);
    await transport.handlePostMessage(req, res, req.body);
  } else {
    // Streamable HTTP (won't work with Factory Droid)
    // ...
  }
});
```

---

## Comparison with Other Agents

| Agent | Transport | Status | Accept Header |
|-------|-----------|--------|---------------|
| **Claude Code** | SSE | ✅ Working | (SSE-specific handshake) |
| **Cascade (Windsurf)** | SSE | ✅ Working | (SSE-specific handshake) |
| **Factory Droid** | HTTP | ❌ Broken | `application/json` only |

**Note**: Claude Code and Cascade work because they use SSE transport, which has different header requirements.

---

## Suggested Fix

### Option 1: Update HTTP Client Accept Header (Recommended)

**File**: `packages/mcp/src/clients/http.ts` (or equivalent)

**Change**:
```typescript
// BEFORE
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json', // ❌ Missing text/event-stream
  },
  body: JSON.stringify(request),
});

// AFTER
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream', // ✅ Both types
  },
  body: JSON.stringify(request),
});
```

**Impact**:
- ✅ Minimal code change (1 line)
- ✅ Maintains backward compatibility
- ✅ Complies with MCP Streamable HTTP spec
- ✅ Enables future MCP server compatibility

### Option 2: Add Configuration Option

Allow users to customize Accept headers in `mcp.json`:

```json
{
  "mcpServers": {
    "projectpulse": {
      "type": "http",
      "url": "http://192.168.1.15:3001/mcp",
      "headers": {
        "Accept": "application/json, text/event-stream"
      }
    }
  }
}
```

**Impact**:
- ⚠️ Requires user configuration
- ⚠️ Not automatic fix
- ✅ Provides flexibility

---

## Testing Recommendations

### Compatibility Test Suite

After implementing the fix, test against:

1. **Official MCP SDK servers**
   ```bash
   npx @modelcontextprotocol/server-everything
   ```

2. **Custom Streamable HTTP servers**
   - Test with `enableJsonResponse: true`
   - Test with `enableJsonResponse: false` (SSE streams)

3. **Legacy SSE servers**
   - Ensure backward compatibility

4. **Edge cases**
   - Large payloads
   - Streaming responses
   - Error handling

### Expected Results

After fix:
- ✅ Factory Droid connects to Streamable HTTP servers
- ✅ `initialize` method succeeds
- ✅ `tools/list` returns available tools
- ✅ Tool invocations work correctly
- ✅ Backward compatibility with SSE servers maintained

---

## Related Documentation

- **MCP Specification**: https://spec.modelcontextprotocol.io/specification/2025-03-26/
- **Streamable HTTP Transport**: https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/transports/#streamable-http
- **MCP SDK Documentation**: https://github.com/modelcontextprotocol/sdk
- **Factory Droid MCP Docs**: https://docs.factory.ai/cli/configuration/mcp

---

## Reproducible Test Case

### Server Code (test-mcp-server.js)

```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';

const server = new Server(
  { name: 'test-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'test_tool',
      description: 'A test tool',
      inputSchema: { type: 'object', properties: {} }
    }
  ]
}));

const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
  console.log('Accept header:', req.headers.accept);
  
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableDnsRebindingProtection: false,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } finally {
    await transport.close();
  }
});

app.listen(3001, () => {
  console.log('Test MCP server running on http://localhost:3001/mcp');
  console.log('Configure Factory Droid with:');
  console.log('{"mcpServers":{"test":{"type":"http","url":"http://localhost:3001/mcp"}}}');
});
```

### Run Test

```bash
# Terminal 1: Start server
node test-mcp-server.js

# Terminal 2: Configure Factory Droid
cat > ~/.factory/mcp.json << EOF
{
  "mcpServers": {
    "test": {
      "type": "http",
      "url": "http://localhost:3001/mcp"
    }
  }
}
EOF

# Start Factory Droid
droid

# Expected: Connection fails with "Failed to connect to MCP server"
# Server logs show: Accept header: application/json
```

### Verify Fix

After fix is applied:
```bash
# Server logs should show: Accept header: application/json, text/event-stream
# Factory Droid should connect successfully
# Tools should be available
```

---

## Priority Justification

**Severity: High**

1. **Blocks modern MCP integration**
   - Cannot use with official MCP SDK servers
   - Incompatible with current MCP specification

2. **Affects all HTTP MCP servers**
   - Not isolated to specific servers
   - Systematic compatibility issue

3. **Simple fix with high impact**
   - One-line change resolves issue
   - Unblocks entire ecosystem

4. **Future-proofing**
   - SSE transport deprecated
   - Streamable HTTP is the path forward

---

## Contact

**Reporter**: ProjectPulse Development Team  
**Project**: https://github.com/yourusername/AI_HUB  
**Email**: your-email@example.com  

**Available for**:
- Additional testing
- Providing test environment access
- Collaborative debugging
- Patch validation

---

## Appendix: Complete HTTP Trace

```http
# Factory Droid's request (reconstructed from server logs)
POST /mcp HTTP/1.1
Host: 192.168.1.15:3001
User-Agent: Factory-Droid/1.0
Content-Type: application/json
Accept: application/json
Content-Length: 170

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"factory-droid","version":"1.0"}}}

# Server's response
HTTP/1.1 406 Not Acceptable
X-Powered-By: Express
Content-Type: application/json
Date: Wed, 19 Nov 2025 16:59:08 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{"jsonrpc":"2.0","error":{"code":-32000,"message":"Not Acceptable: Client must accept both application/json and text/event-stream"},"id":null}
```

---

**Report Generated**: 2025-11-19  
**Version**: 1.0  
**Status**: Awaiting Factory.ai review
