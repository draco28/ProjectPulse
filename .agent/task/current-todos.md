# Current TODOs — Sprint 1 (Foundation Setup)

Progress: 47% (14/30 tasks)
Last updated: 2025-11-06 Day 2 Complete

## Day 1: Setup & Planning ✅ COMPLETE

- [x] Confirm pnpm workspace + lockfile
- [x] Add base tsconfig (strict) and eslint config
- [x] Create .env.example and validate docker-compose Postgres service
- [x] Document risks and mitigations in session log

## Day 2: Prisma Schema & DB ✅ COMPLETE

- [x] Consult prisma-expert for schema design
- [x] Define models: Phase, Week, Day, Task, Session
- [x] Add relations, indexes, constraints (25 indexes total)
- [x] Generate initial migration (20251106141927_add_sprint_hierarchy)
- [x] Apply migration to PostgreSQL
- [x] Validate Prisma Client generation
- [x] Write prisma/seed.ts with Sprint 1 hierarchy
- [x] Run seed script successfully
- [x] Verify data integrity with psql queries
- [x] Update memory banks (progress.md, active-context.md)

## Next.js API + Services

- [ ] Scaffold apps/web (Next.js 14, App Router)
- [ ] Add Prisma client helper and Zod schemas
- [ ] Implement POST /api/phase (createPhase)
- [ ] Implement POST /api/week (createWeek)
- [ ] Implement POST /api/day (createDay)
- [ ] Implement POST /api/task (createTask)
- [ ] Implement POST /api/session (createSession)
- [ ] Implement roll-up service (propagate progress)
- [ ] Wire roll-up into create/update flows

## MCP Server

- [ ] Scaffold apps/mcp-server (stdio)
- [ ] Register tools: createPhase/Week/Day/Task/Session
- [ ] Implement tool handlers calling Next.js API with Zod validation
- [ ] Add local CLI for tool smoke tests

## Testing & Gates

- [ ] Unit tests: roll-up algorithm (10 cases)
- [ ] Integration tests: API routes
- [ ] MCP smoke test: create full 5-level hierarchy
- [ ] pnpm lint, type-check, build all pass

## Checkpoints

- [ ] 15K tokens — update session + todos
- [ ] 30K tokens — update session + todos
- [ ] 45K tokens — update session + todos
- [ ] 60K tokens — update session + todos

Notes

- Follow R-DOC-001, R-TS-001, R-NEXT-001, R-SEC-001, R-MCP-001, R-PRIVACY-001.
- No hardcoded values; use config/database as per Golden Rules.
