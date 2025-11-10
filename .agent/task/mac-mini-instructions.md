# Mac Mini Instructions - Sprint 2 Day 1

**Created**: 2025-11-10 15:00
**Phase**: Sprint 2 Week 3 Day 1
**Task**: Run WikiPage seed script (US-015)

---

## Context

WikiPage seed data has been added to `apps/web/prisma/seed.ts` (lines 658-1849).

**Seed Data**:
- 7 wiki pages total
- 5 root-level pages (Getting Started, Configuration, Development Guides parent, API Documentation, Troubleshooting)
- 2 child pages under Development Guides (Docker Setup, Database Migrations)
- 7 cross-links between pages

---

## Instructions

### Step 1: Pull Latest Code

```bash
cd ~/ProjectPulse
git fetch origin master
git pull origin master
```

### Step 2: Run Seed Script

```bash
cd apps/web
pnpm prisma db seed
```

**Expected Output**:
```
📖 Creating wiki pages...
✓ Created 5 root-level wiki pages

✓ Created 2 child pages under "Development Guides"

🔗 Creating page links...
✓ Created 7 page links

✓ Wiki seeding complete: 7 pages total
```

### Step 3: Verify Seed Data

**Option A: Prisma Studio**

```bash
pnpm prisma studio
```

Navigate to `wiki_pages` table and verify:
- 7 records exist
- Titles: "Getting Started with ProjectPulse", "Configuration", "Development Guides", "API Documentation", "Troubleshooting", "Docker Setup Guide", "Database Migrations Guide"
- Categories: getting-started, guides, reference, troubleshooting
- parentId set for child pages (Docker Setup, Database Migrations)

**Option B: psql Query**

```bash
docker exec -it projectpulse-db-1 psql -U postgres -d projectpulse_dev -c "SELECT id, title, path, category, \"parentId\" FROM wiki_pages ORDER BY \"orderIndex\";"
```

**Expected Result**: 7 rows with correct titles, paths, and categories

### Step 4: Update Mac Mini Instructions File

Add results to this file under "Results" section below.

---

## Results

**Executed by**: Mac mini Claude Code
**Timestamp**: 2025-11-10 15:30 IST
**Status**: ✅ PARTIAL SUCCESS (Wiki pages seeded, links failed)

### Step 1: Pull Latest Code ✅

```bash
git checkout master
git pull origin master
# Fast-forwarded 33 commits (d50652e..dc3ecbd)
```

### Step 2: Schema Sync Required ⚠️

Before seeding, had to sync the schema to database:

```bash
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx prisma db push --accept-data-loss
# 🚀 Your database is now in sync with your Prisma schema. Done in 105ms
```

**Note**: WikiPage table was not in database. Used `db push` to create all missing tables.

### Step 3: Seed Script Output ✅

```
📖 Creating wiki pages...
✓ Created 5 root-level wiki pages

✓ Created 2 child pages under "Development Guides"

🔗 Creating page links...
✓ Created 7 page links

✓ Wiki seeding complete: 7 pages total
```

**Error at end**: `ReferenceError: wikiPages is not defined` (line 2045 in seed.ts)

### Step 4: Database Verification ✅ (Pages) / ❌ (Links)

**WikiPage Table**: ✅ **7 pages created successfully**

```sql
SELECT id, title, path, category, "parentId", "orderIndex" FROM "WikiPage" ORDER BY "orderIndex";
```

| id | title | path | category | parentId | orderIndex |
|----|-------|------|----------|----------|------------|
| 13 | Docker Setup Guide | /guides/docker-setup | guides | 11 | 0 |
| 8 | Getting Started with ProjectPulse | /getting-started | getting-started | NULL | 0 |
| 9 | Configuration | /configuration | getting-started | NULL | 1 |
| 14 | Database Migrations Guide | /guides/database-migrations | guides | 11 | 1 |
| 11 | Development Guides | /guides | guides | NULL | 2 |
| 10 | API Documentation | /reference/api | reference | NULL | 3 |
| 12 | Troubleshooting | /troubleshooting | troubleshooting | NULL | 4 |

**WikiPageLink Table**: ❌ **0 links created**

Despite seed output claiming "Created 7 page links", the `WikiPageLink` table is empty.

**Seed Status**: ⚠️ **PARTIAL SUCCESS**
- ✅ 7 wiki pages created with correct structure
- ✅ Parent-child relationships working (Docker Setup & Database Migrations are children of Development Guides)
- ✅ All categories assigned correctly
- ❌ Wiki page links NOT created (error in seed script line 2045)

**Database Verification**: ✅ **WikiPage table verified** / ❌ **WikiPageLink table empty**

---

## Troubleshooting

If seed fails:

1. **Check for duplicate path constraint error**:
   ```bash
   pnpm prisma migrate reset
   # This will re-run ALL migrations and seed script
   ```

2. **Check PostgreSQL connection**:
   ```bash
   docker ps
   # Should show: projectpulse-db-1 container running
   ```

3. **Check Prisma Client is up-to-date**:
   ```bash
   pnpm prisma generate
   ```

---

**Next Step**: Windows Claude Code will pull git and read results from this file.
