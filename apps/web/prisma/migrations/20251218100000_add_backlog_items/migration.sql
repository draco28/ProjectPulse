-- Sprint 14: Add backlog_items table for agent-consumable traceability
-- Source: Parsed from 12-Backlog.md during traceability validation
-- Purpose: Enable projectpulse_backlog_getBySprint() tool for ticket creation workflow

-- Create backlog_items table
CREATE TABLE "backlog_items" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "itemId" VARCHAR(50) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "epicRef" VARCHAR(200),
    "frTraces" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nfrTraces" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sprintNumber" INTEGER,
    "sourceDoc" VARCHAR(100) NOT NULL,
    "rawBlock" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backlog_items_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one item per project
CREATE UNIQUE INDEX "backlog_items_projectId_itemId_key" ON "backlog_items"("projectId", "itemId");

-- Performance indexes
CREATE INDEX "backlog_items_projectId_idx" ON "backlog_items"("projectId");
CREATE INDEX "backlog_items_projectId_sprintNumber_idx" ON "backlog_items"("projectId", "sprintNumber");

-- Foreign key to Project (cascade delete)
ALTER TABLE "backlog_items" ADD CONSTRAINT "backlog_items_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
