-- Sprint 11.7: Add Milestone model and dueDate to Ticket
-- This migration adds support for project milestones and ticket due dates

-- CreateTable: milestones (project-scoped milestone tracking)
CREATE TABLE "milestones" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "projectId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add dueDate and milestoneId to tickets table
-- Note: Prisma model "Ticket" maps to table "tickets" via @@map("tickets")
ALTER TABLE "tickets" ADD COLUMN "dueDate" TIMESTAMP(3);
ALTER TABLE "tickets" ADD COLUMN "milestoneId" INTEGER;

-- CreateIndex: milestones indexes for efficient queries
CREATE INDEX "milestones_projectId_idx" ON "milestones"("projectId");
CREATE INDEX "milestones_status_idx" ON "milestones"("status");
CREATE INDEX "milestones_targetDate_idx" ON "milestones"("targetDate");

-- CreateIndex: Unique constraint for milestone names within a project
CREATE UNIQUE INDEX "milestones_projectId_name_key" ON "milestones"("projectId", "name");

-- CreateIndex: tickets indexes for milestone and dueDate queries
CREATE INDEX "tickets_milestoneId_idx" ON "tickets"("milestoneId");
CREATE INDEX "tickets_dueDate_idx" ON "tickets"("dueDate");

-- AddForeignKey: milestones -> Project (cascade delete)
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: tickets -> milestones (set null on delete)
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
