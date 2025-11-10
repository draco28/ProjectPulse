# Mac Mini Instructions - Fix PageLink Issue

**Created**: 2025-11-10 16:00
**Task**: Verify PageLink table exists and create WikiPageLink records

---

## Context

Mac mini seed execution reported "Created 7 page links" but 0 records exist in database.
Possible cause: PageLink table doesn't exist (wasn't created during `prisma db push`).

---

## Instructions

### Step 1: Check if PageLink Table Exists

```bash
docker exec -it projectpulse-db-1 psql -U postgres -d projectpulse_dev -c "\dt"
```

Look for `PageLink` (or `page_links`) table in the list.

### Step 2: If PageLink Table Missing, Run Schema Sync

```bash
cd ~/ProjectPulse/apps/web
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx prisma db push --accept-data-loss
```

### Step 3: Verify PageLink Table Created

```bash
docker exec -it projectpulse-db-1 psql -U postgres -d projectpulse_dev -c "\d \"PageLink\""
```

Expected: Table structure with sourcePageId, targetPageId columns.

### Step 4: Re-run Seed to Create PageLink Records

```bash
cd ~/ProjectPulse/apps/web
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx prisma db seed
```

**Expected**: Should skip WikiPage creation (already exists) and create 7 PageLink records.

### Step 5: Verify PageLink Records

```bash
docker exec -it projectpulse-db-1 psql -U postgres -d projectpulse_dev -c "SELECT COUNT(*) FROM \"PageLink\";"
```

**Expected**: 7 records

```bash
docker exec -it projectpulse-db-1 psql -U postgres -d projectpulse_dev -c "
SELECT 
  pl.id,
  s.title as source_page,
  t.title as target_page,
  pl.\"linkType\"
FROM \"PageLink\" pl
JOIN \"WikiPage\" s ON pl.\"sourcePageId\" = s.id
JOIN \"WikiPage\" t ON pl.\"targetPageId\" = t.id
ORDER BY pl.id;
"
```

**Expected**: 7 rows showing cross-links between wiki pages.

### Step 6: Update This File with Results

Add results to "Results" section below.

---

## Results

**Executed by**: Mac mini Claude Code
**Timestamp**: 2025-11-10 16:15 IST
**Status**: ✅ SUCCESS - PageLinks Already Exist!

### Discovery: PageLinks Were Created Successfully

**Root Cause of Confusion**: The initial verification checked `WikiPageLink` table (wiki-to-issue links) instead of `PageLink` table (wiki-to-wiki cross-references).

### Step 1: Check PageLink Table ✅

```bash
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "\dt" | grep -i page
```

**Result**: Found THREE page-related tables:
- `PageLink` ✅ (wiki cross-references - THIS is what seed creates)
- `WikiPage` ✅ (wiki pages themselves)
- `WikiPageLink` (wiki-to-issue links - different feature)

### Step 2: PageLink Table Structure ✅

```
                                            Table "public.PageLink"
    Column    |              Type
--------------+--------------------------------
 id           | integer
 sourcePageId | integer (FK to WikiPage)
 targetPageId | integer (FK to WikiPage)
 linkType     | text
 createdAt    | timestamp(3)

Indexes:
- PRIMARY KEY on id
- UNIQUE constraint on (sourcePageId, targetPageId)
- Foreign keys to WikiPage with CASCADE
```

### Step 3: Verify PageLink Records ✅

**Count Query**:
```sql
SELECT COUNT(*) as pagelink_count FROM "PageLink";
```

**Result**: `7 records` ✅ (Exactly as expected!)

**Detail Query**:
```sql
SELECT
  pl.id,
  s.title as source_page,
  t.title as target_page,
  pl."linkType"
FROM "PageLink" pl
JOIN "WikiPage" s ON pl."sourcePageId" = s.id
JOIN "WikiPage" t ON pl."targetPageId" = t.id
ORDER BY pl.id;
```

**Result**: All 7 cross-links verified ✅

| id | source_page | target_page | linkType |
|----|-------------|-------------|----------|
| 8 | Getting Started with ProjectPulse | Configuration | NULL |
| 9 | Getting Started with ProjectPulse | Docker Setup Guide | NULL |
| 10 | Configuration | Docker Setup Guide | NULL |
| 11 | Configuration | Database Migrations Guide | NULL |
| 12 | API Documentation | Troubleshooting | NULL |
| 13 | Troubleshooting | Configuration | NULL |
| 14 | Troubleshooting | Docker Setup Guide | NULL |

**PageLink Table Status**: ✅ **EXISTS AND POPULATED**

**PageLink Records**: ✅ **7 records created** (Expected: 7)

### Summary

The original seed script execution was **100% SUCCESSFUL**!

**What happened:**
1. ✅ 7 WikiPage records created
2. ✅ 7 PageLink records created
3. ❌ Verification checked wrong table (`WikiPageLink` instead of `PageLink`)

**Current State:**
- ✅ WikiPage table: 7 pages with correct hierarchy
- ✅ PageLink table: 7 cross-references between pages
- ✅ WikiPageLink table: Empty (expected - links wiki to issues, not used yet)

**No action needed!** US-015 seed data is complete and ready for UI development.

---

## Troubleshooting

If seed fails with "Unique constraint violated on WikiPage.path":

```bash
# WikiPages already exist, just need PageLinks
# Manually create them:
docker exec -it projectpulse-db-1 psql -U postgres -d projectpulse_dev
```

```sql
-- Get WikiPage IDs first
SELECT id, title, path FROM "WikiPage" ORDER BY "orderIndex";

-- Then manually insert PageLinks (adjust IDs based on query above)
-- Example (replace IDs with actual values):
INSERT INTO "PageLink" ("sourcePageId", "targetPageId") VALUES
  (1, 2),  -- Getting Started → Configuration
  (1, 6),  -- Getting Started → Docker Setup
  (2, 6),  -- Configuration → Docker Setup
  (2, 7),  -- Configuration → Database Migrations
  (4, 5),  -- API Documentation → Troubleshooting
  (5, 2),  -- Troubleshooting → Configuration
  (5, 6);  -- Troubleshooting → Docker Setup
```

---

**Next Step**: Windows Claude Code will pull git and read results from this file.
