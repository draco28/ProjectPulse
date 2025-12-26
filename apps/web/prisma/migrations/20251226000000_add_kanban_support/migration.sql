-- Sprint 15: Add Kanban Support Migration
-- This migration:
-- 1. Adds displayOrder column for kanban column ordering
-- 2. Backfills displayOrder using ROW_NUMBER() for existing tickets
-- 3. Remaps ticket status values to new kanban-compatible statuses
-- 4. Updates TicketStatusOption table with 5 new statuses
-- 5. Creates composite index for efficient kanban queries

-- ============================================================================
-- STEP 1: Add displayOrder column
-- ============================================================================
-- This column determines the order of tickets within a kanban column.
-- Default 0 ensures new tickets appear at the top of the column.

ALTER TABLE "tickets" ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- ============================================================================
-- STEP 2: Backfill displayOrder using ROW_NUMBER()
-- ============================================================================
-- Orders tickets within each (project, sprint, status) group by creation date.
-- This ensures existing tickets have a sensible initial order.

UPDATE "tickets" t
SET "displayOrder" = sub.rn
FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "projectId", "sprintNumber", status
      ORDER BY "createdAt" ASC
    ) - 1 as rn
  FROM "tickets"
) sub
WHERE t.id = sub.id;

-- ============================================================================
-- STEP 3: Remap ticket status values
-- ============================================================================
-- Old statuses → New kanban-compatible statuses:
--   'open'        → 'backlog' (items not yet prioritized)
--   'blocked'     → 'backlog' (blocked items go back to backlog for triage)
--   'in-progress' → 'in-progress' (unchanged)
--   'closed'      → 'done' (completed items)
--
-- Note: 'todo' and 'in-review' are NEW statuses with no existing tickets.
-- They become available for future use in the kanban workflow.

UPDATE "tickets" SET status = 'backlog' WHERE status = 'open';
UPDATE "tickets" SET status = 'backlog' WHERE status = 'blocked';
UPDATE "tickets" SET status = 'done' WHERE status = 'closed';
-- 'in-progress' stays unchanged

-- ============================================================================
-- STEP 4: Update ticket_status_options table
-- ============================================================================
-- Replace old 4-status system with new 5-status kanban system.
-- Order determines left-to-right display in kanban board.
-- Note: Prisma maps TicketStatusOption model to "ticket_status_options" table.

-- 4a. Delete old status options
DELETE FROM "ticket_status_options" WHERE value IN ('open', 'closed', 'blocked');

-- 4b. Update existing in-progress to new styling
UPDATE "ticket_status_options"
SET "order" = 2, "colorClass" = 'bg-yellow-500/20 text-yellow-400', "updatedAt" = NOW()
WHERE value = 'in-progress';

-- 4c. Insert new status options
INSERT INTO "ticket_status_options" (value, label, "order", "colorClass", "createdAt", "updatedAt")
VALUES
  ('backlog', 'Backlog', 0, 'bg-gray-500/20 text-gray-400', NOW(), NOW()),
  ('todo', 'To Do', 1, 'bg-slate-500/20 text-slate-300', NOW(), NOW()),
  ('in-review', 'In Review', 3, 'bg-purple-500/20 text-purple-400', NOW(), NOW()),
  ('done', 'Done', 4, 'bg-green-500/20 text-green-400', NOW(), NOW())
ON CONFLICT (value) DO UPDATE SET
  label = EXCLUDED.label,
  "order" = EXCLUDED."order",
  "colorClass" = EXCLUDED."colorClass",
  "updatedAt" = NOW();

-- ============================================================================
-- STEP 5: Create composite index for kanban column queries
-- ============================================================================
-- This index optimizes the common query pattern:
-- WHERE projectId = X AND sprintNumber = Y AND status = Z ORDER BY displayOrder
-- Enables efficient rendering of individual kanban columns.

CREATE INDEX "tickets_projectId_sprintNumber_status_displayOrder_idx"
ON "tickets"("projectId", "sprintNumber", "status", "displayOrder");

-- ============================================================================
-- STEP 6: Update default status in schema
-- ============================================================================
-- Change the default from 'open' to 'backlog' for new tickets.
-- This is handled by Prisma schema, but we ensure the column default is correct.

ALTER TABLE "tickets" ALTER COLUMN "status" SET DEFAULT 'backlog';
