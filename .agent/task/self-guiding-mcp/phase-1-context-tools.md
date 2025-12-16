# Phase 1: Context Tools

**Status**: COMPLETED
**Priority**: HIGH
**Effort Estimate**: ~5 hours
**Completed**: 2025-12-15

## Overview

Create the core context management tools for the Self-Guiding MCP architecture.

## Deliverables

### 1a. `context_load` Tool (READ - agent-agentic)

**API Endpoint**: `GET /api/context/load?projectId=X`
**MCP Tool**: `projectpulse_context_load`

**Input Schema**:
```typescript
{
  projectId: number,
  banksToLoad?: 'all' | 'active-only' | MemoryBankType[]
}
```

**Response Schema**:
```typescript
{
  projectId: number,
  projectName: string,
  memoryBanks: {
    PROJECT_BRIEF: { content: string, tokens: number, updatedAt: string },
    SYSTEM_PATTERNS: { content: string, tokens: number, updatedAt: string },
    TECH_CONTEXT: { content: string, tokens: number, updatedAt: string },
    ACTIVE_CONTEXT: { content: string, tokens: number, updatedAt: string },
    PROGRESS: { content: string, tokens: number, updatedAt: string }
  },
  activeSession: AgentSession | null,
  availableResources: {
    personas: { count: number, names: string[] },
    skills: { count: number, categories: string[] },
    sops: { count: number, names: string[] }
  },
  hints: string[],
  totalTokens: number,
  timestamp: string
}
```

### 1b. `context_update` Tool (WRITE - user-explicit)

**API Endpoint**: `PUT /api/context/update`
**MCP Tool**: `projectpulse_context_update`

**Input Schema**:
```typescript
{
  projectId: number,
  bankType: 'PROJECT_BRIEF' | 'SYSTEM_PATTERNS' | 'TECH_CONTEXT' | 'ACTIVE_CONTEXT' | 'PROGRESS',
  content: string,
  mode: 'replace' | 'append'
}
```

### 1c. Rename `memory_patternLookup` → `context_lookup`

Update tool name and description, keep same functionality.

## Files Created/Modified

### New Files
- [x] `apps/web/app/api/context/load/route.ts` - Context load API endpoint
- [x] `apps/web/app/api/context/update/route.ts` - Context update API endpoint
- [x] `apps/mcp-server/src/tools/context/loadTool.ts` - Context load MCP tool
- [x] `apps/mcp-server/src/tools/context/updateTool.ts` - Context update MCP tool
- [x] `apps/mcp-server/src/tools/context/lookupTool.ts` - Context lookup MCP tool
- [x] `apps/mcp-server/src/tools/context/index.ts` - Context tools index

### Modified Files
- [x] `apps/mcp-server/src/tools/index.ts` (registered new tools)

## Implementation Steps

1. [x] Create API endpoint for context_load
2. [x] Create MCP tool for context_load with Zod validation
3. [x] Implement hints generation logic
4. [x] Create API endpoint for context_update
5. [x] Create MCP tool for context_update with Zod validation
6. [x] Create context_lookup tool (new tool, patternLookup kept for backwards compat)
7. [x] Register all tools in index.ts
8. [x] TypeScript compilation verification

## Success Criteria

- [x] `context_load` returns all 5 banks + active session
- [x] `context_load` includes workflow hints based on state
- [x] `context_load` includes resource metadata (personas, skills, SOPs)
- [x] `context_update` supports replace and append modes
- [x] `context_update` enforces token budgets per bank type
- [x] `context_lookup` works for selective bank loading
- [x] All tools registered and callable via MCP
- [x] TypeScript compilation passes

## Implementation Notes

### Hints Generation

The `context_load` tool generates dynamic workflow hints based on:
- Active session state (name, tickets, todos progress)
- Available resources (personas, skills, SOPs counts)
- Memory bank freshness (warns if ACTIVE_CONTEXT is stale)

### Token Budgets (context_update)

- PROJECT_BRIEF: 3K tokens
- SYSTEM_PATTERNS: 2K tokens
- TECH_CONTEXT: 2K tokens
- ACTIVE_CONTEXT: 1K tokens
- PROGRESS: 2K tokens

### Backwards Compatibility

The legacy memory tools (`memory_sessionStart`, `memory_patternLookup`, `memory_contextRecovery`) are kept for backward compatibility. They work alongside the new context tools. Phase 4 will add deprecation notices to guide users toward the new tools.
