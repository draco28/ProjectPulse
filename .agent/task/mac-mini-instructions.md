# Mac Mini Instructions - Sprint 2 Database Migration

**Created**: 2025-11-09 21:10
**Branch**: feature/sprint-2-markdown-sync
**Task**: Create database migration for MarkdownFile model + Install dependencies

---

## Context

Windows Claude Code has completed:
- ✅ Added MarkdownFile model to Prisma schema
- ✅ Created TemplateEngine class (apps/web/lib/markdown/template-engine.ts)
- ✅ Created DataExtractorRegistry class (apps/web/lib/markdown/data-extractors.ts)
- ✅ Added handlebars dependencies to package.json

**Next step**: Mac mini must pull changes, install dependencies, and run Prisma migration.

---

## Instructions for Mac Mini Claude Code

### Step 1: Pull latest changes

```bash
cd ~/projectpulse  # Or your project path
git pull origin feature/sprint-2-markdown-sync
```

**Expected**: Schema changes, new lib/markdown files, package.json updates

---

### Step 2: Install dependencies

```bash
pnpm install
```

**Expected**: Installs handlebars@^4.7.8 and @types/handlebars@^4.1.0

---

### Step 3: Generate Prisma migration

```bash
cd apps/web
npx prisma migrate dev --name add_markdown_files
```

**Expected output**:
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "projectpulse_dev", schema "public" at "192.168.1.15:5432"

Applying migration `20251109_add_markdown_files`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20251109_add_markdown_files/
      └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client (5.9.1 | library) to ./node_modules/@prisma/client in 150ms
```

---

### Step 4: Verify migration applied

```bash
npx prisma migrate status
```

**Expected**:
```
Database schema is up to date!
```

---

### Step 5: Check database

```bash
psql -h 192.168.1.15 -U postgres -d projectpulse_dev -c "\d markdown_files"
```

**Expected**: Table with columns:
- id (cuid)
- project_id (int, FK to projects)
- slug (text)
- path (text)
- category (text)
- sync_strategy (text)
- template_id (text)
- content_hash (char(64))
- last_synced_at (timestamp)
- is_generated (boolean)
- status (text)
- metadata (jsonb)
- created_at, updated_at (timestamps)

**Expected indexes**:
- markdown_files_project_id_slug_key (unique)
- markdown_files_project_id_category_idx
- markdown_files_project_id_status_idx
- markdown_files_project_id_sync_strategy_idx
- markdown_files_last_synced_at_idx

---

### Step 6: Regenerate Prisma Client

```bash
npx prisma generate
```

**Expected**: Updates @prisma/client with MarkdownFile model types

---

### Step 7: Verify TypeScript compilation

```bash
cd ../.. # Back to root
pnpm build
```

**Expected**: Zero TypeScript errors, successful build

---

### Step 8: Report back to Windows

**Update this file with results**:

```markdown
## Migration Results

**Status**: ✅ SUCCESS / ❌ FAILED

**Migration created**: 20251109HHMMSS_add_markdown_files

**Table created**: ✅ markdown_files

**Indexes created**:
- ✅ unique constraint on (project_id, slug)
- ✅ 4 composite indexes

**Prisma Client generated**: ✅ YES

**TypeScript compilation**: ✅ PASS / ❌ FAIL (errors below)

**Errors** (if any):
[Insert errors here]

**Completed at**: [timestamp]
```

---

## Expected Migration SQL (Reference)

The migration should create this table:

```sql
-- CreateTable
CREATE TABLE "markdown_files" (
    "id" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sync_strategy" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "content_hash" CHAR(64),
    "last_synced_at" TIMESTAMP(3),
    "is_generated" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "markdown_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "markdown_files_project_id_slug_key" ON "markdown_files"("project_id", "slug");

-- CreateIndex
CREATE INDEX "markdown_files_project_id_category_idx" ON "markdown_files"("project_id", "category");

-- CreateIndex
CREATE INDEX "markdown_files_project_id_status_idx" ON "markdown_files"("project_id", "status");

-- CreateIndex
CREATE INDEX "markdown_files_project_id_sync_strategy_idx" ON "markdown_files"("project_id", "sync_strategy");

-- CreateIndex
CREATE INDEX "markdown_files_last_synced_at_idx" ON "markdown_files"("last_synced_at");

-- AddForeignKey
ALTER TABLE "markdown_files" ADD CONSTRAINT "markdown_files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## Commit Instructions (After Success)

```bash
git add .
git commit -m "feat(markdown): add MarkdownFile schema and core infrastructure

- Add MarkdownFile model to Prisma schema (generic, string-based fields)
- Add TemplateEngine singleton with Handlebars support
- Add DataExtractorRegistry for async data extraction
- Install handlebars dependencies
- Create migration 20251109_add_markdown_files

Sprint 2 Week 1 Day 1-2: Database Schema + Template Engine Core"

git push origin feature/sprint-2-markdown-sync
```

---

**Last Updated**: 2025-11-09 21:10 (Windows)
**Waiting for**: Mac mini execution
