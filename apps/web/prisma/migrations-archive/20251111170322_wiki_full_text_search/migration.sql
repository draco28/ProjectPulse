-- Add generated tsvector column for wiki content search
ALTER TABLE "WikiPage"
  ADD COLUMN "content_tsv" tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("excerpt", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("content", '')), 'C')
  ) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX "WikiPage_content_tsv_idx" ON "WikiPage" USING GIN ("content_tsv");
