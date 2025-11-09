# Mac Mini Instructions - Database Schema Migration

**Date**: 2025-11-09
**Branch**: feature/sprint-2-markdown-sync
**Task**: Add MarkdownFile Prisma schema and migrate database

---

## 🚨 Critical Issue

The Sprint 2 markdown sync feature was implemented but the database schema was never created. The API endpoint `/api/markdown/sync` returns error:

```
{"success":false,"error":"Cannot read properties of undefined (reading 'findMany')"}
```

**Root Cause**: `MarkdownFile` model doesn't exist in `prisma/schema.prisma`

---

## 📋 Instructions for Mac Mini

### Step 1: Pull Latest Changes

```bash
cd ~/projects/AI_HUB
git pull origin feature/sprint-2-markdown-sync
```

### Step 2: Add MarkdownFile Schema

Create the following model in `prisma/schema.prisma`:

```prisma
// ============================================================================
// MARKDOWN FILE MANAGEMENT (Sprint 2)
// ============================================================================

model MarkdownFile {
  id              Int      @id @default(autoincrement())
  projectId       Int      @default(1)  // Default project ID
  slug            String                 // Unique identifier (e.g., "mac-mini-instructions")
  category        String                 // Category: "tracking", "industry_doc", "memory_bank"
  filePath        String                 // Relative path from project root
  templateId      String                 // Template identifier (e.g., "mac-mini-instructions")
  syncStrategy    String   @default("auto")  // "auto" or "manual"
  contentHash     String?                // SHA-256 hash of current content
  status          String   @default("active")  // "active" or "archived"

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lastSyncedAt    DateTime?

  // Composite unique constraint (one slug per project)
  @@unique([projectId, slug])
  @@index([category])
  @@index([syncStrategy])
  @@index([status])
  @@map("markdown_files")
}
```

**Insert this BEFORE the "FUTURE MODELS" comment section.**

### Step 3: Create Migration

```bash
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx prisma migrate dev --name add_markdown_file_model
```

**Expected Output**:
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "projectpulse_dev"

Applying migration `20251109XXXXXX_add_markdown_file_model`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20251109XXXXXX_add_markdown_file_model/
      └─ migration.sql

Your database is now in sync with your schema.
```

### Step 4: Regenerate Prisma Client

```bash
npx prisma generate
```

**Expected Output**:
```
✔ Generated Prisma Client (5.x.x) to ./node_modules/@prisma/client
```

### Step 5: Restart Next.js Container

```bash
docker-compose -f docker-compose.cloud.yml restart nextjs
```

**Watch logs to confirm restart**:
```bash
docker-compose -f docker-compose.cloud.yml logs -f nextjs
```

**Look for**: "ready started server on 0.0.0.0:3000"

### Step 6: Verify Database Schema

```bash
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx prisma studio
```

**In Prisma Studio**:
- Check that `MarkdownFile` model appears in left sidebar
- Verify table exists (even if empty)

### Step 7: Test Health Endpoint

```bash
curl http://192.168.1.15:3000/api/health
```

**Expected**: `{"status":"healthy","database":"connected"}`

---

## ✅ Success Criteria

- [ ] MarkdownFile model added to schema.prisma
- [ ] Migration created and applied successfully
- [ ] Prisma Client regenerated (includes markdownFile property)
- [ ] Next.js container restarted
- [ ] Prisma Studio shows MarkdownFile model
- [ ] Health endpoint returns healthy status
- [ ] No error messages in Docker logs

---

## 📝 After Completion

**Update this file with results**:

```markdown
## Results

**Date Completed**: [timestamp]
**Status**: ✅ Success / ❌ Failed

**Migration Output**:
```
[paste migration output here]
```

**Prisma Generate Output**:
```
[paste output here]
```

**Issues Encountered**: [if any]

**Next Steps**: [if any follow-up needed]
```

**Then commit and push**:

```bash
git add .
git commit -m "feat(db): add MarkdownFile schema and migration (Sprint 2)"
git push origin feature/sprint-2-markdown-sync
```

---

## 🔍 Troubleshooting

**If migration fails**:
1. Check database connection: `docker ps` (PostgreSQL container running?)
2. Check DATABASE_URL is correct
3. Check if table already exists: `psql -h 192.168.1.15 -U postgres -d projectpulse_dev -c "\dt"`

**If Prisma generate fails**:
1. Check schema syntax: `npx prisma validate`
2. Delete `node_modules/.prisma` and retry

**If Next.js won't restart**:
1. Check logs: `docker-compose -f docker-compose.cloud.yml logs nextjs`
2. Full restart: `docker-compose -f docker-compose.cloud.yml down && docker-compose -f docker-compose.cloud.yml up -d`

---

**Ready to execute these steps on Mac mini!**
