# Sprint 2 Week 1 Day 5-6 - Task List

**Created**: 2025-11-09 21:30
**Phase**: Git Hooks + MCP Tool
**Story Points**: 8 points (5 git hooks + 3 MCP tool)
**Progress**: 0/8 tasks (0%)

---

## Task Breakdown

### Step 1: Registry Structure (30 mins)
- [ ] Create `.agent/generated-files.json` with schema
- [ ] Add version field, lastUpdated, generatedFiles array
- [ ] Document registry structure in session notes

**Completion**: 0%

---

### Step 2: Sync Service Registry Update (45 mins)
- [ ] Add `updateGeneratedFilesRegistry()` function
- [ ] Integrate registry update after successful sync
- [ ] Handle file write errors gracefully
- [ ] Test registry updates with sync service

**Completion**: 0%

---

### Step 3: Pre-Commit Hook (60 mins)
- [ ] Create `.husky/pre-commit` Node.js script
- [ ] Implement registry file reading
- [ ] Implement staged files detection
- [ ] Implement protected file validation
- [ ] Add clear error messages
- [ ] Make script executable

**Completion**: 0%

---

### Step 4: Configure Husky (15 mins)
- [ ] Check Husky is in package.json devDependencies
- [ ] Run `npx husky install`
- [ ] Configure pre-commit hook
- [ ] Verify hook is executable on Windows

**Completion**: 0%

---

### Step 5: MCP Tool Creation (60 mins)
- [ ] Create `apps/mcp-server/src/tools/markdown-sync.ts`
- [ ] Define input schema (category, force params)
- [ ] Implement HTTP call to `/api/markdown/sync`
- [ ] Format response for MCP protocol
- [ ] Handle errors gracefully

**Completion**: 0%

---

### Step 6: Register MCP Tool (10 mins)
- [ ] Import tool in `apps/mcp-server/src/tools/index.ts`
- [ ] Add to tools array
- [ ] Build MCP server
- [ ] Verify no TypeScript errors

**Completion**: 0%

---

### Step 7: Windows Testing (45 mins)
- [ ] Test 1: Registry creation (run sync)
- [ ] Test 2: Hook blocks manual STATUS.md edit
- [ ] Test 3: Hook allows non-generated file edits
- [ ] Test 4: Bypass works with --no-verify
- [ ] Test 5: MCP tool triggers sync successfully

**Completion**: 0%

---

### Step 8: Documentation (30 mins)
- [ ] Update `.agent/sops/git-workflow.md` with hook bypass
- [ ] Update `.agent/system/mcp-tools-guide.md` with markdown.sync
- [ ] Update session file with progress notes
- [ ] Mark tasks complete in this file

**Completion**: 0%

---

## Overall Progress

**Tasks Completed**: 0/8 (0%)
**Estimated Time Remaining**: ~5 hours
**Blockers**: None

---

## Next Action

Start with Step 1: Create `.agent/generated-files.json` registry structure.

---

**Last Updated**: 2025-11-09 21:30
