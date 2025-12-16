# Phase 5: Update Tool Descriptions

**Status**: ✅ COMPLETED
**Priority**: LOW
**Effort Estimate**: ~2 hours
**Completed**: 2025-12-16

## Overview

Polish all tool descriptions with clear workflow guidance, making the self-guiding pattern complete.

## Deliverables

### Entry Point Tool Description

**context_load**:
```typescript
description: `🚀 START HERE - Load project context and active session.

Call this FIRST when:
- Starting a new work session
- After context compaction (lost memory)
- When unsure about project state

Returns:
- All 5 memory banks (project brief, patterns, tech, current focus, progress)
- Active session if you have work in progress
- Available resources (personas, skills, SOPs)
- Workflow hints for what to do next

This is your entry point to ProjectPulse.`
```

### Resource Tool Descriptions

Add "RECOMMENDED: Call context_load first" pattern:

```typescript
// persona_get example
description: `Load full persona details including system prompt.

RECOMMENDED: Call projectpulse_context_load first to see available personas
in the availableResources.personas metadata.

Use this to load a specific persona for task specialization.`
```

### User-Explicit Tool Hints

Add session tracking suggestions:

```typescript
// ticket_create example
description: `Create a new ticket in ProjectPulse.

TIP: Consider using projectpulse_agent_session_start to track your work
if you haven't already. This helps maintain progress history.`
```

## Tools Updated

### Entry Point (1)
- [x] `context_load` - 🚀 [ENTRY POINT] START HERE marker

### Agent Session Tools (3)
- [x] `agent_session_start` - [SESSION] with "When to Use" and "Next Actions"
- [x] `agent_session_update` - [SESSION] with "When to Use" and requirements
- [x] `agent_session_end` - [SESSION] with auto-sync documentation

### Resource Tools (6)
- [x] `persona_list` - [RESOURCE] with "When to Use" pattern
- [x] `persona_get` - [RESOURCE] with "When to Use" pattern
- [x] `skill_list` - [RESOURCE] with "When to Use" and filter documentation
- [x] `skill_get` - [RESOURCE] with "When to Use" pattern
- [x] `sop_list` - [RESOURCE] with "When to Use" pattern
- [x] `sop_get` - [RESOURCE] with "When to Use" pattern

### Knowledge Tools (3)
- [x] `knowledge_search` - [QUERY] with search modes and related tools
- [x] `knowledge_related` - [QUERY] with graph depth documentation
- [x] `knowledge_metrics` - [QUERY] with filter documentation

### User-Explicit Tools (2 - high priority)
- [x] `ticket_search` - [QUERY] with filters and related tools
- [x] `ticket_create` - [ACTION] with kinds, sources, and recommendations

## Files to Modify

- `apps/mcp-server/src/tools/context/loadTool.ts`
- `apps/mcp-server/src/tools/persona/*.ts`
- `apps/mcp-server/src/tools/skill/*.ts`
- `apps/mcp-server/src/tools/sop/*.ts`
- `apps/mcp-server/src/tools/knowledge/*.ts`
- `apps/mcp-server/src/tools/ticket/*.ts`
- `apps/mcp-server/src/tools/wiki/*.ts`
- `apps/mcp-server/src/tools/roadmap/*.ts`

## Implementation Steps

1. [x] Update context_load with 🚀 [ENTRY POINT] START HERE
2. [x] Update agent session tool descriptions (3 tools)
3. [x] Update resource tool descriptions (6 tools)
4. [x] Update knowledge tool descriptions (3 tools)
5. [x] Update ticket tools (2 tools)
6. [x] Verify TypeScript compilation

## Success Criteria

- [x] context_load clearly marked as [ENTRY POINT]
- [x] Agent session tools have [SESSION] category and "When to Use"
- [x] Resource tools have [RESOURCE] category with "When to Use"
- [x] Knowledge tools have [QUERY] category with search mode documentation
- [x] Ticket tools have appropriate categories ([QUERY], [ACTION])
- [x] Descriptions are consistent in style with category labels
- [x] TypeScript compilation passes

## Description Template Pattern

All enhanced tools follow this structure:
```
[CATEGORY] One-line purpose

When to Use:
- Criteria 1
- Criteria 2
- Criteria 3

[Relevant details: filters, returns, modes, etc.]

Next/Related:
→ projectpulse_tool_name - when to use
```

Categories used:
- `[ENTRY POINT]` - Start here tools
- `[SESSION]` - Agent session management
- `[RESOURCE]` - Skill/Persona/SOP access
- `[QUERY]` - Search and lookup tools
- `[ACTION]` - Create/modify tools
