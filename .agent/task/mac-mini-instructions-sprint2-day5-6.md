# Mac Mini Testing Instructions - Sprint 2 Day 5-6

**Date**: 2025-11-09 22:45
**Branch**: feature/sprint-2-markdown-sync
**Phase**: Sprint 2 Week 1 Day 5-6 - Git Hooks + MCP Tool Testing

---

## Overview

Windows implementation is complete. Mac mini needs to test the full workflow:
1. Pull latest code
2. Run markdown sync API
3. Verify registry creation
4. Test git hooks (blocking manual edits)
5. Test MCP tool

---

## Step 1: Pull Latest Code

```bash
cd ~/projects/projectpulse
git fetch origin
git checkout feature/sprint-2-markdown-sync
git pull origin feature/sprint-2-markdown-sync
```

**Verify Files Created**:
- `.agent/generated-files.json` (empty registry)
- `apps/web/app/api/markdown/sync/route.ts`
- `apps/web/lib/markdown/sync-service.ts` (updated with registry function)
- `.husky/validate-generated-files.js`
- `.husky/pre-commit` (updated with validation)
- `apps/mcp-server/src/tools/markdownSync.ts`
- `scripts/sync-markdown.js`

---

## Step 2: Install Dependencies & Build

```bash
# Install dependencies (if needed)
pnpm install

# Build MCP server
cd apps/mcp-server
pnpm build
cd ../..

# Verify no TypeScript errors in new code
cd apps/web
npx tsc --noEmit lib/markdown/sync-service.ts
npx tsc --noEmit app/api/markdown/sync/route.ts
cd ../..
```

**Expected**: Clean build, no TypeScript errors in new files.

---

## Step 3: Start Services

```bash
# Start PostgreSQL + Next.js
docker-compose -f docker-compose.cloud.yml up -d

# Wait for services to be ready
sleep 5

# Verify services
curl http://localhost:3000/api/health
# Expected: {"status":"healthy","database":"connected"}
```

---

## Step 4: Test Markdown Sync API

```bash
# Test sync API endpoint
curl -X POST http://localhost:3000/api/markdown/sync \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected response:
# {
#   "success": true,
#   "syncedCount": 1,
#   "skippedCount": 0,
#   "errorCount": 0,
#   "duration": <number>,
#   "files": [
#     {
#       "slug": "status",
#       "path": "STATUS.md",
#       "status": "synced",
#       "duration": <number>
#     }
#   ]
# }
```

**Verify**:
- STATUS.md was generated/updated
- `.agent/generated-files.json` was created with entry for STATUS.md

---

## Step 5: Verify Generated Files Registry

```bash
cat .agent/generated-files.json
```

**Expected**:
```json
{
  "version": "1.0",
  "lastUpdated": "2025-11-09T...",
  "description": "Registry of auto-generated markdown files...",
  "generatedFiles": [
    {
      "path": "STATUS.md",
      "category": "tracking",
      "templateId": "status-template",
      "contentHash": "<sha256>",
      "lastGenerated": "2025-11-09T..."
    }
  ]
}
```

---

## Step 6: Test Git Hooks - Scenario 1 (Block Manual Edit)

```bash
# 1. Manually edit STATUS.md
echo "# Manual edit test" >> STATUS.md

# 2. Stage the file
git add STATUS.md

# 3. Try to commit
git commit -m "test: manual STATUS.md edit"
```

**Expected Output**:
```
╔═══════════════════════════════════════════════════════════════╗
║  ❌ COMMIT BLOCKED: Manual edits to generated files detected  ║
╚═══════════════════════════════════════════════════════════════╝

Protected files:
  • STATUS.md
    Category: tracking
    Template: status-template

ℹ️  These files are auto-generated from the database.
   To update them, use: pnpm run sync:markdown

⚠️  To bypass this check (emergencies only):
   git commit --no-verify
```

**Result**: ✅ Commit blocked

```bash
# Reset the manual edit
git reset HEAD STATUS.md
git checkout -- STATUS.md
```

---

## Step 7: Test Git Hooks - Scenario 2 (Allow Non-Generated Files)

```bash
# 1. Edit a non-generated file
echo "# Test" >> README.md

# 2. Stage and commit
git add README.md
git commit -m "test: edit non-generated file"
```

**Expected**: ✅ Commit allowed (hook passes validation)

```bash
# Reset
git reset HEAD~1
git checkout -- README.md
```

---

## Step 8: Test Git Hooks - Scenario 3 (Bypass)

```bash
# 1. Manually edit STATUS.md again
echo "# Bypass test" >> STATUS.md
git add STATUS.md

# 2. Commit with --no-verify
git commit --no-verify -m "test: bypass hook"
```

**Expected**: ✅ Commit succeeds (hook bypassed)

```bash
# Reset
git reset HEAD~1
git checkout -- STATUS.md
```

---

## Step 9: Test Markdown Sync CLI Script

```bash
# Run sync script
pnpm run sync:markdown
```

**Expected Output**:
```
🔄 Syncing markdown files from database...
   Endpoint: http://localhost:3000/api/markdown/sync

✅ Markdown sync complete!
   Synced: 0 file(s)
   Skipped: 1 file(s) (unchanged)
   Errors: 0 file(s)
   Duration: <number>ms

Files updated:
   ○ STATUS.md (<number>ms)
```

---

## Step 10: Test MCP Tool (Optional - If MCP Inspector Available)

```bash
# Start MCP server
cd apps/mcp-server
pnpm start

# In MCP Inspector, call tool:
# Tool: projectpulse.markdown.sync
# Params: {}
```

**Expected**: Sync completes, returns statistics.

---

## Step 11: Verify Everything

**Checklist**:
- [ ] API endpoint responds correctly
- [ ] Registry file created and populated
- [ ] Git hook blocks manual edits to STATUS.md
- [ ] Git hook allows edits to non-generated files
- [ ] Git hook bypass works with --no-verify
- [ ] CLI script syncs markdown successfully
- [ ] MCP tool calls API and returns results (optional)

---

## Results

**Test Status**: [ ] PASS / [ ] FAIL

**Issues Found**:
- (List any issues encountered)

**Notes**:
- (Any observations or improvements needed)

**Performance**:
- Sync duration: ___ ms
- Hook validation duration: ___ ms

---

## Commit Test Results

```bash
# 1. Update this file with test results
# 2. Commit test results
git add .agent/task/mac-mini-instructions-sprint2-day5-6.md
git commit -m "test: Sprint 2 Day 5-6 Mac mini testing complete"

# 3. Push to feature branch
git push origin feature/sprint-2-markdown-sync
```

---

**Testing Started**: TBD
**Testing Completed**: TBD
**Tester**: Mac mini Claude Code
