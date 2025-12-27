-- Fix Phase cascade delete
-- Sprint 15 Bug Fix: Change phases.roadmapId FK from SET NULL to CASCADE
-- This ensures when a Roadmap is deleted, all Phase records are also deleted
-- (Previously, phases were orphaned with roadmapId=NULL)

-- Drop the existing foreign key constraint
ALTER TABLE "phases" DROP CONSTRAINT IF EXISTS "phases_roadmapId_fkey";

-- Re-create with CASCADE delete
ALTER TABLE "phases" ADD CONSTRAINT "phases_roadmapId_fkey"
  FOREIGN KEY ("roadmapId") REFERENCES "roadmaps"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
