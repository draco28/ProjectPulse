# Sprint 8 Day 4: Database Migration Fix

**Date**: 2025-11-15
**Issue**: Migration file existed but wasn't applied to PostgreSQL database

## Problem

The migration file `prisma/migrations/20251111170322_wiki_full_text_search/migration.sql` existed and was recorded in `_prisma_migrations` table, but the actual SQL didn't execute.

**Evidence**:
```bash
$ docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev \
  -c "SELECT column_name FROM information_schema.columns WHERE table_name='WikiPage';"

# Result: content_tsv column MISSING ❌
```

## Root Cause

Prisma sometimes marks migrations as "applied" without actually executing the SQL. This is a known issue when:
- Migration was interrupted
- Database connection issues occurred during deploy
- Manual schema changes were made

## Solution Applied

**Manual SQL execution** to add the missing `content_tsv` column:

```bash
# Add tsvector column with weighted search
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "
ALTER TABLE \"WikiPage\"
  ADD COLUMN IF NOT EXISTS \"content_tsv\" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(\"title\", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(\"excerpt\", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(\"content\", '')), 'C')
  ) STORED;
"

# Create GIN index for fast search
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "
CREATE INDEX IF NOT EXISTS \"WikiPage_content_tsv_idx\"
  ON \"WikiPage\" USING GIN (\"content_tsv\");
"
```

**Verification**:
```bash
$ docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev \
  -c "SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name='WikiPage' AND column_name='content_tsv';"

# Result:
# column_name | data_type
#-------------+-----------
# content_tsv | tsvector   ✅
```

**API Test**:
```bash
$ curl -s "http://192.168.1.15:3000/api/wiki?search=installation" | jq '.pages[0].highlight'

# Result: "**Installation** steps..." ✅
```

## Prevention

**Always verify migrations after deploy**:

```bash
# Check if migration was applied
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
  npx prisma migrate status

# Verify column exists in database
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev \
  -c "SELECT column_name FROM information_schema.columns WHERE table_name='YourTable';"
```

**If migration is marked as applied but column is missing**:

1. Read the migration SQL file
2. Execute SQL manually (with `IF NOT EXISTS` safety check)
3. Verify column was created
4. Test API/functionality

## Impact

- **Before**: API returned null for all search results (tsvector search failed)
- **After**: API returns highlights with `**wrapped**` search terms ✅
- **E2E Tests**: All "Wiki Full-Text Search" tests now pass ✅

## Files Changed

- **Database**: Added `content_tsv` tsvector column + GIN index
- **None (code unchanged)**: Migration file already existed, just needed execution

## Related

- Migration file: `prisma/migrations/20251111170322_wiki_full_text_search/migration.sql`
- Issue tracked: Sprint 8 Day 4 completion
- Committed: [feat(wiki): Implement tsvector full-text search with highlights]
