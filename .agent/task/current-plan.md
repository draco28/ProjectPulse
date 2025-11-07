# Implementation Plan: Sprint 1 Day 4 – MCP Server Scaffold

**Created**: 2025-11-07 05:58  
**Phase**: Sprint 1 · Week 1 · Day 4 (MCP foundation)  
**Estimated Duration**: 3-5 hours (includes scaffolding + smoke test)

---

## Objective

Stand up the first dedicated MCP server workspace so future sprint-tracking tools (US-001…US-007, US-009) have a stdio entrypoint that Claude Code can connect to. Day 4 focuses on project structure, stdio transport wiring, config/logging bootstrap, and an extensible tool registry with at least one placeholder tool.

**Status**: ✅ Completed 2025-11-07 (workspace + health tool live; Day 5 will harden workflows and prep new tools)

---

## Requirements & References

- `docs/13-Project-Plan.md` – Sprint 1 Week 1 Day 4 deliverables (MCP scaffold, stdio transport, tool registration)
- `docs/12-Backlog.md` – US-001, US-003, US-004, US-009 dependencies
- `.agent/system/mcp-tools-guide.md` – transport/tool conventions
- `.agent/system-patterns.md` – TypeScript strict + Zod validation patterns
- `.agent/project-brief.md` – agent-first, MCP-first architecture goals

Key requirements distilled:

1. Server must run locally (no Docker) with stdio transport for Claude Code.
2. MCP server must remain stateless—every tool call proxies through existing Next.js API routes (no direct Prisma usage).
3. Tool registration system must be data-driven (no hardcoded branching).
4. Config + logging should be centralized (preps for future env overrides).
5. Provide developer script (`pnpm mcp-server:dev`) and README quick start.

---

## Deliverables

1. `apps/mcp-server/` workspace with package.json, tsconfig, src tree, README.
2. Shared TypeScript config extending root `tsconfig.base.json`, ESLint hook optional.
3. `src/index.ts` bootstrapping stdio transport from `@modelcontextprotocol/sdk`, wiring HTTP client, graceful shutdown.
4. `src/config.ts`, `src/logger.ts` (or utilities) for env + structured logging.
5. `src/tools/index.ts` + at least one placeholder tool module demonstrating schema validation with Zod.
6. Basic smoke test (e.g., `src/__tests__/bootstrap.test.ts` or script) ensuring registry loads without runtime errors.
7. Root-level npm script + documentation so engineers can run `pnpm mcp-server:dev`.

---

## Task Breakdown & Estimates

### Task 1: Workspace & Dependency Setup (30-45 min)

- Add `apps/mcp-server` to `pnpm-workspace.yaml`.
- Scaffold `package.json` (type: module, TS + ts-node/dev deps, SDK dependency).
- Ensure Prisma + shared tooling dependencies referenced correctly (reuse root lockfile).
- Verify `pnpm install` succeeds and no duplicate dependencies conflict.

### Task 2: Configuration & Build System (30 min)

- Create `tsconfig.json` that extends `../../tsconfig.base.json`, configure outDir, strict, moduleResolution, path aliases (e.g., `@/tools`).
- Add `tsconfig.build.json` if needed for emitted JS.
- Optional: `eslint.config.js` referencing workspace lint rules (if required by guidelines).

### Task 3: Server Bootstrap (`src/index.ts`) (45-60 min)

- Create logger + HTTP client wiring (fetch to Next.js API).
- Configure stdio transport via `@modelcontextprotocol/sdk/server`.
- Implement graceful shutdown (SIGINT/SIGTERM) and transport close.
- Log startup metadata (API base URL, tool count) for debugging.

### Task 4: Tool Registry & Sample Tool (45-60 min)

- Design `ToolDefinition` interface (id, metadata, handler, zod schemas).
- Implement `src/tools/index.ts` to auto-register tools (array map → SDK registration).
- Create placeholder tool (e.g., `src/tools/healthCheck.ts`) that validates input + returns static data (foundation for createPhase tool).
- Add tests for schema validation & registry wiring (Jest or tsx-runner).

### Task 5: Developer Experience & Documentation (30 min)

- Add npm scripts to root `package.json` (and/or workspace package) for `dev`/`build`.
- Document usage in `apps/mcp-server/README.md` (install, run, connect from Claude).
- Add instructions to `.agent/task/current-session` log as part of Step 4 checkpoints.

### Task 6: Verification & Cleanup (30 min)

- Smoke-test server start (log output).
- Run `pnpm lint`, `pnpm type-check`, and targeted tests.
- Update plan/todos progress + checkpoint log.
- Prep Step 4.5 verification list (files created, script outputs).

---

## Files to Create / Modify

- `pnpm-workspace.yaml`
- `apps/mcp-server/package.json`
- `apps/mcp-server/tsconfig.json` (+ optional `tsconfig.build.json`)
- `apps/mcp-server/src/index.ts`
- `apps/mcp-server/src/config.ts`
- `apps/mcp-server/src/logger.ts`
- `apps/mcp-server/src/tools/index.ts`
- `apps/mcp-server/src/tools/healthCheck.ts` (placeholder)
- `apps/mcp-server/src/__tests__/bootstrap.test.ts` (or similar)
- `apps/mcp-server/README.md`
- Root `package.json` scripts section (if needed)
- `.agent/task/current-session-20251107-0552.md` (checkpoints)
- `.agent/task/current-todos.md` (progress tracking)

---

## Risks & Mitigations

| Risk                                      | Impact                                | Mitigation                                                                                         |
| ----------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Dependency conflicts or missing peer deps | Blocks install                        | Reuse root versions, run `pnpm install` immediately after scaffold                                 |
| Prisma client duplication                 | Bundle bloat / mismatched schema      | Use workspace protocol to import Prisma from root `node_modules`, avoid generating separate schema |
| ESM/CommonJS mismatch                     | Runtime failure when launching server | Align `type: module`, use `ts-node --esm` or compile to ESM; test via `pnpm mcp-server:dev`        |
| Tool registration drift                   | Hard to add future tools              | Centralize metadata + auto-registration with typed schema definitions                              |

---

## Success Criteria & Verification Plan

- `pnpm mcp-server:dev` starts server, logs “MCP server ready” and stays alive until Ctrl+C.
- Tool registry reports ≥1 registered tool; health check responds over stdio (manual log evidence).
- `pnpm lint`, `pnpm type-check`, and targeted tests pass (no TS errors).
- Step 4.5 verification documents evidence: command outputs, file listings, tool count.

---

## Testing Strategy

- Unit: Jest/tsx tests for config + registry.
- Integration: Launch server via ts-node (or compiled JS) to ensure bootstrap path works.
- Manual: Observe stdout handshake log, confirm graceful shutdown message.

---
