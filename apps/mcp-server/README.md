# ProjectPulse MCP Server

Stdio-based MCP server that connects Claude Code to the ProjectPulse Next.js API. The server stays intentionally thin—each tool validates input with Zod, forwards the request to existing Next.js API routes, and returns structured responses to Claude.

## Quick Start

```bash
pnpm install          # install workspace deps
pnpm mcp:dev          # start MCP server in watch mode (alias for pnpm --filter mcp-server dev)
```

> **Note:** The Next.js app (`apps/web`) must be running locally on `http://localhost:3000` (configurable via env) so the MCP server can forward tool invocations.

## Scripts

| Command                          | Description                                                   |
| -------------------------------- | ------------------------------------------------------------- |
| `pnpm --filter mcp-server dev`   | Run the server with `tsx` (ideal for Claude Code integration) |
| `pnpm --filter mcp-server build` | Type-check and emit JS to `dist/`                             |
| `pnpm --filter mcp-server start` | Run the compiled server from `dist/index.js`                  |
| `pnpm --filter mcp-server test`  | Run lightweight unit tests (node:test via tsx)                |
| `pnpm --filter mcp-server lint`  | ESLint using the repo root configuration                      |

## Configuration

Environment variables are validated by `src/config.ts`:

| Variable               | Description                                   | Default                 |
| ---------------------- | --------------------------------------------- | ----------------------- |
| `PROJECTPULSE_API_URL` | Base URL for Next.js API                      | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL`  | Fallback if `PROJECTPULSE_API_URL` is not set | `http://localhost:3000` |
| `MCP_LOG_LEVEL`        | `debug`, `info`, `warn`, `error`              | `info`                  |

## Architecture Highlights

- **Transport**: `@modelcontextprotocol/sdk` stdio server.
- **Tool Registry**: Data-driven definitions (see `src/tools/index.ts`), Zod validation per tool.
- **HTTP Client**: `src/httpClient.ts` centralizes fetch calls + error handling.
- **Logging**: Lightweight structured logger with level filtering.
- **Testing**: Node’s built-in `node:test` runner executed through `tsx`.

Future tools (e.g., `sprint.phase.create`, `sprint.getCurrentTask`, `sprint.checkpoint`) will live under `src/tools/` and follow the same validation + registration pattern.
