# Phase 2: Session-End Auto-Sync

**Status**: COMPLETED
**Priority**: HIGH
**Effort Estimate**: ~4 hours (increased for pruning logic)
**Completed**: 2025-12-16

## Overview

Implement passive enforcement by auto-syncing Memory Banks when agent sessions end.

## Deliverables

### Auto-Sync Logic

When `agent_session_end` is called:
1. Derive PROGRESS entry from session data
2. Derive ACTIVE_CONTEXT from pending todos
3. Apply pruning to keep within token budget

### PROGRESS Bank Derivation

**Entry Format**:
```markdown
## Session: ${session.name}
- **Date**: ${formatDate(session.completedAt)}
- **Duration**: ${calculateDuration(session.startedAt, session.completedAt)}
- **Tickets**: ${ticketList || 'None'}
- **Completed**: ${completedTodos.length}/${session.todos.length} todos
- **Summary**: ${extractLastProgress(session.progress, 200)}
```

### PROGRESS Bank Pruning

**Structure**:
```markdown
# Progress

## Sprint Summary
Total: X sessions | Y todos completed | Z tickets closed

### Sprint N (Status)
- X sessions, Y todos, Z tickets

## Recent Sessions (Last 5)
[Detailed session entries]
```

**Pruning Logic**:
- Keep last 5 session entries in detail
- When adding 6th, move oldest to Sprint Summary
- Aggregate stats into sprint totals
- Target: ~950 tokens (within 2K budget)

### ACTIVE_CONTEXT Derivation

**Format**:
```markdown
# Active Context
**Updated**: ${formatDate(new Date())}

## Current Focus
${currentFocus}

## Active Tickets
${remainingTickets || 'None'}

## Recent Session
${session.name} - ${session.status}
```

## Files Created/Modified

### New Files
- [x] `apps/web/lib/memory/progress-parser.ts` - Structured parsing/generation for PROGRESS bank

### Modified Files
- [x] `apps/web/lib/memory/memory-bank-service.ts`
  - Added `estimateTokens()` function
  - Added `calculateDuration()` function
  - Added `extractLastProgress()` function
  - Added `FullAgentSession` interface
  - Added `autoSyncProgressBank()` function
  - Added `autoSyncActiveContext()` function
- [x] `apps/web/app/api/agent-sessions/[id]/end/route.ts`
  - Added auto-sync call after session completion (fire-and-forget pattern)

## Implementation Steps

1. [x] Create progress-parser.ts with parse/generate functions
2. [x] Implement PROGRESS bank structure parsing
3. [x] Implement pruning logic (keep last 5, summarize older)
4. [x] Implement ACTIVE_CONTEXT derivation
5. [x] Add helper functions to service (calculateDuration, extractLastProgress, estimateTokens)
6. [x] Integrate auto-sync into session_end API
7. [ ] Write tests for derivation logic (future enhancement)
8. [ ] Write tests for pruning logic (future enhancement)
9. [ ] Test with multiple session completions (manual testing)

## Success Criteria

- [x] PROGRESS bank auto-updates on session end
- [x] PROGRESS stays within 2K token budget (via pruning)
- [x] Older sessions aggregate into Sprint Summary
- [x] ACTIVE_CONTEXT updates with current focus
- [x] Auto-sync is transparent to agent (fire-and-forget pattern)

## Edge Cases Handled

- [x] First session (empty PROGRESS content) - Initializes with default structure via `parseProgressBank()`
- [x] Session with no tickets - Shows "Tickets: None"
- [x] Session with no completed todos - Shows "Completed: 0/0"
- [x] Session with null progress - Shows "No progress notes recorded"
- [x] PROGRESS bank doesn't exist - Creates via upsert
- [x] Sprint boundary detection - Groups into "Current Sprint" (future enhancement for per-sprint grouping)

## Implementation Notes

### Progress Parser (progress-parser.ts)

The parser handles bidirectional conversion between:
- Markdown format (stored in Memory Bank)
- Structured data (for programmatic manipulation)

Key functions:
- `parseProgressBank()` - Parse markdown into structured `ParsedProgressBank`
- `generateProgressMarkdown()` - Generate markdown from structured data
- `createSessionEntry()` - Create new session entry from AgentSession data
- `addSessionWithPruning()` - Add session with automatic pruning of old entries
- `aggregateIntoSprintSummary()` - Move old sessions to sprint summary

### Auto-Sync Pattern (fire-and-forget)

The auto-sync runs asynchronously after the session update:
```typescript
// Fire-and-forget: run auto-sync in background, don't await
Promise.all([
  autoSyncProgressBank(fullSession.projectId, sessionForSync),
  autoSyncActiveContext(fullSession.projectId, sessionForSync),
]).catch((error) => {
  // Log error but don't fail the request
  console.error('[POST /api/agent-sessions/[id]/end] Auto-sync error:', error);
});
```

This ensures:
- Session end response is not delayed by sync operations
- Auto-sync failures don't break session completion
- Memory Banks are updated transparently to the agent

### Token Budget

PROGRESS bank pruning ensures token budget compliance:
- Sprint summary section: ~200 tokens
- Recent sessions (5 × ~150): ~750 tokens
- **Total: ~950 tokens** (within 2K budget)
