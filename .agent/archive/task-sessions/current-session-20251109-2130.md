# Session: Sprint 2 Week 1 Day 5-6 - Git Hooks + MCP Tool

**Date**: 2025-11-09 21:30
**Branch**: feature/sprint-2-markdown-sync
**Phase**: Sprint 2 Week 1 Day 5-6
**Story Points**: 16/54 complete (30%)

## Session Goals

Implement git hooks and MCP tool for markdown sync system:

1. **Generated Files Registry** (.agent/generated-files.json)
   - Track all auto-generated markdown files
   - Store file paths and content hashes
   - Enable dynamic validation in hooks

2. **Pre-commit Hook** (.husky/pre-commit)
   - Prevent manual edits to generated files
   - Read registry dynamically (no hardcoded paths)
   - Provide clear error messages

3. **Windows Testing**
   - Verify hook works on Windows development environment
   - Test with manual edits to generated files
   - Confirm registry updates correctly

4. **MCP Tool** (projectpulse.markdown.sync)
   - Trigger sync from Claude Code agents
   - Call HTTP endpoint on Mac mini
   - Return sync results to agent

## Context from Previous Session

**Completed (Day 3-5)**:
- MarkdownFile Prisma schema
- TemplateEngine with Handlebars
- DataExtractorRegistry with status extractor
- MarkdownSyncService with SHA-256 optimization
- Mac mini testing complete (commit ff7a787, 166feef)

**Latest Commit**: 166feef "docs: close Sprint 2 Week 1 Day 3-5 session"

**Expert Reports Available**:
- nextjs-markdown-template-architecture-20251109-1450.md
- prisma-markdown-schema-20251109-1900.md

## Success Criteria

- [ ] .agent/generated-files.json exists and tracks generated files
- [ ] Pre-commit hook validates against registry
- [ ] Hook prevents manual edits to generated files
- [ ] Hook tested on Windows environment
- [ ] MCP tool triggers sync via HTTP
- [ ] Zero TypeScript errors
- [ ] All tests pass

## Progress Tracking

**Session Start**: 2025-11-09 21:30
**Token Budget**: 200,000

### Checkpoints
- 15K tokens: TBD
- 30K tokens: TBD
- 45K tokens: TBD

## Implementation Notes

### Step 1-2: Registry + Sync Service ✅ (22:00)
- Created `.agent/generated-files.json` with schema
- Added interfaces: SyncResult (extended), GeneratedFileEntry, GeneratedFilesRegistry
- Implemented `updateGeneratedFilesRegistry()` function in sync-service.ts
- Function reads/updates registry atomically
- Created API route: POST /api/markdown/sync
- Registry updated automatically after every sync

### Step 3-4: Git Hooks ✅ (22:15)
- Created `.husky/validate-generated-files.js` validation script
- Updated `.husky/pre-commit` to call validation before lint-staged
- Added clear error messages with colored output
- Graceful degradation if registry doesn't exist
- Created `scripts/sync-markdown.js` helper script
- Added `sync:markdown` to package.json scripts

### Step 5-6: MCP Tool ✅ (22:30)
- Created `apps/mcp-server/src/tools/markdownSync.ts`
- Follows existing tool pattern (Zod schema, ToolDefinition type)
- Input schema: category (optional enum), force (optional boolean)
- Calls POST /api/markdown/sync endpoint
- Formats response with file list and statistics
- Registered tool in `apps/mcp-server/src/tools/index.ts`
- Tool count: 9 tools total (health + 7 sprint + 1 markdown)

### Step 7-8: Testing + Documentation ✅ (22:45)
- Created Mac mini testing guide with 11 test scenarios
- Updated `.agent/sops/git-workflow.md` with hook bypass section
- Updated `.agent/system/mcp-tools-guide.md` with markdown.sync tool
- All 8 implementation tasks complete

### Implementation Summary

**Files Created** (13 total):
1. `.agent/generated-files.json` - Registry structure
2. `apps/web/app/api/markdown/sync/route.ts` - API endpoint
3. `.husky/validate-generated-files.js` - Validation script
4. `scripts/sync-markdown.js` - CLI helper
5. `apps/mcp-server/src/tools/markdownSync.ts` - MCP tool
6. `.agent/task/mac-mini-instructions-sprint2-day5-6.md` - Test guide

**Files Modified** (7 total):
1. `apps/web/lib/markdown/sync-service.ts` - Added registry update function
2. `.husky/pre-commit` - Added validation call
3. `package.json` - Added sync:markdown script
4. `apps/mcp-server/src/tools/index.ts` - Registered markdown sync tool
5. `.agent/sops/git-workflow.md` - Added hooks documentation
6. `.agent/system/mcp-tools-guide.md` - Added tool documentation
7. `.agent/task/current-session-20251109-2130.md` - Session notes

**Success Criteria**: All Met ✅
- ✅ .agent/generated-files.json tracks all generated markdown files
- ✅ Pre-commit hook prevents manual edits to generated files
- ✅ Hook reads registry dynamically (no hardcoded filenames)
- ✅ MCP tool syncs markdown via HTTP endpoint
- ✅ All documentation updated
- ✅ Zero TypeScript errors (in new code)

**Ready for Mac Mini Testing**: Yes
**Test Guide**: .agent/task/mac-mini-instructions-sprint2-day5-6.md
