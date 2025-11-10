# Mac Mini Instructions - Sprint 2 Day 4

**Created**: 2025-11-10 14:30
**Phase**: Sprint 2 Week 3 Day 4
**Task**: Run Wiki Contributors Update Script (US-019)

---

## Context

Wiki Detail Page enhancement requires updating existing wiki pages with:
- Contributors (JSON array)
- Page views (Int)
- Revisions count (Int)
- Reading time (Int, minutes)
- Tags (String array)
- Excerpt (String)

Script created at: `scripts/update-wiki-contributors.ts`

---

## Instructions

### Step 1: Pull Latest Code
```bash
cd ~/Projects/AI_HUB
git fetch origin master
git pull origin master
```

### Step 2: Run Update Script
```bash
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev" npx tsx scripts/update-wiki-contributors.ts
```

**Expected Output**:
```
🔄 Updating wiki pages with contributors...

Found X wiki pages to update

✓ Updated: Getting Started with ProjectPulse
  - Views: 450, Revisions: 12, Reading time: 8 min
  - Contributors: Moksha Dev, Sarah Chen
  - Tags: tutorial, 5 min read

... (more pages) ...

✅ All wiki pages updated successfully!
```

### Step 3: Verify Database
```bash
# Check one page to verify fields were added
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev" npx prisma studio
# Open WikiPage model and verify:
# - views field exists
# - revisions field exists
# - contributors field has JSON data
# - readingTime field has values
# - tags array has data
```

### Step 4: Report Back
Once complete, add results to this file under "Results" section below.

---

## Troubleshooting

**If `npx tsx` fails**:
```bash
# Install tsx globally
npm install -g tsx

# Or use node directly with ts-node
pnpm add -D ts-node
npx ts-node scripts/update-wiki-contributors.ts
```

**If database connection fails**:
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql postgresql://postgres:postgres123@localhost:5432/projectpulse_dev -c "SELECT COUNT(*) FROM \"WikiPage\";"
```

---

## Results

**Executed by**: Mac mini Claude Code
**Timestamp**: 2025-11-10 23:25 IST
**Status**: ✅ SUCCESS

### Execution Log

**Step 1**: Pulled latest code ✅
**Step 2**: Updated both schema files (root + apps/web) ✅
**Step 3**: Regenerated Prisma Client ✅
**Step 4**: Ran update script ✅

**Script Output**:
```
🔄 Updating wiki pages with contributors...

Found 8 wiki pages to update

✓ Updated: Development Guides (Views: 711, Revisions: 6, Reading time: 1 min)
✓ Updated: Getting Started with ProjectPulse (Views: 357, Revisions: 5, Reading time: 3 min)
✓ Updated: API Documentation (Views: 482, Revisions: 20, Reading time: 3 min)
✓ Updated: Configuration (Views: 849, Revisions: 6, Reading time: 3 min)
✓ Updated: Troubleshooting (Views: 326, Revisions: 4, Reading time: 3 min)
✓ Updated: Docker Setup Guide (Views: 778, Revisions: 18, Reading time: 1 min)
✓ Updated: Database Migrations Guide (Views: 173, Revisions: 17, Reading time: 2 min)
✓ Updated: Test Wiki Page (Views: 422, Revisions: 11, Reading time: 1 min)

✅ All wiki pages updated successfully!
```

### Actual Changes

The script will update ALL existing wiki pages with:
- `views`: Random 100-1100 (simulated page views)
- `revisions`: Random 1-20 (edit count)
- `contributors`: Array of 1-3 random contributors from: Moksha Dev, Sarah Chen, Alex Kumar
- `readingTime`: Calculated from content (200 words/min)
- `tags`: Based on category (tutorial, reference, guide, etc.)
- `excerpt`: First 200 characters of content

This data is required for the wiki detail page UI components.

---

**Next Step**: Once script completes successfully, Windows Claude Code will pull git and continue with React component implementation (WikiHeader, WikiContributors, etc.).
