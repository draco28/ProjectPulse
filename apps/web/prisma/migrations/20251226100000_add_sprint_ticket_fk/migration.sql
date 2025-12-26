-- Sprint 15 Phase B: Add Sprint-Ticket FK Relationship
-- This migration establishes proper FK relationship between Sprint and Ticket:
-- 1. Adds Sprint.sprintNumber for ordering and correlation
-- 2. Adds Ticket.sprintId FK to enable proper joins for progress calculation
-- 3. Backfills both fields from existing data
--
-- Dual-Field Design:
-- - Ticket.sprintNumber (existing) - Query convenience filter (1, 2, 3...)
-- - Ticket.sprintId (new) - Proper FK with referential integrity
-- - Both are kept for backward compatibility and query optimization

-- ============================================================================
-- STEP 1: Add sprintNumber column to Sprint table
-- ============================================================================
-- Sprint number within phase (1, 2, 3, ...) for human readability and
-- correlation with Ticket.sprintNumber.

ALTER TABLE "sprints" ADD COLUMN "sprintNumber" INTEGER;

-- ============================================================================
-- STEP 2: Backfill Sprint.sprintNumber using ROW_NUMBER()
-- ============================================================================
-- Orders sprints within each phase by startDate, then createdAt.
-- This ensures consistent numbering based on chronological order.

WITH numbered AS (
  SELECT id, "phaseId",
    ROW_NUMBER() OVER (PARTITION BY "phaseId" ORDER BY "startDate" ASC, "createdAt" ASC) as rn
  FROM "sprints"
)
UPDATE "sprints" s
SET "sprintNumber" = n.rn
FROM numbered n
WHERE s.id = n.id;

-- ============================================================================
-- STEP 3: Make sprintNumber NOT NULL and add constraints
-- ============================================================================
-- After backfill, enforce the constraint for data integrity.

-- Set NOT NULL constraint
ALTER TABLE "sprints" ALTER COLUMN "sprintNumber" SET NOT NULL;

-- Add unique constraint (per phase)
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_phaseId_sprintNumber_key"
  UNIQUE ("phaseId", "sprintNumber");

-- Add index for fast lookup
CREATE INDEX "sprints_phaseId_sprintNumber_idx"
ON "sprints"("phaseId", "sprintNumber");

-- ============================================================================
-- STEP 4: Add sprintId column to Ticket table
-- ============================================================================
-- FK to actual Sprint record for proper relationship.

ALTER TABLE "tickets" ADD COLUMN "sprintId" TEXT;

-- Add FK constraint with SET NULL on delete (tickets survive sprint deletion)
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_sprintId_fkey"
  FOREIGN KEY ("sprintId") REFERENCES "sprints"(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 5: Backfill Ticket.sprintId from sprintNumber
-- ============================================================================
-- Match tickets to sprints by joining through the roadmap hierarchy:
-- Ticket.projectId → Roadmap.projectId → Phase → Sprint
-- Where Sprint.sprintNumber = Ticket.sprintNumber

UPDATE "tickets" t
SET "sprintId" = s.id
FROM "sprints" s
JOIN "phases" p ON s."phaseId" = p.id
JOIN "roadmaps" r ON p."roadmapId" = r.id
WHERE r."projectId" = t."projectId"
  AND s."sprintNumber" = t."sprintNumber"
  AND t."sprintNumber" IS NOT NULL;

-- ============================================================================
-- STEP 6: Create indexes for Ticket.sprintId
-- ============================================================================
-- Optimize queries for kanban board and progress calculation.

-- Basic FK index
CREATE INDEX "tickets_sprintId_idx"
ON "tickets"("sprintId");

-- Composite index for kanban board queries
-- Optimizes: SELECT ... WHERE sprintId = X AND status = Y ORDER BY displayOrder
CREATE INDEX "tickets_sprintId_status_displayOrder_idx"
ON "tickets"("sprintId", "status", "displayOrder");

-- ============================================================================
-- VERIFICATION QUERIES (for manual validation)
-- ============================================================================
-- Run these after migration to verify data integrity:
--
-- Check Sprint.sprintNumber distribution:
-- SELECT "phaseId", "sprintNumber", COUNT(*) FROM "sprints" GROUP BY "phaseId", "sprintNumber" ORDER BY "phaseId", "sprintNumber";
--
-- Check Ticket.sprintId backfill:
-- SELECT COUNT(*) as total, COUNT("sprintId") as with_sprint_id, COUNT("sprintNumber") as with_sprint_number FROM "tickets";
--
-- Verify FK relationship:
-- SELECT t.id, t."sprintNumber", t."sprintId", s."sprintNumber" as sprint_sprint_number
-- FROM "tickets" t
-- LEFT JOIN "sprints" s ON t."sprintId" = s.id
-- WHERE t."sprintNumber" IS NOT NULL
-- LIMIT 10;
