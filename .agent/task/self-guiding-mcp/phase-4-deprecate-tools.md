# Phase 4: Deprecate Old Memory Tools

**Status**: ✅ COMPLETED
**Priority**: LOW
**Effort Estimate**: ~1 hour
**Completed**: 2025-12-16

## Overview

Mark old memory tools as deprecated and update documentation to recommend new context tools.

## Implementation Summary

### Approach: Soft Deprecation

Instead of renaming tools (which would break backward compatibility), we implemented **soft deprecation**:
1. Added deprecation notices to tool descriptions
2. Added `_deprecation` field to tool responses
3. Updated tool registration comments
4. Updated documentation with migration guide

### Changes Made

**memory_sessionStart** (`sessionStartTool.ts`):
- Added `⚠️ DEPRECATED` prefix to description
- Added migration guidance to `context_load`
- Added `_deprecation` field in response with warning and replacement

**memory_contextRecovery** (`contextRecoveryTool.ts`):
- Same pattern as above
- Points to `context_load({ banksToLoad: 'active-only' })`

**memory_patternLookup** (`patternLookupTool.ts`):
- Same deprecation pattern
- Points to `context_lookup`
- Note: Tool was NOT renamed to preserve backward compatibility

## Files Modified

### MCP Tool Files
- [x] `apps/mcp-server/src/tools/memory/sessionStartTool.ts` - Added deprecation notice + response hint
- [x] `apps/mcp-server/src/tools/memory/contextRecoveryTool.ts` - Added deprecation notice + response hint
- [x] `apps/mcp-server/src/tools/memory/patternLookupTool.ts` - Added deprecation notice + response hint
- [x] `apps/mcp-server/src/tools/index.ts` - Updated comments to mark deprecated vs preferred tools

### Documentation
- [x] `docs/features/mcp-tools-guide.md` - Added Context & Memory Bank Tools section with migration table

## Success Criteria

- [x] Deprecated tools show warning in description
- [x] Response includes `_deprecation` field with migration guidance
- [x] Documentation updated with new recommendations
- [x] No breaking changes (deprecated tools still work)
- [x] TypeScript compilation passes
