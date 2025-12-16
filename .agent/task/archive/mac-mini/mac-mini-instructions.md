# Mac Mini Instructions - Sprint 6 Database Migration

**Created**: 2025-11-13 (Sprint 6 Day 1)
**Task**: Apply Prisma migration for Knowledge Query Metrics + Archive field

---

## Context

Implementing US-086 (Measure query performance) and US-090 (Archive knowledge items).

**Changes made**:
1. Added `KnowledgeQueryMetric` model (tracks latency, result count, token usage per query)
2. Added `archivedAt` field to `KnowledgeItem` model (soft delete for archival)

---

## Instructions

### Step 1: Pull Latest Code

```bash
cd /Users/draco/projects/AI_HUB
git pull origin master
```

### Step 2: Generate Migration

```bash
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx prisma migrate dev --name add_knowledge_metrics_and_archive
```

**Expected output**:
- Migration file created in `prisma/migrations/`
- Tables: `knowledge_query_metrics` created
- Columns: `knowledge_items.archivedAt` added

### Step 3: Verify Migration

```bash
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx prisma db push --skip-generate
```

### Step 4: Restart Next.js Server

```bash
docker-compose -f docker-compose.cloud.yml restart web
```

### Step 5: Test Health Endpoint

```bash
curl http://192.168.1.15:3000/api/health
```

**Expected**: `{"status":"healthy","database":"connected"}`

---

## Verification Checklist

- [ ] Migration applied successfully (no errors)
- [ ] `knowledge_query_metrics` table exists
- [ ] `knowledge_items.archived_at` column exists
- [ ] Health endpoint returns healthy
- [ ] No TypeScript errors in server logs

---

## Report Back

Update this file with results:

**Migration Status**: [PENDING / SUCCESS / ERROR]

**Migration Output**:
```
[Paste migration output here]
```

**Errors** (if any):
```
[Paste error output here]
```

**Health Check**:
```
[Paste curl output here]
```

---

**Commit and push this file with results when done.**
