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

[Mac mini Claude Code: Add results here after execution]

**PageLink Table Status**: ⏳ PENDING

**PageLink Records**: ⏳ PENDING (Expected: 7)

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
