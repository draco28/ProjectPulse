-- Sprint 11.7: Add projectId to Label model for project-scoped labels
-- This migration converts global labels to project-scoped labels

-- Step 1: Add nullable projectId column
ALTER TABLE "Label" ADD COLUMN "projectId" INTEGER;

-- Step 2: Populate projectId from associated tickets
-- Each label gets the projectId from its first associated ticket
UPDATE "Label" l
SET "projectId" = (
  SELECT t."projectId"
  FROM "tickets" t
  JOIN "_LabelToTicket" lt ON lt."B" = t.id AND lt."A" = l.id
  LIMIT 1
)
WHERE l."projectId" IS NULL;

-- Step 3: Handle orphan labels (labels with no tickets)
-- Assign them to the first project in the database
UPDATE "Label"
SET "projectId" = (SELECT "id" FROM "Project" ORDER BY "id" ASC LIMIT 1)
WHERE "projectId" IS NULL;

-- Step 4: Make projectId NOT NULL (only if we have labels and projects)
-- If there are labels without projectId at this point, they'll cause an error
-- which is correct - we shouldn't have orphan labels
ALTER TABLE "Label" ALTER COLUMN "projectId" SET NOT NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE "Label" ADD CONSTRAINT "Label_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Drop the old unique constraint on name only
DROP INDEX IF EXISTS "Label_name_key";

-- Step 7: Create new unique constraint for projectId + name
CREATE UNIQUE INDEX "Label_projectId_name_key" ON "Label"("projectId", "name");

-- Step 8: Add index on projectId for efficient queries
CREATE INDEX "Label_projectId_idx" ON "Label"("projectId");
