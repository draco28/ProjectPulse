# Day 5 Implementation Plan - MCP Server Hardening & Documentation

**Created**: 2025-11-07 06:00
**Sprint**: Sprint 1 Week 1 Day 5
**Goal**: Harden MCP server with smoke tests, documentation, and prepare for Days 6-7 tool implementations

---

## Overview

Day 4 completed the MCP server scaffold. Day 5 hardens it with end-to-end testing, developer documentation, and technical planning for first tool implementations.

**Key Decision**: Proceeding with **42-tool baseline** (Sprint 1-8 MVP). 23 additional tools (EPIC-010 to EPIC-014) documented as technical debt for Sprint 9+.

---

## Deliverables

### 1. CLI Smoke Test (~2 hours)

**Objective**: Verify MCP server + Next.js API integration end-to-end

**Tasks**:
- Install `@modelcontextprotocol/cli` for testing
- Create test script invoking `projectpulse.health_check` tool
- Capture sample JSON output showing tool execution
- Verify Next.js API integration via httpClient
- Document test results in session log

**Success Criteria**:
- ✅ CLI test produces valid JSON output from health-check tool
- ✅ Test script reusable for future tool testing
- ✅ Next.js API connection verified (200 OK response)

---

### 2. Developer Onboarding Documentation (~2 hours)

**Objective**: Create comprehensive SOP for MCP server launch and testing

**Files to Create**:
- `.agent/sops/mcp-server-launch.md` OR `.claude/agents/mcp-integration.md`

**Content Sections**:
1. **MCP Server Setup**: Build, configuration, environment variables
2. **Claude Code Configuration**: `~/.claude/mcp_settings.json` setup
3. **Testing Workflow**: How to test tools locally
4. **Troubleshooting**: Common issues and solutions
5. **Tool Invocation Examples**: Sample MCP tool calls

**Success Criteria**:
- ✅ Developer SOP covers setup, testing, troubleshooting
- ✅ Documentation includes code examples and screenshots (if applicable)
- ✅ References existing MCP tools guide for consistency

---

### 3. First Tool Implementation Outline (~2 hours)

**Objective**: Design sprint.phase.create and sprint.getCurrentTask for Day 6-7 execution

**Files to Create**:
- `.agent/task/day-6-7-tool-plan.md`

**Tool 1: sprint.phase.create**:
- Zod schema (title, startDate, goals, duration)
- Prisma logic (create phase, auto-create child weeks)
- Validation rules (dates, progress 0-100)
- Test cases (valid input, invalid input, edge cases)

**Tool 2: sprint.getCurrentTask**:
- Query logic (find first IN_PROGRESS task)
- Response format (task + day + week + phase context)
- Error handling (no active task)
- Test cases (active task, no active task, multiple tasks)

**Success Criteria**:
- ✅ Tool specifications include Zod schemas, Prisma queries, test cases
- ✅ Implementation plan ready for immediate Day 6-7 execution
- ✅ Success criteria defined for each tool

---

### 4. Orchestrator Workflow Integration (~1 hour)

**Objective**: Document health-check tool usage in devhub-mcp-specialist workflow

**Files to Modify**:
- `.claude/agents/devhub-mcp-specialist.md` (or similar orchestrator file)

**Integration Points**:
1. **When to invoke**: Session start, pre-deployment, debugging
2. **How to invoke**: MCP tool call syntax
3. **Expected response**: JSON format, status codes
4. **Error handling**: What to do if health check fails

**Success Criteria**:
- ✅ Orchestrator workflow documents when/how to invoke health checks
- ✅ Examples provided for typical use cases
- ✅ Error handling documented

---

### 5. Technical Debt Documentation (~30 minutes)

**Objective**: Document 23-tool gap from COMPLETE_ARCHITECTURE_UPDATE_SPEC.md

**Files to Create**:
- `.agent/tech-debt/mcp-tool-gap-23-tools.md`

**Content**:
- **Summary**: 42 tools (Sprint 1-8 MVP) vs 65 tools (Sprint 1-13 full)
- **Gap Breakdown**: 23 tools by epic (EPIC-010: 8, EPIC-011: 5, EPIC-012: 5, EPIC-013: 5)
- **Implementation Plan**: Sprint 9+ incremental additions
- **Risk Assessment**: Low (MVP unaffected, additive changes)

**Files to Update**:
- `.agent/tech-context.md`: Clarify "42 tools (Sprint 1-8), 65 total (Sprint 1-13)"

**Success Criteria**:
- ✅ Technical debt documented with clear scope
- ✅ Implementation timeline defined (Sprint 9+)
- ✅ Risk assessed as low/medium impact

---

## Implementation Steps

1. Install MCP CLI and create test harness
2. Run smoke test, capture output, verify JSON format
3. Create developer onboarding SOP (MCP server launch guide)
4. Design sprint.phase.create tool specification
5. Design sprint.getCurrentTask tool specification
6. Save tool plans for Day 6-7 execution
7. Update orchestrator workflow with health-check integration
8. Create technical debt documentation (23-tool gap)
9. Update tech-context.md (clarify 42 vs 65 tools)
10. Update progress.md and active-context.md (mark Day 5 complete)

---

## Files to Create/Modify

**Create**:
- `.agent/sops/mcp-server-launch.md` (or `.claude/agents/mcp-integration.md`)
- `.agent/task/day-6-7-tool-plan.md`
- `.agent/tech-debt/mcp-tool-gap-23-tools.md`
- Test script: `apps/mcp-server/tests/smoke-test.sh` (or similar)

**Modify**:
- `.agent/task/current-session-20251107-0600.md` (progress updates)
- `.agent/active-context.md` (Day 5 → 100% complete)
- `.agent/progress.md` (Week 1 → 70% complete)
- `.agent/tech-context.md` (42 vs 65 tools clarification)
- `.claude/agents/devhub-mcp-specialist.md` (health-check integration)

---

## Success Criteria

- ✅ CLI test produces valid JSON output from health-check tool
- ✅ Developer SOP covers setup, testing, troubleshooting
- ✅ Tool specifications include Zod schemas, Prisma queries, test cases
- ✅ Orchestrator workflow documents when/how to invoke health checks
- ✅ Technical debt documented with 23-tool gap and Sprint 9+ plan
- ✅ All documentation saved to appropriate .agent/ or .claude/ locations

---

## Estimated Token Usage

- Documentation creation: ~15K tokens
- Tool design specifications: ~20K tokens
- Technical debt documentation: ~5K tokens
- Updates to memory banks: ~5K tokens
- **Total**: ~45K tokens (well within 200K budget)

---

## Notes

- **42-tool baseline** sufficient for Sprint 1-8 MVP
- **23 new tools** deferred to Sprint 9+ (Post-MVP epics)
- **No scope creep**: Day 5 focuses on hardening existing scaffold
- **Day 6-7 ready**: Tool implementation plans prepared for immediate execution

---

**Plan created**: 2025-11-07 06:00
**Approved**: 2025-11-07 06:15
