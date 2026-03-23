-- Fix FK constraints on _LabelToTicket join table.
--
-- History:
-- 1. Baseline created _IssueToLabel: A → Issue(id), B → Label(id) (Issue < Label alphabetically)
-- 2. Sprint 10 renamed table to _LabelToTicket and Prisma swapped column data
--    so A → Label(id), B → Ticket(id) (Label < Ticket alphabetically)
-- 3. But FK constraints were never updated — they still reference Issue(id) which no longer exists
--
-- This migration drops the stale constraints and creates correct ones.

-- Clean up any orphaned rows that would violate the new constraints
DELETE FROM "_LabelToTicket" WHERE "A" NOT IN (SELECT id FROM "Label");
DELETE FROM "_LabelToTicket" WHERE "B" NOT IN (SELECT id FROM "tickets");

-- Drop any existing constraints (handles both old and new names)
ALTER TABLE "_LabelToTicket" DROP CONSTRAINT IF EXISTS "_IssueToLabel_A_fkey";
ALTER TABLE "_LabelToTicket" DROP CONSTRAINT IF EXISTS "_IssueToLabel_B_fkey";
ALTER TABLE "_LabelToTicket" DROP CONSTRAINT IF EXISTS "_LabelToTicket_A_fkey";
ALTER TABLE "_LabelToTicket" DROP CONSTRAINT IF EXISTS "_LabelToTicket_B_fkey";

-- Recreate with correct references:
-- A = Label IDs (Label comes first alphabetically)
-- B = Ticket IDs (Ticket comes second alphabetically)
ALTER TABLE "_LabelToTicket"
  ADD CONSTRAINT "_LabelToTicket_A_fkey"
    FOREIGN KEY ("A") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_LabelToTicket"
  ADD CONSTRAINT "_LabelToTicket_B_fkey"
    FOREIGN KEY ("B") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
