# Phase 3: Context Hints in Tool Responses

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort Estimate**: ~3 hours
**Completion Date**: 2025-12-16

## Overview

Add self-healing context hints to agentic tool responses to guide agents toward correct usage.

## Deliverables

### Context Hints Utility

Created shared utility for adding context awareness to tool responses:

**File**: `apps/mcp-server/src/utils/contextHints.ts`

```typescript
// Key exports
interface ContextStatus {
  sessionActive: boolean;
  sessionName: string | null;
  hint: string | null;
}

interface ContextHintField {
  sessionActive: boolean;
  sessionName: string | null;
  hint: string | null;
}

// Main functions
async function getContextStatus(projectId: number, httpClient: HttpClient): Promise<ContextStatus>
function addContextHintsToJson<T>(responseObj: T, status: ContextStatus): T & { _context: ContextHintField }
function addContextHintsToMarkdown(markdown: string, status: ContextStatus): string
function addResourceTipToMarkdown(markdown: string, resourceType: 'personas' | 'skills' | 'SOPs'): string
function createContextField(status: ContextStatus): ContextHintField

// Hint message generators
function getNoSessionHint(): string
function getActiveSessionHint(sessionName: string): string
function getResourceTip(resourceType: 'personas' | 'skills' | 'SOPs'): string
function getKnowledgeTip(): string
```

### Hint Messages (Verbose)

**No active session detected**:
```
"💡 Hint: No active work session detected. Consider calling projectpulse_context_load first to load project context, then projectpulse_agent_session_start to track your work."
```

**Active session exists**:
```
"💡 Hint: Active session 'Session Name' found. Call projectpulse_context_load to see full context including your current todos and progress."
```

**Resource tools tip** (personas, skills, SOPs):
```
"💡 Tip: projectpulse_context_load shows available {resourceType} in its response. Call it first for a complete overview."
```

**Knowledge tools tip**:
```
"💡 Tip: Use projectpulse_context_load first to see project context, then search knowledge for specific topics."
```

## Tools Updated (11 agent-agentic tools)

### Session Tools
- [x] `agent_session_start` - Added `_context` field with tip about context_load
- [x] `agent_session_update` - Added `_context` field with context recovery hint
- Agent_session_end - No hint needed (terminal operation)

### Resource Tools (Markdown responses with appended tips)
- [x] `persona_list` - Added resource tip via `addResourceTipToMarkdown()`
- [x] `persona_get` - Added resource tip via `addResourceTipToMarkdown()`
- [x] `skill_list` - Added resource tip via `addResourceTipToMarkdown()`
- [x] `skill_get` - Added resource tip via `addResourceTipToMarkdown()`
- [x] `sop_list` - Added resource tip via `addResourceTipToMarkdown()`
- [x] `sop_get` - Added resource tip via `addResourceTipToMarkdown()`

### Knowledge Tools (JSON responses with `_context` field)
- [x] `knowledge_search` - Added `_context` field with async context status check
- [x] `knowledge_related` - Added `_context` field with async context status check
- [x] `knowledge_metrics` - Added `_context` field with async context status check

## Files Created/Modified

### New Files
- ✅ `apps/mcp-server/src/utils/contextHints.ts` - Context hints utility

### Modified Files
- ✅ `apps/mcp-server/src/tools/agent-session/startTool.ts`
- ✅ `apps/mcp-server/src/tools/agent-session/updateTool.ts`
- ✅ `apps/mcp-server/src/tools/personas/listTool.ts`
- ✅ `apps/mcp-server/src/tools/personas/getTool.ts`
- ✅ `apps/mcp-server/src/tools/skills/listTool.ts`
- ✅ `apps/mcp-server/src/tools/skills/getTool.ts`
- ✅ `apps/mcp-server/src/tools/sops/listTool.ts`
- ✅ `apps/mcp-server/src/tools/sops/getTool.ts`
- ✅ `apps/mcp-server/src/tools/knowledge/searchTool.ts`
- ✅ `apps/mcp-server/src/tools/knowledge/relatedTool.ts`
- ✅ `apps/mcp-server/src/tools/knowledge/metricsTool.ts`

## Implementation Pattern Used

### For JSON Responses (Agent Session, Knowledge tools)

```typescript
import { getContextStatus, createContextField, type ContextHintField } from '../../utils/contextHints.js';

// In execute():
const contextStatus = await getContextStatus(projectId, context.httpClient);
const response = {
  status: 'success',
  data: {...},
  _context: createContextField(contextStatus),  // or createContextField({ custom status })
};
return JSON.stringify(response, null, 2);
```

### For Markdown Responses (Resource tools)

```typescript
import { addResourceTipToMarkdown } from '../../utils/contextHints.js';

// In execute():
const baseMarkdown = `# Available Resources\n\n...`;
const markdownWithHint = addResourceTipToMarkdown(baseMarkdown, 'personas');  // or 'skills' or 'SOPs'
return { content: [{ type: 'text', text: markdownWithHint }] };
```

## Success Criteria

- [x] All agentic tools include context hints in response
- [x] Hints are verbose and actionable (designed for "dumb models")
- [x] Context status detection works correctly (checks for IN_PROGRESS sessions)
- [x] No breaking changes to existing tool behavior (hints are additive)
- [x] TypeScript compilation passes
- [x] Error handling: hint failures don't break tool execution (fire-and-forget pattern)

## Key Design Decisions

1. **Two response patterns**: JSON tools get `_context` field, Markdown tools get appended tip section
2. **Fire-and-forget hints**: `getContextStatus()` catches all errors and returns neutral status - hint generation never breaks tool execution
3. **Verbose messages**: Hints explicitly mention `projectpulse_context_load` and `projectpulse_agent_session_start` tool names
4. **Resource-specific tips**: Different tip messages for personas vs skills vs SOPs
5. **TypeScript strictness**: Used explicit null checks for array access to satisfy TypeScript
