# Mac Mini Execution Guide - Sprint 2 Cleanup

**Date:** 2025-11-10
**Status:** ✅ Ready to execute
**Branch:** feature/docs-vision-refactor-phase1

---

## What Was Done on Windows

GPT completed cleanup (Steps 1-5):
- ✅ Removed markdown sync services (`apps/web/lib/markdown/`)
- ✅ Removed markdown sync API routes (`apps/web/app/api/markdown/`)
- ✅ Removed markdown sync MCP tool (`markdownSync.ts`)
- ✅ Removed MarkdownFile model from `prisma/schema.prisma`
- ✅ Updated Mac mini instructions
- ✅ Committed and pushed to `feature/docs-vision-refactor-phase1`

---

## What Mac Mini Must Do (Step 6)

Execute database migration to drop `markdown_files` table.

---

## Instructions for Mac Mini Claude Code

**Copy-paste this to Mac mini:**

```
Pull git and execute the "Sprint 2 Cleanup - Drop MarkdownFile Table" section from .agent/task/mac-mini-instructions.md

Branch: feature/docs-vision-refactor-phase1

Complete all 6 steps:
1. Pull latest changes
2. Create migration (drop MarkdownFile table)
3. Regenerate Prisma Client
4. Restart Next.js container
5. Verify health check
6. Commit and push migration

Report back with migration output and health check result.
```

---

## Expected Mac Mini Workflow

### Step 1: Pull Changes
```bash
cd ~/projects/AI_HUB
git checkout feature/docs-vision-refactor-phase1
git pull origin feature/docs-vision-refactor-phase1
```

**Should see:**
- Commit: "chore: remove Sprint 2 wrong implementation"
- Commit: "docs: add Mac mini migration steps"
- MarkdownFile model removed from schema

---

### Step 2: Create Migration

```bash
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
  npx prisma migrate dev --name remove_markdown_file_model
```

**Expected Output:**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "projectpulse_dev"

Applying migration `20251110XXXXXX_remove_markdown_file_model`

The following migration(s) have been created and applied:

migrations/
  └─ 20251110XXXXXX_remove_markdown_file_model/
      └─ migration.sql

Your database is now in sync with your schema.
```

**Migration SQL will contain:**
```sql
-- DropForeignKey
ALTER TABLE "markdown_files" DROP CONSTRAINT "markdown_files_projectId_fkey";

-- DropTable
DROP TABLE "markdown_files";
```

---

### Step 3: Regenerate Prisma Client

```bash
npx prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client (v5.22.0) to ./../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client in 127ms
```

---

### Step 4: Restart Next.js Container

```bash
docker-compose -f docker-compose.cloud.yml restart nextjs
docker-compose -f docker-compose.cloud.yml logs -f nextjs
```

**Wait for:**
```
✓ Ready in 2s
- Local:        http://localhost:3000
- Network:      http://0.0.0.0:3000
```

---

### Step 5: Verify Health

```bash
curl http://192.168.1.15:3000/api/health
```

**Expected Response:**
```json
{"status":"healthy","database":"connected"}
```

---

### Step 6: Commit Migration

```bash
git add prisma/migrations/
git commit -m "feat(db): drop MarkdownFile table (Sprint 2 cleanup)"
git push origin feature/docs-vision-refactor-phase1
```

---

## After Mac Mini Completes

### On Windows:

1. **Pull migration:**
   ```bash
   cd f:/Web_Projects/AI_HUB
   git pull origin feature/docs-vision-refactor-phase1
   ```

2. **Verify migration exists:**
   ```bash
   ls prisma/migrations/
   # Should see: 20251110XXXXXX_remove_markdown_file_model/
   ```

3. **Verify health check:**
   ```bash
   curl http://192.168.1.15:3000/api/health
   # Should return: {"status":"healthy","database":"connected"}
   ```

4. **Verify cleanup complete:**
   ```bash
   # These should return 0 results:
   rg "model MarkdownFile" prisma/schema.prisma
   ls apps/web/lib/markdown 2>/dev/null
   ls apps/web/app/api/markdown 2>/dev/null
   ```

---

## Troubleshooting

### Issue: Migration fails with "table does not exist"

**Cause:** Table was already dropped or never existed.

**Solution:**
```bash
# Skip migration, just regenerate client
npx prisma generate
```

---

### Issue: Prisma Client has old model

**Cause:** Client cached.

**Solution:**
```bash
# Delete client and regenerate
rm -rf node_modules/.prisma
npx prisma generate
```

---

### Issue: Next.js won't restart

**Cause:** Container locked.

**Solution:**
```bash
docker-compose -f docker-compose.cloud.yml down
docker-compose -f docker-compose.cloud.yml up -d --build
docker-compose -f docker-compose.cloud.yml logs -f nextjs
```

---

## Success Criteria

Sprint 2 cleanup is complete when:

- [x] GPT removed wrong files (Windows) ✅
- [x] GPT updated schema (Windows) ✅
- [x] GPT committed changes (Windows) ✅
- [ ] Mac mini created migration ⏳
- [ ] Mac mini dropped `markdown_files` table ⏳
- [ ] Mac mini regenerated Prisma Client ⏳
- [ ] Mac mini restarted Next.js ⏳
- [ ] Health check passes ⏳
- [ ] Migration committed to git ⏳
- [ ] Windows pulled migration ⏳

---

## Next Steps After Cleanup

Once all checkboxes are complete:

### 1. Verify Final State

```bash
# On Windows
cd f:/Web_Projects/AI_HUB

# Run final audit
bash /tmp/final_audit.sh
# Expected: 7/7 tests PASS
```

---

### 2. Ready for Sprint 2 Correct Implementation

**Database ready:**
- ✅ MarkdownFile model removed
- ✅ `markdown_files` table dropped
- ✅ WikiPage model present (correct)
- ✅ Ready to add OnboardingSession/OnboardingTemplate

**Codebase ready:**
- ✅ Markdown sync removed
- ✅ MCP tools cleaned
- ✅ API routes cleaned
- ✅ Ready to build Wiki UI
- ✅ Ready to build Onboarding MCP tools

---

### 3. Start Sprint 2 Features

Follow Sprint 2 plan in `docs/13-Project-Plan.md` (lines 656-819):

**Week 3:**
- Day 1-2: WikiPage model + Wiki service
- Day 3-4: Wiki UI pages (list + detail)
- Day 5: Wiki MCP tools

**Week 4:**
- Day 6-7: Onboarding models + service
- Day 8-9: Onboarding MCP tools
- Day 10: Testing + documentation

---

**Ready to tell Mac mini to execute! 🚀**
