-- Migration: Remove Week/Day Models (Ticket #80)
-- Sprint 15: Simplify roadmap hierarchy from 4-level to 2-level (Phase → Sprint only)
--
-- IMPORTANT: This migration archives Week/Day data before dropping tables.
-- Archive tables preserve historical data for reference if needed.

-- ============================================================================
-- STEP 1: Create Archive Tables (Preserve Historical Data)
-- ============================================================================

-- Archive weeks table (exact copy of structure)
CREATE TABLE IF NOT EXISTS weeks_archive (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  progress INTEGER NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "phaseId" TEXT NOT NULL,
  "sprintId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Archive days table (exact copy of structure)
CREATE TABLE IF NOT EXISTS days_archive (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  progress INTEGER NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "weekId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 2: Copy Data to Archive Tables
-- ============================================================================

-- Archive all weeks
INSERT INTO weeks_archive (
  id, title, description, status, progress,
  "startDate", "endDate", "phaseId", "sprintId",
  "createdAt", "updatedAt", "archivedAt"
)
SELECT
  id, title, description, status::TEXT, progress,
  "startDate", "endDate", "phaseId", "sprintId",
  "createdAt", "updatedAt", CURRENT_TIMESTAMP
FROM weeks
ON CONFLICT (id) DO NOTHING;

-- Archive all days
INSERT INTO days_archive (
  id, title, description, status, progress,
  "startDate", "endDate", "weekId",
  "createdAt", "updatedAt", "archivedAt"
)
SELECT
  id, title, description, status::TEXT, progress,
  "startDate", "endDate", "weekId",
  "createdAt", "updatedAt", CURRENT_TIMESTAMP
FROM days
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: Drop FK Constraint and Columns from Tickets
-- ============================================================================

-- Drop FK constraint from tickets to weeks (if exists)
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS "tickets_scheduledWeekId_fkey";

-- Drop the scheduledWeekId column
ALTER TABLE tickets DROP COLUMN IF EXISTS "scheduledWeekId";

-- Drop the scheduledDays column
ALTER TABLE tickets DROP COLUMN IF EXISTS "scheduledDays";

-- Drop index on scheduledWeekId (if exists)
DROP INDEX IF EXISTS "tickets_scheduledWeekId_idx";

-- ============================================================================
-- STEP 4: Drop Days Table (must come before Weeks due to FK)
-- ============================================================================

-- Drop FK constraint from days to weeks
ALTER TABLE days DROP CONSTRAINT IF EXISTS "days_weekId_fkey";

-- Drop the days table
DROP TABLE IF EXISTS days;

-- ============================================================================
-- STEP 5: Drop Weeks Table
-- ============================================================================

-- Drop FK constraints from weeks
ALTER TABLE weeks DROP CONSTRAINT IF EXISTS "weeks_phaseId_fkey";
ALTER TABLE weeks DROP CONSTRAINT IF EXISTS "weeks_sprintId_fkey";

-- Drop the weeks table
DROP TABLE IF EXISTS weeks;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add comment to archive tables for documentation
COMMENT ON TABLE weeks_archive IS 'Archived Week records from Sprint 15 migration (Ticket #80). Original 4-level hierarchy simplified to 2-level.';
COMMENT ON TABLE days_archive IS 'Archived Day records from Sprint 15 migration (Ticket #80). Original 4-level hierarchy simplified to 2-level.';
