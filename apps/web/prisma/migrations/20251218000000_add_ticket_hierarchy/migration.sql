-- Sprint 13: Add ticket hierarchy and traceability fields
-- Two-level hierarchy: Feature → Task/Issue/Bug
-- Traceability: epicRef, backlogRefs, sprintNumber

-- Add hierarchy field for parent-child relationships
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "parentTicketId" INTEGER;

-- Add traceability fields
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "epicRef" VARCHAR(200);
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "backlogRefs" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "sprintNumber" INTEGER;

-- Add self-referential foreign key for hierarchy
-- onDelete: SetNull means children become orphans when parent deleted
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_parentTicketId_fkey"
  FOREIGN KEY ("parentTicketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for hierarchy queries
CREATE INDEX IF NOT EXISTS "tickets_parentTicketId_idx" ON "tickets"("parentTicketId");
CREATE INDEX IF NOT EXISTS "tickets_projectId_parentTicketId_idx" ON "tickets"("projectId", "parentTicketId");
CREATE INDEX IF NOT EXISTS "tickets_projectId_sprintNumber_idx" ON "tickets"("projectId", "sprintNumber");
CREATE INDEX IF NOT EXISTS "tickets_projectId_epicRef_idx" ON "tickets"("projectId", "epicRef");
