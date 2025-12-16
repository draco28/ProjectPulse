# APPROVED: Sprint 2 Cleanup Instructions for GPT

**Date:** 2025-11-10
**Status:** ✅ APPROVED - Execute immediately
**Audit Result:** Cleanup required and safe to proceed

---

## Audit Summary (GPT Findings)

### ✅ Phase 1: Documentation - PASSED
- All docs correctly describe web platform (not file generator)
- No incorrect references to ".agent/ generation" for end users
- Sprint 2 correctly describes Wiki + Onboarding (not markdown sync)

### ⚠️ Phase 2: Sprint 1 - PARTIAL
- ✅ Hierarchy models present (Phase, Week, Day, Task, Session) - KEEP
- ✅ WikiPage model present - KEEP
- ❌ MarkdownFile model present - REMOVE
- ❌ Migrations missing - CREATE

### ❌ Phase 3: Sprint 2 - FAILED (Expected)
- ❌ Wrong artifacts exist (markdown sync services, API routes, MCP tool) - REMOVE
- ❌ Correct artifacts missing (Wiki services, Onboarding models) - BUILD AFTER CLEANUP

---

## EXECUTE CLEANUP NOW

**GPT: You are approved to execute the following cleanup steps immediately.**

### Step 1: Remove Wrong Artifacts

**File Deletions (execute these):**

```bash
# Remove markdown sync services
git rm -r apps/web/lib/markdown

# Remove markdown sync API routes
git rm -r apps/web/app/api/markdown

# Remove markdown sync MCP tool
git rm apps/mcp-server/src/tools/markdownSync.ts
```

**Manual Edit Required:**

1. **File:** `apps/mcp-server/src/tools/index.ts`
   - **Find:** Export line for `markdownSync`
   - **Remove:** That export line
   - **Save**

---

### Step 2: Remove MarkdownFile Model from Schema

**File:** `prisma/schema.prisma`

**Find and DELETE this entire model block:**

```prisma
model MarkdownFile {
  id            String   @id @default(cuid())
  projectId     String
  slug          String
  path          String
  category      String
  syncStrategy  String
  templateId    String
  contentHash   String?
  lastSyncedAt  DateTime?
  isGenerated   Boolean  @default(true)
  status        String   @default("active")

  @@unique([projectId, slug])
  @@map("markdown_files")
}
```

**Also find and REMOVE from Project model:**

```prisma
model Project {
  // ... other fields ...
  markdown_files MarkdownFile[]  // ← DELETE THIS LINE
  // ... other fields ...
}
```

**Save the file.**

---

### Step 3: Create Migration to Drop Table

**Execute on Mac mini via git instructions:**

**File:** `.agent/task/mac-mini-instructions.md`

**Add this section:**

```markdown
## Sprint 2 Cleanup - Drop MarkdownFile Table

**Date:** 2025-11-10
**Branch:** feature/sprint-2-markdown-sync (will rename after cleanup)

### Instructions

1. **Pull latest changes:**
   ```bash
   cd ~/projects/AI_HUB
   git pull origin feature/sprint-2-markdown-sync
   ```

2. **Create migration to drop MarkdownFile table:**
   ```bash
   DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
     npx prisma migrate dev --name remove_markdown_file_model
   ```

   **Expected output:**
   ```
   Applying migration `20251110XXXXXX_remove_markdown_file_model`

   The following migration(s) have been created and applied:

   migrations/
     └─ 20251110XXXXXX_remove_markdown_file_model/
         └─ migration.sql

   Your database is now in sync with your schema.
   ```

3. **Regenerate Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Restart Next.js container:**
   ```bash
   docker-compose -f docker-compose.cloud.yml restart nextjs
   docker-compose -f docker-compose.cloud.yml logs -f nextjs
   # Wait for "ready started server on 0.0.0.0:3000"
   ```

5. **Verify health:**
   ```bash
   curl http://192.168.1.15:3000/api/health
   # Expected: {"status":"healthy","database":"connected"}
   ```

6. **Commit and push migration:**
   ```bash
   git add prisma/migrations/
   git commit -m "feat(db): drop MarkdownFile table (Sprint 2 cleanup)"
   git push origin feature/sprint-2-markdown-sync
   ```

### Success Criteria
- [ ] Migration applied successfully
- [ ] Prisma Client regenerated
- [ ] Next.js container restarted
- [ ] Health check passes
- [ ] Migration committed to git

### After Completion
Report back with:
- Migration output
- Health check response
- Any issues encountered
```

**Save and commit this file.**

---

### Step 4: Commit Cleanup on Windows

**After Mac mini completes migration, execute on Windows:**

```bash
# Pull migration from Mac mini
git pull origin feature/sprint-2-markdown-sync

# Verify cleanup complete
git status

# Should show:
# - Deleted: apps/web/lib/markdown/
# - Deleted: apps/web/app/api/markdown/
# - Deleted: apps/mcp-server/src/tools/markdownSync.ts
# - Modified: prisma/schema.prisma (MarkdownFile removed)
# - Modified: apps/mcp-server/src/tools/index.ts (export removed)
# - New: prisma/migrations/XXXXXX_remove_markdown_file_model/

# Commit cleanup (if not already committed)
git add .
git commit -m "chore: remove Sprint 2 wrong implementation (markdown sync)

- Removed MarkdownFile model from schema
- Deleted markdown sync services (apps/web/lib/markdown)
- Deleted markdown sync API routes (apps/web/app/api/markdown)
- Deleted markdown sync MCP tool (markdownSync.ts)
- Applied migration to drop markdown_files table

Preparing for Sprint 2 correct implementation (Wiki + Onboarding)"

git push origin feature/sprint-2-markdown-sync
```

---

### Step 5: Rename Branch (Optional but Recommended)

**After cleanup committed:**

```bash
# Rename branch to reflect correct Sprint 2 work
git branch -m feature/sprint-2-markdown-sync feature/sprint-2-wiki-onboarding

# Update remote
git push origin -u feature/sprint-2-wiki-onboarding
git push origin --delete feature/sprint-2-markdown-sync
```

---

## Verification Checklist

**After cleanup, verify:**

- [ ] `prisma/schema.prisma` does NOT contain `model MarkdownFile`
- [ ] `apps/web/lib/markdown/` directory does NOT exist
- [ ] `apps/web/app/api/markdown/` directory does NOT exist
- [ ] `apps/mcp-server/src/tools/markdownSync.ts` does NOT exist
- [ ] Migration created: `prisma/migrations/XXXXXX_remove_markdown_file_model/`
- [ ] Mac mini database has NO `markdown_files` table
- [ ] Health check passes: `curl http://192.168.1.15:3000/api/health`
- [ ] Git branch renamed to `feature/sprint-2-wiki-onboarding`

---

## After Cleanup: Next Steps

**Once cleanup is complete and verified:**

### Step 6: Add WikiPage Model (if not already present)

**Check current schema:**

```bash
rg "model WikiPage" prisma/schema.prisma
```

**If WikiPage model is already present:**
- ✅ Good! Keep it. It's the correct model for Sprint 2.

**If WikiPage model is missing:**
- ⚠️ Unexpected! GPT audit said it was present. Double-check schema.

---

### Step 7: Add Onboarding Models

**File:** `prisma/schema.prisma`

**Add these models:**

```prisma
// ============================================================================
// ONBOARDING SYSTEM (Sprint 2)
// ============================================================================

model OnboardingSession {
  id             Int       @id @default(autoincrement())
  projectId      Int
  sessionNumber  Int       // 1, 2, 3
  promptTemplate String    @db.Text
  response       Json?
  status         String    @default("pending") // "pending", "in_progress", "complete"

  startedAt      DateTime?
  completedAt    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  project        Project   @relation(fields: [projectId], references: [id])

  @@unique([projectId, sessionNumber])
  @@index([projectId, status])
  @@map("onboarding_sessions")
}

model OnboardingTemplate {
  id             Int      @id @default(autoincrement())
  sessionNumber  Int      // 1, 2, 3
  name           String   // "Executive Summary", "Industry Docs", "AI Workflow"
  promptTemplate String   @db.Text
  variables      Json     // Expected variables
  isActive       Boolean  @default(true)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([sessionNumber, isActive])
  @@map("onboarding_templates")
}
```

**Also add to Project model:**

```prisma
model Project {
  // ... existing fields ...

  // Onboarding
  onboarding_sessions OnboardingSession[]

  // ... rest of fields ...
}
```

**Create migration:**

```bash
# Via Mac mini instructions (same process as Step 3)
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
  npx prisma migrate dev --name add_onboarding_models
```

---

### Step 8: Ready for Sprint 2 Development

**After onboarding models added:**

- ✅ Database clean (MarkdownFile dropped)
- ✅ Codebase clean (markdown sync removed)
- ✅ Correct models present (WikiPage + Onboarding)
- ✅ Ready to build Wiki UI + MCP tools
- ✅ Ready to build Onboarding prompts + MCP tools

**Follow Sprint 2 plan:**
- `docs/13-Project-Plan.md` lines 656-819 (updated by refactor)

---

## Execution Order

**GPT: Execute in this exact order:**

1. ✅ Remove files (git rm commands)
2. ✅ Edit `apps/mcp-server/src/tools/index.ts` (remove export)
3. ✅ Edit `prisma/schema.prisma` (remove MarkdownFile model)
4. ✅ Commit changes on Windows
5. ✅ Push to trigger Mac mini pull
6. ✅ Update `.agent/task/mac-mini-instructions.md` with migration instructions
7. ✅ Commit and push Mac mini instructions
8. ⏳ Wait for Mac mini to execute (user will tell Mac mini)
9. ⏳ Pull migration from Mac mini
10. ✅ Verify cleanup complete
11. ✅ Rename branch (optional)
12. ✅ Report completion

---

## Safety Notes

**This cleanup is SAFE because:**

1. ✅ MarkdownFile was wrong feature (not needed)
2. ✅ No production data (development database)
3. ✅ Git history preserves everything (can revert if needed)
4. ✅ Migration is standard Prisma process
5. ✅ Sprint 1 work (Phase/Week/Day) is NOT touched
6. ✅ WikiPage model is kept (correct feature)

**No risk to:**
- Sprint 1 hierarchy models
- Existing database data
- Mac mini services
- Next.js application

---

## GPT: YOU ARE APPROVED TO PROCEED

**Execute Steps 1-7 now.**

**After Step 7, report:**
- Files deleted (list)
- Schema edited (MarkdownFile removed: ✓)
- Mac mini instructions updated (✓)
- Commits created (✓)
- Ready for Mac mini execution (✓)

**Then wait for user to tell Mac mini to execute migration.**

---

**GO! 🚀**
