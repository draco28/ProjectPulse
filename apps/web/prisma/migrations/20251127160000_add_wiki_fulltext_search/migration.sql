-- AddWikiFullTextSearch
-- Sprint 11: Add proper tsvector column with weighted search
-- Additive migration - no data loss, safe to apply

-- Step 1: Add the generated tsvector column
-- Uses weighted search: title (A) > excerpt (B) > content (C)
-- STORED means it's persisted on disk (not computed on read)
ALTER TABLE "WikiPage"
ADD COLUMN IF NOT EXISTS "content_tsv" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(excerpt, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(content, '')), 'C')
) STORED;

-- Step 2: Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "WikiPage_content_tsv_idx"
ON "WikiPage" USING GIN ("content_tsv");
