-- AlterTable: Add projectId column to AgentPersona (Sprint 8.5 Phase 3: Project-scoped agents)
-- This migration handles existing data by assigning agents to the first project

-- Step 1: Add projectId column (nullable first)
ALTER TABLE "AgentPersona" ADD COLUMN "projectId" INTEGER;

-- Step 2: Assign existing agents to first project (if any agents exist)
UPDATE "AgentPersona" 
SET "projectId" = (SELECT id FROM "Project" ORDER BY id LIMIT 1)
WHERE "projectId" IS NULL;

-- Step 3: Make projectId required
ALTER TABLE "AgentPersona" ALTER COLUMN "projectId" SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE "AgentPersona" 
ADD CONSTRAINT "AgentPersona_projectId_fkey" 
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Drop old unique constraints
ALTER TABLE "AgentPersona" DROP CONSTRAINT IF EXISTS "AgentPersona_name_key";
ALTER TABLE "AgentPersona" DROP CONSTRAINT IF EXISTS "AgentPersona_slug_key";

-- Step 6: Add new composite unique constraints (name and slug unique per project)
ALTER TABLE "AgentPersona" ADD CONSTRAINT "AgentPersona_projectId_name_key" 
UNIQUE ("projectId", "name");

ALTER TABLE "AgentPersona" ADD CONSTRAINT "AgentPersona_projectId_slug_key" 
UNIQUE ("projectId", "slug");

-- Step 7: Add indexes for performance
CREATE INDEX "AgentPersona_projectId_idx" ON "AgentPersona"("projectId");
CREATE INDEX "AgentPersona_projectId_isActive_idx" ON "AgentPersona"("projectId", "isActive");

-- Step 8: Drop old isActive-only index (replaced by composite index above)
DROP INDEX IF EXISTS "AgentPersona_isActive_idx";
