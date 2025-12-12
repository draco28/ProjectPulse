-- Sprint 12: Roadmap-Ticket Redesign Migration
-- This migration:
-- 1. Removes orphaned models (Task, Session, Checkpoint, DevelopmentSession, CurrentPlan, CurrentTodos)
-- 2. Renames existing AgentSession to persona_activations
-- 3. Creates new agent_sessions for work tracking
-- 4. Adds ticket scheduling fields
-- 5. Removes linkedTaskId from tickets

-- ============================================================================
-- STEP 1: Drop Foreign Key Constraints (before dropping tables)
-- ============================================================================

-- Drop FK from tickets to tasks (linkedTaskId)
ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_linkedTaskId_fkey";

-- Drop FK from current_plans to weeks/days
ALTER TABLE "current_plans" DROP CONSTRAINT IF EXISTS "current_plans_weekId_fkey";
ALTER TABLE "current_plans" DROP CONSTRAINT IF EXISTS "current_plans_dayId_fkey";
ALTER TABLE "current_plans" DROP CONSTRAINT IF EXISTS "current_plans_projectId_fkey";

-- Drop FK from current_todos to weeks/days
ALTER TABLE "current_todos" DROP CONSTRAINT IF EXISTS "current_todos_weekId_fkey";
ALTER TABLE "current_todos" DROP CONSTRAINT IF EXISTS "current_todos_dayId_fkey";
ALTER TABLE "current_todos" DROP CONSTRAINT IF EXISTS "current_todos_projectId_fkey";

-- Drop FK from checkpoints to sessions
ALTER TABLE "checkpoints" DROP CONSTRAINT IF EXISTS "checkpoints_sessionId_fkey";

-- Drop FK from sessions to tasks
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_taskId_fkey";

-- Drop FK from tasks to days
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_dayId_fkey";

-- Drop FK from development_sessions to projects
ALTER TABLE "development_sessions" DROP CONSTRAINT IF EXISTS "development_sessions_projectId_fkey";

-- ============================================================================
-- STEP 2: Drop linkedTaskId Column from Tickets
-- ============================================================================

-- Drop the index first
DROP INDEX IF EXISTS "tickets_linkedTaskId_idx";

-- Drop the column
ALTER TABLE "tickets" DROP COLUMN IF EXISTS "linkedTaskId";

-- ============================================================================
-- STEP 3: Drop Orphaned Tables (in dependency order - children first)
-- ============================================================================

-- Drop checkpoints (depends on sessions)
DROP TABLE IF EXISTS "checkpoints";

-- Drop sessions (depends on tasks) - Note: This is the sprint tracking Session, not auth sessions
DROP TABLE IF EXISTS "sessions";

-- Drop tasks (depends on days)
DROP TABLE IF EXISTS "tasks";

-- Drop current_plans (standalone)
DROP TABLE IF EXISTS "current_plans";

-- Drop current_todos (standalone)
DROP TABLE IF EXISTS "current_todos";

-- Drop development_sessions (standalone)
DROP TABLE IF EXISTS "development_sessions";

-- ============================================================================
-- STEP 4: Rename Existing AgentSession to persona_activations
-- ============================================================================

-- Rename the table (for persona activation tracking)
-- Note: Original table is "AgentSession" (PascalCase)
ALTER TABLE IF EXISTS "AgentSession" RENAME TO "persona_activations";

-- ============================================================================
-- STEP 5: Create New agent_sessions Table (for work tracking)
-- ============================================================================

CREATE TABLE "agent_sessions" (
    "id" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT,
    "plan" TEXT,
    "todos" JSONB,
    "progress" TEXT,
    "activeTicketIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "agent_sessions_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint (Project table is PascalCase)
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "agent_sessions_projectId_status_idx" ON "agent_sessions"("projectId", "status");
CREATE INDEX "agent_sessions_projectId_startedAt_idx" ON "agent_sessions"("projectId", "startedAt" DESC);

-- ============================================================================
-- STEP 6: Add Scheduling Columns to Tickets
-- ============================================================================

-- Add estimatedDays column
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "estimatedDays" INTEGER;

-- Add scheduledWeekId column
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "scheduledWeekId" TEXT;

-- Add scheduledDays array column
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "scheduledDays" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add foreign key constraint for scheduledWeekId
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_scheduledWeekId_fkey"
    FOREIGN KEY ("scheduledWeekId") REFERENCES "weeks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for scheduled week queries
CREATE INDEX IF NOT EXISTS "tickets_scheduledWeekId_idx" ON "tickets"("scheduledWeekId");
