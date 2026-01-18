-- Ticket #132: Change WikiPage path from global unique to per-project unique
-- This enables proper multi-tenancy where different projects can have the same paths

-- Step 1: Drop the existing global unique constraint on path
DROP INDEX IF EXISTS "WikiPage_path_key";

-- Step 2: Drop the redundant index (@@unique creates its own index)
DROP INDEX IF EXISTS "WikiPage_projectId_path_idx";

-- Step 3: Create composite unique constraint on (projectId, path)
-- This allows same path in different projects but enforces uniqueness within each project
CREATE UNIQUE INDEX "WikiPage_projectId_path_key" ON "WikiPage"("projectId", "path");
