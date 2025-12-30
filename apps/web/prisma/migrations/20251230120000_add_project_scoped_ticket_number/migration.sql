-- Sprint 17: Add project-scoped ticket number
-- This field provides user-friendly ticket identification within each project
-- Each project has its own sequence: 1, 2, 3... (independent of global auto-increment id)

-- Step 1: Add the column (nullable initially for backfill)
ALTER TABLE "tickets" ADD COLUMN "ticket_number" INTEGER;

-- Step 2: Backfill existing tickets with project-scoped sequential numbers
-- Uses window function to assign 1, 2, 3... per project ordered by createdAt
-- Note: Prisma uses quoted camelCase column names (e.g., "projectId", "createdAt")
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "projectId" ORDER BY "createdAt") AS row_num
  FROM tickets
)
UPDATE tickets t
SET ticket_number = numbered.row_num
FROM numbered
WHERE t.id = numbered.id;

-- Step 3: Make the column NOT NULL after backfill
ALTER TABLE "tickets" ALTER COLUMN "ticket_number" SET NOT NULL;

-- Step 4: Add unique constraint per project (ensures no duplicates within a project)
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_projectId_ticket_number_key" UNIQUE ("projectId", "ticket_number");

-- Step 5: Add index for fast lookups by project + ticket number
CREATE INDEX "tickets_projectId_ticket_number_idx" ON "tickets"("projectId", "ticket_number");
