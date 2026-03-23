# ProjectPulse Python MCP Server

Production-grade Python MCP server with **smart tool profiles** to reduce context bloat.

## Key Feature: Tool Profiles

Unlike the TypeScript server (86 tools loaded always), this server loads only **48 core tools** by default. Additional tools load on demand via the `manage_profiles` meta-tool.

| Profile | Tools | When Loaded |
|---------|-------|-------------|
| `core` (default) | 48 | Every session |
| `onboarding` | 13 | Project onboarding |
| `admin` | 12 | Batch ops, exports |
| `utility` | 4 | Traceability, wiki gen |
| `observability` | 2 | Action logging |
| **Total** | **79** | |

## Quick Start

```bash
# Install dependencies
uv sync

# Run server (dev)
uv run python -m src.main

# Test health
curl http://localhost:3002/health
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PROJECTPULSE_API_BASE_URL=http://localhost:3000/api  # API endpoint
PROJECTPULSE_API_TOKEN=                              # Required in production
MCP_SERVER_PORT=3002                                 # Server port
NODE_ENV=development                                 # development|production
TOOL_PROFILES=core                                   # Comma-separated profiles
LOG_LEVEL=info                                       # debug|info|warning|error
```

## Docker

```bash
# Build
docker compose -f docker-compose.cloud.yml build mcp-server-python

# Run
docker compose -f docker-compose.cloud.yml up mcp-server-python -d

# Logs
docker compose -f docker-compose.cloud.yml logs -f mcp-server-python
```

## Testing

```bash
uv run pytest
```

## Architecture

```
Client -> CORS -> AcceptFix -> BearerAuth -> ProfileAwareMCP -> httpx -> Next.js API -> PostgreSQL
```

- **ProfileAwareMCP**: FastMCP subclass with per-token tool filtering
- **Profile Manager**: Controls which tools are registered at runtime
- **Auth Context**: Python contextvars (equivalent to Node.js AsyncLocalStorage)
- **HTTP Client**: httpx with automatic auth header injection
