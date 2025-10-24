# Docker MCP Server for DevHub

Custom MCP server for managing Docker containers directly from Claude Code.

## Features

- **docker_status** - View all container statuses
- **docker_logs** - View container logs (with tail option)
- **docker_restart** - Restart specific containers
- **docker_stats** - View resource usage (CPU, memory, network)
- **docker_inspect** - Get detailed container information
- **docker_compose_status** - View Docker Compose services status

## Setup

### 1. Install Dependencies

```bash
cd apps/mcp-docker
pnpm install
```

### 2. Build

```bash
pnpm build
```

### 3. Configure in Claude Code

The MCP server is already configured in `.vscode/settings.json`:

```json
{
  "claude.mcpServers": {
    "docker-devhub": {
      "command": "node",
      "args": ["F:\\Web_Projects\\AI_HUB\\apps\\mcp-docker\\dist\\index.js"]
    }
  }
}
```

### 4. Reload VS Code

After building, reload VS Code window:
- Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
- Type "Developer: Reload Window"
- Press Enter

## Usage Examples

### Check Container Status

```
You: "Show me the Docker container status"
→ Uses: docker_status
→ Shows: All containers with their status and ports
```

### View Logs

```
You: "Show me the logs for moksha-db"
→ Uses: docker_logs with container="moksha-db"
→ Shows: Last 50 lines of logs (configurable)
```

### Restart Container

```
You: "Restart the web container"
→ Uses: docker_restart with container="moksha-web"
→ Restarts the specified container
```

### Resource Usage

```
You: "Show Docker resource usage"
→ Uses: docker_stats
→ Shows: CPU, memory, and network usage for all containers
```

### Inspect Container

```
You: "Inspect the moksha-db container"
→ Uses: docker_inspect with container="moksha-db"
→ Shows: Detailed JSON configuration
```

## Development

### Watch Mode

```bash
pnpm dev
```

This will rebuild automatically when you make changes to `src/index.ts`.

### Testing

Test the MCP server manually:

```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node dist/index.js
```

## Common Containers

In DevHub, you'll typically interact with:
- **moksha-db** - PostgreSQL database
- **moksha-web** - Next.js web application
- **moksha-mcp** - MCP server (if running separately)

## Troubleshooting

### MCP Server Not Found

1. Ensure you've run `pnpm build` in `apps/mcp-docker`
2. Check that `dist/index.js` exists
3. Reload VS Code window

### Docker Commands Fail

1. Ensure Docker Desktop is running
2. Check Docker is accessible: `docker ps`
3. Verify container names: `docker ps -a`

### Permission Errors

On Windows, ensure Docker Desktop has proper permissions and is running.

## Version

**v1.0.0** - Initial release with 6 Docker management tools
