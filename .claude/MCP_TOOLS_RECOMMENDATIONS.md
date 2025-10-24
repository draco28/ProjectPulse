# MCP Tools Recommendations for Moksha DevHub

## Current MCP Tools

You currently have these MCP tools installed:

- ✅ **byterover** - Memory/knowledge retrieval
- ✅ **filesystem** - File operations
- ✅ **sequential-thinking** - Complex reasoning
- ✅ **git** - Version control
- ✅ **playwright** - E2E testing

## Recommended Additional Tools

### 🔥 High Priority (Install These)

#### 1. PostgreSQL MCP Server

**Package:** `@modelcontextprotocol/server-postgres`

**Why:**

- Direct PostgreSQL query execution
- Schema inspection without Prisma Studio
- Query performance analysis
- Migration verification

**Installation:**

```bash
claude mcp add @modelcontextprotocol/server-postgres
```

**Configuration:**

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://moksha:password@localhost:5432/moksha_devhub"
      ]
    }
  }
}
```

#### 2. Docker MCP Server

**Package:** Custom or community Docker MCP

**Why:**

- Manage Docker containers from Claude Code
- View logs (`docker logs moksha-db`)
- Restart services
- Health checks

**Note:** May need to create custom MCP server for Docker

---

### 🟡 Medium Priority (Consider These)

#### 3. GitHub MCP Server

**Package:** `@modelcontextprotocol/server-github`

**Why (if using GitHub):**

- Create issues directly
- PR management
- Repository insights

**Installation:**

```bash
claude mcp add @modelcontextprotocol/server-github
```

#### 4. Puppeteer MCP Server

**Package:** `@modelcontextprotocol/server-puppeteer`

**Why:**

- Complement Playwright
- Visual regression testing
- PDF generation for reports

---

### 🔵 Low Priority (Future)

#### 5. Slack MCP Server

**Package:** `@modelcontextprotocol/server-slack`

**Why (if using Slack):**

- Build notifications
- Team communication
- CI/CD updates

#### 6. Custom Next.js Dev Server MCP

**Package:** Build custom

**Why:**

- Start/stop dev server
- View build logs
- Performance metrics

**Example tool:**

```typescript
// Custom MCP tool
server.tool('nextjs_dev_start', 'Start Next.js development server', {}, async () => {
  exec('cd apps/web && npm run dev');
  return { content: [{ type: 'text', text: 'Dev server starting...' }] };
});
```

---

## MCP Tool Integration Strategy

### Phase 1: Essential Tools (Now)

1. PostgreSQL MCP Server
2. Docker MCP Server (custom)

### Phase 2: Development Tools (Week 2-3)

3. GitHub MCP Server (if using GitHub)
4. Puppeteer MCP Server

### Phase 3: Team Tools (Later)

5. Slack MCP Server
6. Custom project-specific tools

---

## Custom MCP Tools for DevHub

Consider building these custom MCP tools specific to DevHub:

### 1. DevHub Status Tool

```typescript
server.tool('devhub_status', 'Get current DevHub development status', {}, async () => {
  // Check Docker containers, DB, Dev server
  // Return comprehensive status
});
```

### 2. DevHub Setup Tool

```typescript
server.tool('devhub_setup', 'Initialize DevHub development environment', {}, async () => {
  // Run docker-compose up, prisma migrate, npm install
  // Return setup progress
});
```

### 3. DevHub Test Runner

```typescript
server.tool(
  'devhub_test',
  'Run DevHub test suite with options',
  {
    type: 'object',
    properties: {
      suite: { type: 'string', enum: ['unit', 'integration', 'e2e', 'all'] },
      coverage: { type: 'boolean' },
    },
  },
  async (args) => {
    // Run appropriate test suite
  }
);
```

---

## Installation Guide

### 1. Add PostgreSQL MCP Server

```bash
# Install
claude mcp add @modelcontextprotocol/server-postgres

# Or manually edit config
# Location: %APPDATA%\Claude\claude_desktop_config.json (Windows)
```

**Config:**

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://moksha:moksha_dev_password_2025@localhost:5432/moksha_devhub"
      ]
    }
  }
}
```

### 2. Create Custom Docker MCP Server

**File:** `apps/mcp-docker/index.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const server = new Server(
  { name: 'docker-devhub', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'docker_status') {
    const { stdout } = await execAsync('docker ps --format "table {{.Names}}\t{{.Status}}"');
    return { content: [{ type: 'text', text: stdout }] };
  }

  if (name === 'docker_logs') {
    const { stdout } = await execAsync(`docker logs ${args.container} --tail 50`);
    return { content: [{ type: 'text', text: stdout }] };
  }

  // More tools...
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

**Add to config:**

```json
{
  "mcpServers": {
    "docker-devhub": {
      "command": "node",
      "args": ["F:\\Web_Projects\\AI_HUB\\apps\\mcp-docker\\dist\\index.js"]
    }
  }
}
```

---

## Testing MCP Tools

### Test PostgreSQL MCP

```
In Claude Code:
"Show me all tables in the DevHub database"
"What's the schema of the issues table?"
"Run a query to count open issues"
```

### Test Docker MCP

```
"Show Docker container status"
"Show logs for moksha-db container"
"Restart the web container"
```

---

## Troubleshooting

### MCP Tool Not Found

1. Check `claude_desktop_config.json` syntax
2. Restart Claude Desktop
3. Check MCP server logs

### Connection Errors

1. Verify database is running: `docker ps`
2. Check connection string in config
3. Test connection manually: `psql -U moksha -h localhost`

### Tool Execution Fails

1. Check MCP server has necessary permissions
2. Verify paths are absolute (not relative)
3. Check environment variables are set

---

## Benefits Summary

**With PostgreSQL MCP:**

- ✅ Query database directly from Claude Code
- ✅ Inspect schema without leaving editor
- ✅ Analyze query performance
- ✅ Verify migrations

**With Docker MCP:**

- ✅ Manage containers from Claude Code
- ✅ Check logs instantly
- ✅ Restart services when needed
- ✅ Monitor health status

**With Custom DevHub MCP:**

- ✅ Project-specific commands
- ✅ Streamlined workflows
- ✅ Status checks
- ✅ Test running

---

## Next Steps

1. **Now:** Install PostgreSQL MCP Server
2. **Week 1:** Build custom Docker MCP Server
3. **Week 2-3:** Add GitHub/Puppeteer if needed
4. **Ongoing:** Add custom DevHub-specific tools

---

**Last Updated:** January 23, 2025
