# Post-Refactor Audit Plan

**Created:** 2025-11-10
**Purpose:** Final verification before proceeding with development
**Status:** Ready to execute

---

## Executive Summary

**What GPT Completed:**
- Refactored 31 documentation files (~35,770 lines)
- Aligned all docs with correct product vision (web platform vs file generator)
- Updated PRD, SRS, Architecture, Backlog, Project Plan

**What We're Auditing:**
1. **Documentation Consistency** - Do all docs tell the same story?
2. **Sprint 1 Work Assessment** - What to keep, what to remove?
3. **Sprint 2 Work Assessment** - What's valid, what's wrong?
4. **Development Readiness** - Can we start building features?

---

## Audit Phase 1: Documentation Verification

### 1.1 Automated Terminology Check

**Run these searches to verify GPT's work:**

```bash
# Navigate to project root
cd f:/Web_Projects/AI_HUB

# SHOULD RETURN 0 RESULTS (or only in "dogfooding" context)
echo "=== Checking for incorrect references ==="

# Check for ".agent/ generation" references
rg "generates .agent/" docs/ .agent/ --iglob '!.agent/task/*'
# Expected: 0 results (or only in context of "our development")

# Check for "creates CLAUDE.md" references
rg "creates CLAUDE.md" docs/ .agent/ --iglob '!.agent/task/*'
# Expected: 0 results (or only in context of "our development")

# Check for "markdown sync" in end user context
rg "markdown sync.*end user" docs/ .agent/
# Expected: 0 results

# Check for "meta-platform that generates"
rg "meta-platform.*generates" docs/
# Expected: 0 results

# SHOULD RETURN MANY RESULTS (correct terminology)
echo "=== Checking for correct references ==="

# Check for "web UI" references
rg "web UI" docs/01-PRD.md docs/13-Project-Plan.md
# Expected: 10+ results

# Check for "database storage" references
rg "database storage" docs/01-PRD.md .agent/project-brief.md
# Expected: 5+ results

# Check for "MCP tools" references
rg "MCP tools" docs/01-PRD.md docs/13-Project-Plan.md
# Expected: 15+ results

# Check for "Wiki page" as feature
rg "Wiki page" docs/13-Project-Plan.md
# Expected: 20+ results in Sprint 2 section
```

**Validation Checklist:**

- [ ] Zero "generates .agent/" in end user context ✓/✗
- [ ] Zero "creates CLAUDE.md" for end users ✓/✗
- [ ] Zero "meta-platform that generates files" ✓/✗
- [ ] Multiple "web UI" references ✓/✗
- [ ] Multiple "database storage" references ✓/✗
- [ ] Multiple "MCP tools" references ✓/✗

---

### 1.2 Manual Documentation Review

**Read these specific sections to verify consistency:**

#### Section 1: Product Vision (docs/01-PRD.md)

**File:** `docs/01-PRD.md`
**Lines:** 14-24 (Section 1.1 Vision)

**Expected Content:**
```markdown
ProjectPulse is a **web-based project management platform** that replaces filesystem-based agent workflows with database-backed, UI-accessible project management.
```

**Verification:**
- [ ] Does NOT mention "generates .agent/ folders" ✓/✗
- [ ] Does NOT mention "meta-platform" ✓/✗
- [ ] DOES describe web application ✓/✗
- [ ] DOES mention database storage ✓/✗

---

#### Section 2: Sprint 2 Deliverables (docs/13-Project-Plan.md)

**File:** `docs/13-Project-Plan.md`
**Lines:** 656-779 (Sprint 2 section)

**Expected Content:**
```markdown
### Sprint 2 (Weeks 3-4): Wiki Page + Onboarding System - 58 points

**Key Deliverables:**

1. **Wiki Page (UI + Backend):**
   - WikiPage database model
   - Wiki list page at `/wiki`
   - Wiki detail page at `/wiki/[slug]`
   - MCP tools: `wiki.create()`, `wiki.search()`, `wiki.update()`

2. **Onboarding Prompt System:**
   - OnboardingSession table
   - Prompt templates for Sessions 1, 2, 3
   - MCP tool: `onboarding.getPrompt(sessionNumber)`
```

**Verification:**
- [ ] Does NOT mention "markdown sync" ✓/✗
- [ ] Does NOT mention "MarkdownFile table" ✓/✗
- [ ] Does NOT mention "template engine" ✓/✗
- [ ] DOES describe Wiki page ✓/✗
- [ ] DOES describe Onboarding system ✓/✗

---

#### Section 3: Core Mission (.agent/project-brief.md)

**File:** `.agent/project-brief.md`
**Lines:** 9-44

**Expected Content:**
```markdown
## Core Mission

Build a **web-based project management platform** that replaces filesystem-based agent workflows with database-backed, UI-accessible project management.

**What We're NOT Building:**
- ❌ .agent/ folder generator
- ❌ CLAUDE.md file creator
```

**Verification:**
- [ ] Clearly states "web-based platform" ✓/✗
- [ ] Explicitly lists what we're NOT building ✓/✗
- [ ] Mentions "self-hosted" (local-first) ✓/✗

---

### 1.3 Cross-Reference Validation

**Verify these documents align with each other:**

```bash
# Extract key terms from each doc
grep -i "primary use case" docs/01-PRD.md
grep -i "Sprint 2.*goal" docs/13-Project-Plan.md
grep -i "Core Mission" .agent/project-brief.md
```

**Consistency Check:**

- [ ] PRD "Primary Use Case" matches Project Plan Sprint 2 goal ✓/✗
- [ ] PRD Vision matches project-brief.md Core Mission ✓/✗
- [ ] Sprint 2 deliverables match Backlog EPIC-002/003 stories ✓/✗

---

## Audit Phase 2: Sprint 1 Work Assessment

### 2.1 What Was Built in Sprint 1?

**Review Sprint 1 actual work:**

```bash
# Check git history for Sprint 1 commits
git log --oneline --grep="sprint.1" --grep="Sprint 1" --all

# Check for database migrations
ls -la prisma/migrations/

# Check for implemented code
find apps/web -name "*.ts" -o -name "*.tsx" | head -20
```

**Sprint 1 Original Goal (OLD - from previous plan):**
- 5-level hierarchy (Phase, Week, Day, Task, Session)
- Progress roll-up algorithm
- MCP server scaffold
- First 7 MCP tools

**Assessment Questions:**

1. **Database Schema:**
   - [ ] Were Phase/Week/Day/Task/Session models created? ✓/✗
   - [ ] Are migrations present in `prisma/migrations/`? ✓/✗
   - [ ] File: `prisma/schema.prisma` - Do these models exist? ✓/✗

2. **MCP Server:**
   - [ ] Does `apps/mcp-server/` directory exist? ✓/✗
   - [ ] Are any MCP tools implemented? ✓/✗
   - [ ] Check: `apps/mcp-server/src/tools/` ✓/✗

3. **API Routes:**
   - [ ] Are there `/api/sprint/*` routes? ✓/✗
   - [ ] Check: `apps/web/app/api/sprint/` ✓/✗

---

### 2.2 Sprint 1 Work - Keep or Remove?

**Decision Framework:**

| Feature | Keep? | Reason |
|---------|-------|--------|
| **Phase/Week/Day/Task/Session models** | ✅ KEEP | Still needed for Development Cycle page |
| **Progress roll-up algorithm** | ✅ KEEP | Core feature - hierarchy visualization |
| **MCP server scaffold** | ✅ KEEP | Foundation for all MCP tools |
| **Progress tracking MCP tools** | ✅ KEEP | Agents need to update progress |
| **Markdown sync feature** | ❌ REMOVE | Not an end user feature (was confusion) |
| **MarkdownFile model** | ❌ REMOVE | Not needed (use WikiPage instead) |

**Action Items for Sprint 1 Work:**

```bash
# 1. Check if MarkdownFile model exists
rg "model MarkdownFile" prisma/schema.prisma

# If exists:
# - Remove from schema.prisma
# - Create migration to drop table
# - Remove related service files

# 2. Check for markdown sync service
find apps/web/lib -name "*markdown*" -o -name "*sync*"

# If exists:
# - Delete markdown sync services
# - Remove from MCP tools

# 3. Keep these Sprint 1 features:
# - Phase/Week/Day/Task/Session models ✓
# - Progress tracking services ✓
# - MCP tools for progress ✓
```

---

## Audit Phase 3: Sprint 2 Work Assessment

### 3.1 What Was Built in Sprint 2 (Current)?

**Check current Sprint 2 implementation:**

```bash
# Check for MarkdownFile model (from confused Sprint 2)
rg "model MarkdownFile" prisma/schema.prisma

# Check for markdown sync files
find apps/web/lib -name "*markdown*"
find apps/web/lib -name "*sync*"
find apps/web/lib -name "*template*"

# Check for WikiPage model (correct Sprint 2)
rg "model WikiPage" prisma/schema.prisma
```

**Sprint 2 Original Implementation (WRONG - based on old plan):**
- ✗ MarkdownFile database model
- ✗ Template engine for markdown
- ✗ Sync service (database → markdown files)
- ✗ Git hooks to prevent manual edits

**Sprint 2 Correct Implementation (from refactored plan):**
- ✓ WikiPage database model
- ✓ Wiki list page UI (`/wiki`)
- ✓ Wiki detail page UI (`/wiki/[slug]`)
- ✓ MCP tools (`wiki.create`, `wiki.search`, `wiki.update`)
- ✓ OnboardingSession model
- ✓ Onboarding prompt templates
- ✓ MCP tools (`onboarding.getPrompt`, `onboarding.submitResponse`)

---

### 3.2 Sprint 2 Work - Keep or Remove?

**Assessment:**

```bash
# Run this audit script
cat > /tmp/sprint2_audit.sh << 'EOF'
#!/bin/bash

echo "=== Sprint 2 Work Audit ==="

# Check what exists
echo "Checking for MarkdownFile model..."
if rg -q "model MarkdownFile" prisma/schema.prisma; then
  echo "❌ FOUND (should be removed)"
else
  echo "✅ NOT FOUND (good)"
fi

echo "Checking for WikiPage model..."
if rg -q "model WikiPage" prisma/schema.prisma; then
  echo "✅ FOUND (correct)"
else
  echo "❌ NOT FOUND (needs to be created)"
fi

echo "Checking for markdown sync services..."
if find apps/web/lib -name "*markdown-sync*" -o -name "*sync-service*" | grep -q .; then
  echo "❌ FOUND (should be removed)"
else
  echo "✅ NOT FOUND (good)"
fi

echo "Checking for wiki services..."
if find apps/web/lib -name "*wiki*" | grep -q .; then
  echo "✅ FOUND (correct)"
else
  echo "❌ NOT FOUND (needs to be created)"
fi

echo "Checking for onboarding services..."
if find apps/web/lib -name "*onboarding*" | grep -q .; then
  echo "✅ FOUND (correct)"
else
  echo "❌ NOT FOUND (needs to be created)"
fi
EOF

bash /tmp/sprint2_audit.sh
```

**Decision Matrix:**

| Component | Current State | Action |
|-----------|---------------|--------|
| **MarkdownFile model** | Exists (wrong) | ❌ REMOVE |
| **Markdown sync service** | Exists (wrong) | ❌ REMOVE |
| **Template engine** | Exists (wrong) | ❌ REMOVE |
| **WikiPage model** | Missing | ✅ CREATE |
| **Wiki UI pages** | Missing | ✅ CREATE |
| **Wiki MCP tools** | Missing | ✅ CREATE |
| **OnboardingSession model** | Missing | ✅ CREATE |
| **Onboarding MCP tools** | Missing | ✅ CREATE |

---

### 3.3 Files to Remove (Sprint 2 Wrong Implementation)

**Identify files to delete:**

```bash
# List all markdown-sync related files
find apps/web -type f -name "*markdown*" -o -name "*sync-service*" -o -name "*template-engine*"

# Expected files to remove:
# - apps/web/lib/markdown/sync-service.ts (if exists)
# - apps/web/lib/markdown/template-engine.ts (if exists)
# - apps/web/app/api/markdown/sync/route.ts (if exists)
# - .agent/generated-files.json (internal tooling file)
```

**Removal Script:**

```bash
# Create removal script
cat > /tmp/remove_sprint2_wrong.sh << 'EOF'
#!/bin/bash

echo "=== Removing Sprint 2 Wrong Implementation ==="

# Remove markdown sync services
rm -f apps/web/lib/markdown/sync-service.ts
rm -f apps/web/lib/markdown/template-engine.ts
rm -f apps/web/lib/markdown/data-extractors.ts
rm -f apps/web/lib/markdown/registry.ts

# Remove markdown sync API routes
rm -rf apps/web/app/api/markdown

# Remove MarkdownFile model from Prisma schema
# (Manual edit required - see instructions below)

# Remove generated files registry (internal tool)
rm -f .agent/generated-files.json

echo "✅ Cleanup complete"
echo "⚠️  Manual action required:"
echo "   1. Edit prisma/schema.prisma - remove MarkdownFile model"
echo "   2. Run: npx prisma migrate dev --name remove_markdown_file_model"
echo "   3. Commit changes"
EOF

chmod +x /tmp/remove_sprint2_wrong.sh
```

**Manual Actions Required:**

1. **Edit `prisma/schema.prisma`:**
   - Find `model MarkdownFile { ... }`
   - Delete entire model block
   - Save file

2. **Create migration:**
   ```bash
   cd f:/Web_Projects/AI_HUB
   DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx prisma migrate dev --name remove_markdown_file_model
   ```

3. **Commit cleanup:**
   ```bash
   git add .
   git commit -m "chore: remove Sprint 2 wrong implementation (markdown sync)

   - Removed MarkdownFile model
   - Removed markdown sync services
   - Removed template engine
   - Removed markdown API routes

   Preparing for correct Sprint 2 (Wiki page + Onboarding)"
   ```

---

## Audit Phase 4: Development Readiness Check

### 4.1 Current Codebase State

**Inventory of what exists:**

```bash
# Database models
echo "=== Database Models ===" && rg "^model " prisma/schema.prisma

# API routes
echo "=== API Routes ===" && find apps/web/app/api -type d -maxdepth 2

# UI pages
echo "=== UI Pages ===" && find apps/web/app/\(dashboard\) -name "page.tsx"

# Services
echo "=== Services ===" && find apps/web/lib -name "*service.ts"

# MCP tools
echo "=== MCP Tools ===" && find apps/mcp-server -name "*.ts" 2>/dev/null || echo "MCP server not found"
```

**Expected State After Cleanup:**

✅ **Keep (from Sprint 1):**
- Phase, Week, Day, Task, Session models
- Progress tracking services
- MCP server scaffold
- Progress tracking MCP tools

❌ **Remove (from confused Sprint 2):**
- MarkdownFile model
- Markdown sync services
- Template engine
- Markdown API routes

⏳ **To Build (correct Sprint 2):**
- WikiPage model
- OnboardingSession model
- Wiki UI pages
- Wiki services
- Wiki MCP tools
- Onboarding services
- Onboarding MCP tools

---

### 4.2 Readiness Checklist

**Before starting Sprint 2 development:**

- [ ] Documentation refactor validated (Phase 1 audit passed)
- [ ] Sprint 1 work assessed (keep Phase/Week/Day models)
- [ ] Sprint 2 wrong work removed (MarkdownFile deleted)
- [ ] Prisma schema clean (only correct models remain)
- [ ] Database migrated (MarkdownFile table dropped)
- [ ] Git branch clean (committed cleanup work)
- [ ] Ready to build WikiPage model
- [ ] Ready to build Wiki UI pages
- [ ] Ready to build Onboarding system

---

## Audit Phase 5: Final Validation

### 5.1 Comprehensive Consistency Check

**Run full validation suite:**

```bash
# Create comprehensive validation script
cat > /tmp/final_audit.sh << 'EOF'
#!/bin/bash

echo "=== FINAL AUDIT - Documentation & Codebase Consistency ==="

PASS=0
FAIL=0

# Test 1: PRD describes web platform
if rg -q "web-based project management platform" docs/01-PRD.md; then
  echo "✅ Test 1: PRD describes web platform"
  ((PASS++))
else
  echo "❌ Test 1: PRD still describes file generator"
  ((FAIL++))
fi

# Test 2: Sprint 2 focuses on Wiki page
if rg -q "Wiki Page.*UI.*Backend" docs/13-Project-Plan.md; then
  echo "✅ Test 2: Sprint 2 focuses on Wiki page"
  ((PASS++))
else
  echo "❌ Test 2: Sprint 2 still describes markdown sync"
  ((FAIL++))
fi

# Test 3: No MarkdownFile model in schema
if ! rg -q "model MarkdownFile" prisma/schema.prisma; then
  echo "✅ Test 3: MarkdownFile model removed"
  ((PASS++))
else
  echo "❌ Test 3: MarkdownFile model still exists"
  ((FAIL++))
fi

# Test 4: No markdown sync services
if ! find apps/web/lib -name "*markdown-sync*" | grep -q .; then
  echo "✅ Test 4: Markdown sync services removed"
  ((PASS++))
else
  echo "❌ Test 4: Markdown sync services still exist"
  ((FAIL++))
fi

# Test 5: project-brief.md clarifies web app
if rg -q "web-based project management platform" .agent/project-brief.md; then
  echo "✅ Test 5: project-brief.md clarifies web app"
  ((PASS++))
else
  echo "❌ Test 5: project-brief.md still confusing"
  ((FAIL++))
fi

# Test 6: No ".agent/ generation" in PRD
if ! rg -q "generates .agent/" docs/01-PRD.md; then
  echo "✅ Test 6: No '.agent/ generation' in PRD"
  ((PASS++))
else
  echo "❌ Test 6: '.agent/ generation' still in PRD"
  ((FAIL++))
fi

# Test 7: Sprint 1 models still exist (Phase, Week, Day)
if rg -q "model Phase" prisma/schema.prisma && \
   rg -q "model Week" prisma/schema.prisma && \
   rg -q "model Day" prisma/schema.prisma; then
  echo "✅ Test 7: Sprint 1 models preserved"
  ((PASS++))
else
  echo "❌ Test 7: Sprint 1 models missing (ERROR - should be kept)"
  ((FAIL++))
fi

echo ""
echo "=== RESULTS ==="
echo "✅ Passed: $PASS/7"
echo "❌ Failed: $FAIL/7"

if [ $FAIL -eq 0 ]; then
  echo ""
  echo "🎉 ALL TESTS PASSED - Ready for Sprint 2 development!"
  exit 0
else
  echo ""
  echo "⚠️  TESTS FAILED - Fix issues before proceeding"
  exit 1
fi
EOF

chmod +x /tmp/final_audit.sh
bash /tmp/final_audit.sh
```

---

### 5.2 Sign-Off Criteria

**Audit is complete when:**

- [ ] ✅ All 7 validation tests pass
- [ ] ✅ Documentation tells consistent story (web platform, not file generator)
- [ ] ✅ Sprint 1 work preserved (Phase/Week/Day models)
- [ ] ✅ Sprint 2 wrong work removed (MarkdownFile deleted)
- [ ] ✅ Codebase clean (no markdown sync services)
- [ ] ✅ Database clean (MarkdownFile table dropped)
- [ ] ✅ Git history clean (cleanup committed)

---

## Summary: Keep vs Remove Decision

### ✅ KEEP (Sprint 1 - Still Needed)

**Database Models:**
- `model Phase` - Needed for Development Cycle page
- `model Week` - Needed for Development Cycle page
- `model Day` - Needed for Development Cycle page
- `model Task` - Needed for Development Cycle page
- `model Session` - Needed for Development Cycle page

**Services:**
- Progress tracking service - Needed for hierarchy roll-up
- Progress calculation algorithms - Needed for percentages

**MCP Tools:**
- `sprint.phase.create()` - Agents need to create phases
- `sprint.updateProgress()` - Agents need to track progress
- `sprint.getCurrentTask()` - Agents need current context

**Why Keep:**
- Development Cycle page (end user feature) needs these models
- Agents tracking progress (core workflow) needs these tools
- This is NOT markdown sync - this is database hierarchy

---

### ❌ REMOVE (Sprint 2 Wrong - Not Needed)

**Database Models:**
- `model MarkdownFile` - Wrong feature (file generation)

**Services:**
- `apps/web/lib/markdown/sync-service.ts` - Wrong feature
- `apps/web/lib/markdown/template-engine.ts` - Wrong feature
- `apps/web/lib/markdown/data-extractors.ts` - Wrong feature

**API Routes:**
- `apps/web/app/api/markdown/sync/route.ts` - Wrong feature

**Files:**
- `.agent/generated-files.json` - Internal tooling only

**Why Remove:**
- Markdown sync is NOT an end user feature
- End users get Wiki page (database + UI), not markdown files
- This was built based on confused product vision

---

### ✅ BUILD (Sprint 2 Correct - Required)

**Database Models:**
- `model WikiPage` - Core end user feature (documentation storage)
- `model OnboardingSession` - Core end user feature (guided setup)
- `model OnboardingTemplate` - Stores prompt templates

**UI Pages:**
- `/wiki` - Wiki list page (search, filters)
- `/wiki/[slug]` - Wiki detail page (markdown rendering)
- `/wiki/new` - Wiki editor (create/edit)

**Services:**
- `apps/web/lib/wiki/wiki-service.ts` - CRUD operations
- `apps/web/lib/onboarding/onboarding-service.ts` - Prompt generation

**MCP Tools:**
- `wiki.create()` - Agents create documentation
- `wiki.search()` - Agents search documentation
- `wiki.update()` - Agents update documentation
- `onboarding.getPrompt()` - Agents get guided prompts
- `onboarding.submitResponse()` - Agents submit onboarding data

**Why Build:**
- Wiki page is core end user feature (replaces markdown files)
- Onboarding is core end user feature (guided setup)
- These are web app features (database + UI + MCP)

---

## Execution Steps (Post-Audit)

**After audit passes, execute in this order:**

### Step 1: Cleanup Sprint 2 Wrong Work

```bash
# Run removal script
bash /tmp/remove_sprint2_wrong.sh

# Manually edit prisma/schema.prisma - remove MarkdownFile model

# Create migration
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
  npx prisma migrate dev --name remove_markdown_file_model

# Commit cleanup
git add .
git commit -m "chore: remove Sprint 2 wrong implementation"
git push origin feature/sprint-2-markdown-sync
```

### Step 2: Rename Branch (Optional)

```bash
# Old branch name is misleading (sprint-2-markdown-sync)
# Rename to reflect correct Sprint 2 work
git branch -m feature/sprint-2-markdown-sync feature/sprint-2-wiki-onboarding

# Update remote
git push origin -u feature/sprint-2-wiki-onboarding
git push origin --delete feature/sprint-2-markdown-sync
```

### Step 3: Start Sprint 2 Correct Work

```bash
# Create WikiPage model
# (Edit prisma/schema.prisma - add WikiPage model)

# Create migration
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
  npx prisma migrate dev --name add_wiki_page_model

# Commit
git add .
git commit -m "feat(db): add WikiPage model for Sprint 2"
git push origin feature/sprint-2-wiki-onboarding
```

### Step 4: Build Wiki Page Feature

Follow Sprint 2 plan in `docs/13-Project-Plan.md` (lines 656-779) to build:
- Wiki list page
- Wiki detail page
- Wiki editor
- MCP tools

---

## Audit Completion Report Template

**After running all audit phases, fill this out:**

```markdown
# Post-Refactor Audit Report

**Date:** [Date]
**Auditor:** [Your Name]
**Status:** ✅ PASS / ❌ FAIL

## Phase 1: Documentation Verification
- Automated checks: ✅/❌
- Manual review: ✅/❌
- Cross-references: ✅/❌

## Phase 2: Sprint 1 Assessment
- Models preserved: ✅/❌
- Services preserved: ✅/❌
- MCP tools preserved: ✅/❌

## Phase 3: Sprint 2 Assessment
- Wrong work identified: ✅/❌
- Removal plan created: ✅/❌
- Correct work defined: ✅/❌

## Phase 4: Development Readiness
- Codebase clean: ✅/❌
- Database clean: ✅/❌
- Git branch clean: ✅/❌

## Phase 5: Final Validation
- All 7 tests passed: ✅/❌

## Sign-Off
- [ ] Documentation consistent
- [ ] Sprint 1 work preserved
- [ ] Sprint 2 wrong work removed
- [ ] Ready for Sprint 2 development

**Recommendation:** PROCEED / HOLD
```

---

**Ready to execute audit!**
