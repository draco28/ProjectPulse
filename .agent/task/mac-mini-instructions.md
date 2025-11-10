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

[Mac mini Claude Code: Add results here after execution]

**Seed Status**: ⏳ PENDING

**Database Verification**: ⏳ PENDING

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
