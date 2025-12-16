# Memory Bank vs Agent Session: Self-Guiding MCP Architecture

## The Real Problem

**Original Question**: Do Memory Banks and Agent Sessions overlap?
**Deeper Problem**: How do we enforce correct workflows when external agents connect via MCP?

### Core Challenges
1. **No Control Over External Agents** - We don't know when user starts a new chat
2. **Context Compaction** - Agent loses memory mid-session, needs to recover
3. **Dumb Models** - Some agents won't follow complex workflows
4. **User Intervention** - Currently requires user to tell agent "fetch context"

---

## Tool Categorization (82 Total Tools)

### User-Explicit Tools (~50) - No Changes Needed
User tells agent what to do → agent calls tool directly

| Domain | Tools | Example User Command |
|--------|-------|---------------------|
| Ticket Management | 6 | "Create a bug ticket for..." |
| Wiki | 5 | "Document this process" |
| Roadmap/Sprint | 7 | "Create Sprint 13" |
| Batch Creation | 4 | "Create these personas" |
| Repository | 2 | "Bootstrap the project" |
| Knowledge (create/export) | 4 | "Store this knowledge" |

### Agent-Agentic Tools (~20) - Need Self-Guiding
Agent decides when to call based on context/reasoning

| Domain | Tools | When Agent Calls |
|--------|-------|------------------|
| Memory Banks | 3→2 | Starting session, recovering context |
| Agent Session | 3 | Tracking work progress |
| Knowledge (search) | 3 | Researching before acting |
| Persona/Skill/SOP | 6 | Loading relevant guidance |
| Observability | 2 | Logging actions (behind scenes) |

### Mixed Tools (~12) - Guided Flows
User initiates, agent drives the flow

| Domain | Tools | Pattern |
|--------|-------|---------|
| Onboarding | 14 | User starts onboarding → agent asks questions |
| Workflow | 7 | User starts workflow → system executes steps |

---

## Refined Data Model (Per User Requirements)

### Memory Banks = PROJECT STATE

**PROGRESS Bank** - What's been accomplished
```markdown
# Progress

## Sprint Summary
- Sprint 11: Completed (2025-12-01) - 15 tickets closed
- Sprint 12: In Progress - 8/20 tickets closed

## Phase Summary
- Phase 1: Setup - COMPLETE
- Phase 2: Core Features - COMPLETE
- Phase 3: Integration - IN PROGRESS (60%)

## Recent Completions
- [TICK-42] User authentication - CLOSED
- [TICK-43] API rate limiting - CLOSED
```

**ACTIVE_CONTEXT Bank** - Current project focus
```markdown
# Active Context

## Current Focus
- Phase: 3 - Integration
- Sprint: 12 - MCP Enhancements
- Current Ticket: TICK-45 (Agent Session Management)

## Priority
High - complete agent workflow before beta
```

### Agent Sessions = EXECUTION STATE

**Session Data** - What agent is doing RIGHT NOW
```json
{
  "name": "Implementing TICK-45",
  "plan": "# Plan\n1. Create model\n2. Add API routes...",
  "todos": [
    {"content": "Create Prisma model", "status": "completed"},
    {"content": "Add API routes", "status": "in_progress"}
  ],
  "progress": "Created model. Working on routes...",
  "activeTicketIds": ["45"]
}
```

### Clear Separation

| Aspect | Memory Banks | Agent Sessions |
|--------|--------------|----------------|
| **What** | PROJECT STATE | EXECUTION STATE |
| **Answers** | "What's done? What's current focus?" | "What am I doing right now?" |
| **Lifecycle** | Persistent across all sessions | Ephemeral per work session |
| **Updates** | Sprint/phase boundaries | Every few minutes |

---

## Solution: Self-Guiding MCP Pattern

### Principle
Design tools that **guide agents toward correct usage** rather than relying on agents to know the workflow.

### Component 1: Unified Entry Point Tool

**New Tool**: `projectpulse_context_load`

Combines ALL context loading in ONE call:

```typescript
projectpulse_context_load({
  projectId: number
}) -> {
  // Memory Banks (project state)
  memoryBanks: {
    PROJECT_BRIEF: string,
    SYSTEM_PATTERNS: string,
    TECH_CONTEXT: string,
    ACTIVE_CONTEXT: string,
    PROGRESS: string
  },

  // Active Session (if any)
  activeSession: {
    id: string,
    name: string,
    plan: string,
    todos: TodoItem[],
    progress: string
  } | null,

  // Workflow hints for agent
  hints: [
    "Active session 'TICK-45' found - consider resuming",
    "Current focus: Sprint 12 MCP Enhancements"
  ],

  // Metadata
  totalTokens: number,
  timestamp: string
}
```

**Why This Helps:**
- ONE tool to call instead of multiple
- Agent gets everything needed upfront
- Hints guide next steps
- Works with dumb models (just call this one tool)

### Component 2: Self-Healing Tool Responses

Every tool includes context awareness:

```typescript
// Inside any tool response
{
  // Normal response data
  success: true,
  data: {...},

  // Context awareness (always included)
  _context: {
    loaded: boolean,      // Was context loaded before this call?
    sessionActive: boolean,  // Is there an active session?
    hint: string | null   // Guidance if something is off
  }
}
```

**Example Scenarios:**

Agent calls `ticket_update` without loading context:
```json
{
  "success": true,
  "ticket": {...},
  "_context": {
    "loaded": false,
    "sessionActive": false,
    "hint": "Consider calling projectpulse_context_load first for project context"
  }
}
```

Agent calls `ticket_update` after context compaction:
```json
{
  "success": true,
  "ticket": {...},
  "_context": {
    "loaded": false,
    "sessionActive": true,
    "hint": "You have an active session 'TICK-45'. Call context_load to recover state."
  }
}
```

### Component 3: Explicit Tool Descriptions

Update ALL tool descriptions to be crystal clear:

```typescript
{
  name: "projectpulse_context_load",
  description: `🚀 START HERE - Load project context and active session.

Call this FIRST when starting work or after context loss.

Returns:
- Memory Banks (project knowledge, patterns, current focus)
- Active Session (if resuming previous work)
- Workflow hints (what to do next)

This is your entry point to ProjectPulse.`
}
```

```typescript
{
  name: "projectpulse_ticket_update",
  description: `Update a ticket's status or fields.

RECOMMENDED: Call projectpulse_context_load first if you haven't already.

If you have an active session, consider calling session_update
to track your progress.`
}
```

### Component 4: Session-End Auto-Sync (Passive Enforcement)

When session ends, we **DERIVE** what to sync from session data - no agent effort required.

**Example PROGRESS Bank Entry (auto-appended)**:
```markdown
## Session: Implementing TICK-45 Agent Session
- **Date**: 2025-12-15 14:30
- **Duration**: 2h 15m
- **Tickets**: TICK-45, TICK-46
- **Completed**: 5/7 todos
- **Summary**: Created AgentSession model, added API routes, wrote validation schemas.
```

**Example ACTIVE_CONTEXT Bank (auto-replaced)**:
```markdown
# Active Context
**Updated**: 2025-12-15 14:30

## Current Focus
Next up: Write unit tests for session API

## Active Tickets
TICK-46

## Recent Session
Implementing TICK-45 Agent Session - COMPLETED
```

**Auto-Derivation Logic:**

```typescript
// Inside session_end API handler
async function autoSyncToMemoryBanks(session: AgentSession) {
  const completedTodos = session.todos.filter(t => t.status === 'completed');
  const pendingTodos = session.todos.filter(t => t.status !== 'completed');
  const ticketList = session.activeTicketIds.map(id => `TICK-${id}`).join(', ');

  // 1. DERIVE summary for PROGRESS bank
  const progressEntry = `
## Session: ${session.name}
- **Date**: ${formatDate(session.completedAt)}
- **Duration**: ${calculateDuration(session.startedAt, session.completedAt)}
- **Tickets**: ${ticketList || 'None'}
- **Completed**: ${completedTodos.length}/${session.todos.length} todos
- **Summary**: ${extractLastProgress(session.progress, 200)}
`;

  // 2. APPEND to PROGRESS bank (preserve history)
  await appendToMemoryBank(session.projectId, 'PROGRESS', progressEntry);

  // 3. DERIVE current focus for ACTIVE_CONTEXT
  let currentFocus: string;
  if (pendingTodos.length === 0) {
    currentFocus = 'No active work - ready for next task';
  } else {
    const inProgress = pendingTodos.find(t => t.status === 'in_progress');
    currentFocus = inProgress
      ? `Working on: ${inProgress.content}`
      : `Next up: ${pendingTodos[0].content}`;
  }

  const remainingTickets = pendingTodos
    .filter(t => t.ticketId)
    .map(t => `TICK-${t.ticketId}`)
    .join(', ');

  const activeContext = `
# Active Context
**Updated**: ${formatDate(new Date())}

## Current Focus
${currentFocus}

## Active Tickets
${remainingTickets || 'None'}

## Recent Session
${session.name} - ${session.status}
`;

  // 4. REPLACE ACTIVE_CONTEXT bank (current state only)
  await updateMemoryBank(session.projectId, 'ACTIVE_CONTEXT', activeContext);
}
```

**Why This Works (Passive Enforcement):**
- Agent doesn't need to know about Memory Banks
- System extracts relevant data from session state
- Memory Banks stay fresh automatically
- Works with dumb models (they just call session_end)

### PROGRESS Bank Pruning Strategy

**Problem**: PROGRESS bank has ≤2K token budget. Unbounded appending would exceed this.

**Solution**: Smart content management with rolling window + summarization

**PROGRESS Bank Structure**:
```markdown
# Progress

## Sprint Summary
Total: 23 sessions | 112 todos completed | 28 tickets closed

### Sprint 11 (Completed: 2025-12-01)
- 15 sessions, 67 todos, 18 tickets

### Sprint 12 (In Progress)
- 8 sessions, 45 todos, 10 tickets

## Recent Sessions (Last 5)

### Implementing TICK-46 (2025-12-15)
- Tickets: TICK-46 | Completed: 5/7 | Auth flow...

### Implementing TICK-45 (2025-12-14)
- Tickets: TICK-45 | Completed: 7/7 | Database models...

[... 3 more recent sessions ...]
```

**Pruning Logic**:
```typescript
async function autoSyncProgress(session: AgentSession) {
  // 1. Parse current PROGRESS bank into structured sections
  const parsed = parseProgressBank(currentProgress);

  // 2. Create new session entry
  const newEntry = createSessionEntry(session);

  // 3. PRUNING: If recent sessions >= 5, move oldest to sprint summary
  if (parsed.recentSessions.length >= 5) {
    const oldest = parsed.recentSessions.shift();
    aggregateIntoSprintSummary(parsed.sprintSummary, oldest);
  }

  // 4. Add new session to recent
  parsed.recentSessions.push(newEntry);

  // 5. Regenerate markdown and REPLACE (not append)
  const newProgress = generateProgressMarkdown(parsed);
  await updateMemoryBank(projectId, 'PROGRESS', newProgress);
}
```

**Token Budget**:
- Sprint summary section: ~200 tokens
- Recent sessions (5 × ~150): ~750 tokens
- **Total: ~950 tokens** (within 2K budget)

**What CAN'T Be Auto-Derived:**
| Bank | Auto-Sync? | Strategy | Token Budget |
|------|-----------|----------|--------------|
| PROGRESS | ✅ YES | Smart replace with pruning | ≤2K |
| ACTIVE_CONTEXT | ✅ YES | Replace (current state only) | ≤1K |
| PROJECT_BRIEF | ❌ NO | Manual via context_update | ≤3K |
| SYSTEM_PATTERNS | ❌ NO | Manual via context_update | ≤2K |
| TECH_CONTEXT | ❌ NO | Manual via context_update | ≤2K |

---

## Implementation Plan

### Phase 1: Create Context Tools (HIGH PRIORITY)
**Effort**: ~5 hours | **Impact**: High

**Goal**: Complete context management (read + write)

**1a. Create `context_load` (READ - agent-agentic)**
- API endpoint: `GET /api/context/load?projectId=X`
- MCP tool: `projectpulse_context_load`
- Response includes:
  - All 5 memory banks
  - Active session (if IN_PROGRESS exists)
  - Workflow hints based on state
  - Available resources summary (personas, skills, SOPs count)
  - Total token count
- Options: `banksToLoad: 'all' | 'active-only' | MemoryBankType[]`

**1b. Create `context_update` (WRITE - user-explicit)**
- API endpoint: `PUT /api/context/update`
- MCP tool: `projectpulse_context_update`
- Parameters:
  - `projectId: number`
  - `bankType: MemoryBankType`
  - `content: string`
  - `mode: 'replace' | 'append'`
- Use cases:
  - User: "Add this pattern to SYSTEM_PATTERNS"
  - User: "Update TECH_CONTEXT with new dependency"

**1c. Rename `memory_patternLookup` → `context_lookup`**
- Update tool name and description
- Keep same functionality

**Files:**
- `apps/web/app/api/context/load/route.ts` (NEW)
- `apps/web/app/api/context/update/route.ts` (NEW)
- `apps/mcp-server/src/tools/context/loadTool.ts` (NEW)
- `apps/mcp-server/src/tools/context/updateTool.ts` (NEW)
- `apps/mcp-server/src/tools/context/lookupTool.ts` (renamed from patternLookup)
- `apps/mcp-server/src/tools/index.ts` (register tools)

### Phase 2: Session-End Auto-Sync (HIGH PRIORITY)
**Effort**: ~3 hours | **Impact**: High

**Goal**: Memory Banks stay fresh automatically (passive enforcement)

1. Implement `appendToMemoryBank()` function in service layer
2. Add auto-derivation logic in session end handler:
   - Derive PROGRESS entry from session data
   - Derive ACTIVE_CONTEXT from pending todos
3. Auto-sync triggers on EVERY session end (no opt-in needed)

**Files:**
- `apps/web/lib/memory/memory-bank-service.ts` (add append function)
- `apps/web/app/api/agent-sessions/[id]/end/route.ts` (add sync call)
- `apps/mcp-server/src/tools/agent-session/endTool.ts` (no change - sync in API)

### Phase 3: Add Context Hints to Tool Responses (MEDIUM PRIORITY)
**Effort**: ~3 hours | **Impact**: Medium

**Goal**: Self-healing guidance for dumb models

1. Create shared context-check utility (not middleware - per-tool check)
2. Add `_context` field to agentic tool responses (~20 tools)
3. Verbose hints when context not loaded

**Files:**
- `apps/mcp-server/src/utils/contextHints.ts` (NEW)
- `apps/mcp-server/src/tools/agent-session/*.ts` (add hints)
- `apps/mcp-server/src/tools/knowledge/*.ts` (add hints to search tools)

### Phase 4: Deprecate Old Memory Tools (LOW PRIORITY)
**Effort**: ~1 hour | **Impact**: Low

**Goal**: Clean up tool proliferation

1. Mark `memory_sessionStart` as deprecated in description
2. Mark `memory_contextRecovery` as deprecated in description
3. Rename `memory_patternLookup` to `context_lookup`
4. Update docs to recommend `context_load`

**Files:**
- `apps/mcp-server/src/tools/memory/*.ts` (update descriptions)
- `docs/features/mcp-tools-guide.md` (update docs)

### Phase 5: Update Tool Descriptions (LOW PRIORITY)
**Effort**: ~2 hours | **Impact**: Medium

**Goal**: Crystal-clear workflow guidance in tool descriptions

1. Add 🚀 START HERE to context_load description
2. Add RECOMMENDED/REQUIRES hints to all agentic tools
3. Document common workflows in tool descriptions

**Files:**
- `apps/mcp-server/src/tools/*.ts` (update descriptions)

---

## How This Solves Each Challenge

| Challenge | Solution |
|-----------|----------|
| Don't know when new chat starts | Unified entry point - agent just calls context_load |
| Context compaction | Self-healing hints tell agent to recover |
| Dumb models | Single entry point = minimal complexity |
| User intervention | Hints guide agent automatically |
| Stale Memory Banks | Auto-sync on session end |

---

## Tool Consolidation Strategy

Based on analysis of 82 tools:

### Memory/Context Tools: 3 → 4 (adds WRITE capability)

| Current Tool | Recommendation | Reason |
|--------------|----------------|--------|
| `memory_sessionStart` | **MERGE** → `context_load` | Unified entry point |
| `memory_contextRecovery` | **MERGE** → `context_load` | Same as above, just filtered |
| `memory_patternLookup` | **KEEP** (rename to `context_lookup`) | Token-efficient partial reads |
| *(none)* | **ADD** `context_update` | User-explicit WRITE for static banks |

**Result (4 context tools)**:
| Tool | Operation | Invocation | Purpose |
|------|-----------|------------|---------|
| `context_load` | READ | Agent-agentic | Load all banks + session + hints |
| `context_lookup` | READ | Agent-agentic | Load specific bank on-demand |
| `context_update` | WRITE | User-explicit | Update static banks (patterns, tech) |

### Agent Session Tools: Keep All 3

| Tool | Keep? | Invocation | Reason |
|------|-------|------------|--------|
| `agent_session_start` | ✅ YES | Agent-agentic | Explicit lifecycle start |
| `agent_session_update` | ✅ YES | Agent-agentic | Checkpoint during work |
| `agent_session_end` | ✅ YES | Agent-agentic | Lifecycle end + auto-sync trigger |

### Net Change: 6 tools → 7 tools
- Memory/Context: 3 → 4 (consolidate + add write)
- Session: 3 → 3 (keep as-is)

## Auto-Sync Scope (Clarified)

| Memory Bank | Auto-Sync? | Update Method |
|-------------|-----------|---------------|
| **PROGRESS** | ✅ AUTO | Append session summary on session_end |
| **ACTIVE_CONTEXT** | ✅ AUTO | Update current focus on session_end |
| PROJECT_BRIEF | ❌ MANUAL | User: "Update brief" → `context_update` |
| SYSTEM_PATTERNS | ❌ MANUAL | User: "Add pattern" → `context_update` |
| TECH_CONTEXT | ❌ MANUAL | User: "Update tech stack" → `context_update` |

**Rationale**: Dynamic banks (PROGRESS, ACTIVE_CONTEXT) change frequently based on work.
Static banks (BRIEF, PATTERNS, TECH) require deliberate updates by user/agent decision.

## Complete Tool Strategy (All 82 Tools)

### Tier 1: Core Self-Guiding (Phase 1-2) - HIGH PRIORITY

| Tool | Change | Implementation |
|------|--------|----------------|
| `context_load` | **NEW** | Unified entry with banks + session + resource metadata + hints |
| `context_lookup` | **RENAME** | From patternLookup, specific bank on-demand |
| `context_update` | **NEW** | User-explicit WRITE for static banks |
| `agent_session_end` | **MODIFY** | Add auto-sync to PROGRESS + ACTIVE_CONTEXT |

### Tier 2: Resource Discovery (Phase 3) - MEDIUM PRIORITY

| Tool | Change | Hint to Add |
|------|--------|-------------|
| `persona_list` | ADD HINT | "Use after context_load to see available personas" |
| `persona_get` | ADD HINT | "Load persona shown in context_load metadata" |
| `skill_list` | ADD HINT | Same pattern |
| `skill_get` | ADD HINT | Same pattern |
| `sop_list` | ADD HINT | Same pattern |
| `sop_get` | ADD HINT | Same pattern |
| `knowledge_search` | ADD HINT | "RECOMMENDED before implementing unfamiliar features" |
| `knowledge_related` | ADD HINT | "Find related knowledge items" |
| `knowledge_metrics` | ADD HINT | "Check knowledge base coverage" |

### Tier 3: Session Tracking Hints (Phase 5) - LOW PRIORITY

| Tool Category | Change | Example Hint |
|---------------|--------|--------------|
| Ticket tools (6) | ADD HINT | "Consider agent_session_start to track this work" |
| Wiki tools (5) | ADD HINT | Same pattern |
| Roadmap tools (4) | ADD HINT | Same pattern |

### Tier 4: No Changes Needed

| Category | Tools | Reason |
|----------|-------|--------|
| **Onboarding** | 14 | Already has 10-phase guided flow built-in |
| **Workflow** | 7 | Already has step-based execution flow |
| **Observability** | 2 | Internal tracking, works as designed |
| **Batch Creation** | 4 | Part of onboarding flow |
| **Repository** | 2 | Part of onboarding flow |
| **Health Check** | 1 | Simple status check |

### Resource Metadata in context_load

The `context_load` response includes metadata summaries so agents know what resources exist:

```typescript
availableResources: {
  personas: {
    count: 5,
    names: ["Backend Developer", "Frontend Specialist", ...]
  },
  skills: {
    count: 12,
    categories: ["api-patterns", "react-patterns", "testing", ...]
  },
  sops: {
    count: 8,
    names: ["Git Workflow", "API Creation", ...]
  }
}
```

This eliminates the need for agents to call `_list` tools just to discover what's available.

## Decisions Made

| Question | Decision | Rationale |
|----------|----------|-----------|
| Tool consolidation | Add context_update | Need user-explicit WRITE for static banks |
| Auto-sync scope | PROGRESS + ACTIVE_CONTEXT only | Dynamic banks auto-update, static banks manual |
| Hint verbosity | Verbose | Better for dumb models |
| Agent-agentic guidance | Entry point + hints | Make right path easy |
| Mixed tools | No change | Already guided |

---

## Files to Modify

### New Files
- `apps/web/app/api/context/load/route.ts`
- `apps/mcp-server/src/tools/context/loadTool.ts`
- `apps/mcp-server/src/middleware/contextAware.ts`

### Modified Files
- `apps/mcp-server/src/tools/agent-session/endTool.ts`
- `apps/web/app/api/agent-sessions/[id]/end/route.ts`
- `apps/web/lib/memory/memory-bank-service.ts`
- `apps/mcp-server/src/tools/index.ts`
- All MCP tool files (description updates)

---

## Summary

**Verdict**: Systems should COEXIST with clear boundaries:
- Memory Banks = PROJECT STATE (what's done, current focus)
- Agent Sessions = EXECUTION STATE (current task details)

**Key Innovation**: Self-Guiding MCP Pattern
1. **Unified Entry Point** - `context_load` gives everything in one call
2. **User-Explicit Write** - `context_update` for static bank updates (patterns, tech)
3. **Passive Enforcement** - Auto-sync derives PROGRESS/ACTIVE_CONTEXT from session data
4. **Self-Healing Hints** - Verbose `_context.hint` guides dumb models

**Final Tool Architecture**:
| Tool | Operation | Invocation |
|------|-----------|------------|
| `context_load` | READ all | Agent-agentic |
| `context_lookup` | READ specific | Agent-agentic |
| `context_update` | WRITE | User-explicit |
| `agent_session_start` | CREATE | Agent-agentic |
| `agent_session_update` | UPDATE | Agent-agentic |
| `agent_session_end` | COMPLETE + auto-sync | Agent-agentic |

**Implementation Phases**:
| Phase | Effort | Priority |
|-------|--------|----------|
| 1. Context Tools (load, update, lookup) | ~5 hours | HIGH |
| 2. Session-End Auto-Sync | ~3 hours | HIGH |
| 3. Context Hints in Responses | ~3 hours | MEDIUM |
| 4. Deprecate Old Memory Tools | ~1 hour | LOW |
| 5. Update Tool Descriptions | ~2 hours | LOW |

**Total Effort**: ~14 hours for full implementation

**Success Criteria**:
- [ ] Agent can call `context_load` and get all project context + active session
- [ ] User can call `context_update` to update static banks (SYSTEM_PATTERNS, TECH_CONTEXT)
- [ ] Session end auto-updates PROGRESS and ACTIVE_CONTEXT banks
- [ ] Tool responses include `_context.hint` for self-healing
- [ ] Old memory tools marked deprecated, docs updated

**Auto-Sync Scope**:
- ✅ PROGRESS: Auto-append session summary
- ✅ ACTIVE_CONTEXT: Auto-update current focus
- ❌ PROJECT_BRIEF: Manual via `context_update`
- ❌ SYSTEM_PATTERNS: Manual via `context_update`
- ❌ TECH_CONTEXT: Manual via `context_update`
