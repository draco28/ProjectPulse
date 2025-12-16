# Self-Guiding MCP Architecture

**Feature**: Unified context management with self-guiding agent workflows
**Status**: ✅ COMPLETE (All 5 Phases Done)
**Total Effort**: ~15 hours
**Completed**: 2025-12-16

## Problem Statement

Memory Bank System and Agent Session Management have overlapping features. External agents connect via MCP but we have no control over when/how they call our tools, leading to:
- Agents not loading context before working
- Context compaction without recovery
- "Dumb models" not following complex workflows
- Stale Memory Banks from lack of updates

## Solution: Self-Guiding MCP Pattern

Design tools that **guide agents toward correct usage** rather than relying on them to know the workflow.

### Key Components

1. **Unified Entry Point** (`context_load`) - One tool to load everything
2. **Passive Enforcement** - Auto-sync Memory Banks on session end
3. **Self-Healing Hints** - Tool responses guide agents toward correct usage
4. **Clear Data Boundaries** - Memory Banks = PROJECT STATE, Sessions = EXECUTION STATE

## Implementation Phases

| Phase | Description | Priority | Effort | Status |
|-------|-------------|----------|--------|--------|
| [Phase 1](./phase-1-context-tools.md) | Context Tools (load, update, lookup) | HIGH | ~5h | ✅ DONE |
| [Phase 2](./phase-2-auto-sync.md) | Session-End Auto-Sync with Pruning | HIGH | ~4h | ✅ DONE |
| [Phase 3](./phase-3-context-hints.md) | Context Hints in Tool Responses | MEDIUM | ~3h | ✅ DONE |
| [Phase 4](./phase-4-deprecate-tools.md) | Deprecate Old Memory Tools | LOW | ~1h | ✅ DONE |
| [Phase 5](./phase-5-tool-descriptions.md) | Update Tool Descriptions | LOW | ~2h | ✅ DONE |

## Files

- `MASTER-PLAN.md` - Complete detailed plan from planning session
- `phase-1-context-tools.md` - Phase 1 implementation details
- `phase-2-auto-sync.md` - Phase 2 implementation details
- `phase-3-context-hints.md` - Phase 3 implementation details
- `phase-4-deprecate-tools.md` - Phase 4 implementation details
- `phase-5-tool-descriptions.md` - Phase 5 implementation details

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Systems coexistence | Coexist | Different concerns (knowledge vs execution) |
| Auto-sync scope | PROGRESS + ACTIVE_CONTEXT | Dynamic banks auto-update |
| Static banks | Manual via context_update | Deliberate updates |
| Hint verbosity | Verbose | Works with dumb models |
| Pruning strategy | Rolling window + summarization | Stay within token budget |

## Success Criteria

- [x] Agent can call `context_load` and get all project context
- [x] Session end auto-updates Memory Banks
- [x] PROGRESS bank stays within 2K token budget
- [x] Tool responses include self-healing hints
- [x] Old tools deprecated with migration path
- [x] Tool descriptions enhanced with category labels and "When to Use"

## Related Documentation

- [CLAUDE.md](/CLAUDE.md) - Main integration guide
- [Memory Bank Strategy](/.agent/system/memory-mcp-strategy.md)
- [MCP Tools Guide](/docs/features/mcp-tools-guide.md)
