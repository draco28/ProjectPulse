-- Sprint 10: Ticket System Migration
-- This migration renames Issue → Ticket and related models
-- IMPORTANT: This is a data-preserving migration (no data loss)

-- ============================================================================
-- STEP 1: Add new columns to Issue table (before rename)
-- ============================================================================

-- Add new Ticket-specific columns to Issue table
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'issue';
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "assigneeType" TEXT;
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "assigneeId" TEXT;
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "linkedTaskId" TEXT;

-- ============================================================================
-- STEP 2: Rename tables (Issue → Ticket, Comment → TicketComment, etc.)
-- ============================================================================

-- Rename Issue table to Ticket (preserves data)
ALTER TABLE "Issue" RENAME TO "tickets";

-- Rename Comment table to ticket_comments
ALTER TABLE "Comment" RENAME TO "ticket_comments";

-- Rename Attachment table to ticket_attachments  
ALTER TABLE "Attachment" RENAME TO "ticket_attachments";

-- Rename LinkedFile table to ticket_linked_files
ALTER TABLE "LinkedFile" RENAME TO "ticket_linked_files";

-- Rename LinkedCommit table to ticket_linked_commits
ALTER TABLE "LinkedCommit" RENAME TO "ticket_linked_commits";

-- Rename KnowledgeLink table to ticket_knowledge_links
ALTER TABLE "KnowledgeLink" RENAME TO "ticket_knowledge_links";

-- Rename WikiPageLink table to ticket_wiki_page_links
ALTER TABLE "WikiPageLink" RENAME TO "ticket_wiki_page_links";

-- ============================================================================
-- STEP 3: Rename foreign key columns (issueId → ticketId)
-- ============================================================================

-- Rename issueId column in ticket_comments
ALTER TABLE "ticket_comments" RENAME COLUMN "issueId" TO "ticketId";

-- Rename issueId column in ticket_attachments
ALTER TABLE "ticket_attachments" RENAME COLUMN "issueId" TO "ticketId";

-- Rename issueId column in ticket_linked_files
ALTER TABLE "ticket_linked_files" RENAME COLUMN "issueId" TO "ticketId";

-- Rename issueId column in ticket_linked_commits
ALTER TABLE "ticket_linked_commits" RENAME COLUMN "issueId" TO "ticketId";

-- Rename issueId column in ticket_knowledge_links
ALTER TABLE "ticket_knowledge_links" RENAME COLUMN "issueId" TO "ticketId";

-- Rename issueId column in ticket_wiki_page_links
ALTER TABLE "ticket_wiki_page_links" RENAME COLUMN "issueId" TO "ticketId";

-- Rename issueId column in SecurityFinding
ALTER TABLE "SecurityFinding" RENAME COLUMN "issueId" TO "ticketId";

-- Rename issueId column in health_findings
ALTER TABLE "health_findings" RENAME COLUMN "issueId" TO "ticketId";

-- ============================================================================
-- STEP 4: Rename the implicit many-to-many table for Label ↔ Issue
-- ============================================================================

-- Rename the implicit join table created by Prisma
-- Note: Prisma's implicit join tables use A/B columns where:
-- A = first model alphabetically (Issue→Ticket, but still 'A')
-- B = second model alphabetically (Label, still 'B')
-- The column names A and B remain unchanged - only the table name changes
ALTER TABLE "_IssueToLabel" RENAME TO "_LabelToTicket";

-- ============================================================================
-- STEP 5: Add new indexes for Ticket
-- ============================================================================

-- Add new indexes for kind field
CREATE INDEX IF NOT EXISTS "tickets_kind_idx" ON "tickets"("kind");
CREATE INDEX IF NOT EXISTS "tickets_projectId_kind_idx" ON "tickets"("projectId", "kind");
CREATE INDEX IF NOT EXISTS "tickets_projectId_status_idx" ON "tickets"("projectId", "status");
CREATE INDEX IF NOT EXISTS "tickets_kind_status_idx" ON "tickets"("kind", "status");
CREATE INDEX IF NOT EXISTS "tickets_linkedTaskId_idx" ON "tickets"("linkedTaskId");

-- ============================================================================
-- STEP 6: Add foreign key constraint for linkedTaskId → Task
-- ============================================================================

-- Add foreign key constraint for linkedTaskId
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_linkedTaskId_fkey" 
  FOREIGN KEY ("linkedTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- STEP 7: Update constraint names to match new table names
-- ============================================================================

-- Drop old foreign key constraints and recreate with new names
-- ticket_comments
ALTER TABLE "ticket_comments" DROP CONSTRAINT IF EXISTS "Comment_issueId_fkey";
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticketId_fkey" 
  FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ticket_attachments
ALTER TABLE "ticket_attachments" DROP CONSTRAINT IF EXISTS "Attachment_issueId_fkey";
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticketId_fkey" 
  FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ticket_linked_files
ALTER TABLE "ticket_linked_files" DROP CONSTRAINT IF EXISTS "LinkedFile_issueId_fkey";
ALTER TABLE "ticket_linked_files" ADD CONSTRAINT "ticket_linked_files_ticketId_fkey" 
  FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ticket_linked_commits
ALTER TABLE "ticket_linked_commits" DROP CONSTRAINT IF EXISTS "LinkedCommit_issueId_fkey";
ALTER TABLE "ticket_linked_commits" ADD CONSTRAINT "ticket_linked_commits_ticketId_fkey" 
  FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ticket_knowledge_links
ALTER TABLE "ticket_knowledge_links" DROP CONSTRAINT IF EXISTS "KnowledgeLink_issueId_fkey";
ALTER TABLE "ticket_knowledge_links" ADD CONSTRAINT "ticket_knowledge_links_ticketId_fkey" 
  FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ticket_wiki_page_links
ALTER TABLE "ticket_wiki_page_links" DROP CONSTRAINT IF EXISTS "WikiPageLink_issueId_fkey";
ALTER TABLE "ticket_wiki_page_links" ADD CONSTRAINT "ticket_wiki_page_links_ticketId_fkey" 
  FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SecurityFinding
ALTER TABLE "SecurityFinding" DROP CONSTRAINT IF EXISTS "SecurityFinding_issueId_fkey";
ALTER TABLE "SecurityFinding" ADD CONSTRAINT "SecurityFinding_ticketId_fkey" 
  FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- health_findings
ALTER TABLE "health_findings" DROP CONSTRAINT IF EXISTS "health_findings_issueId_fkey";
ALTER TABLE "health_findings" ADD CONSTRAINT "health_findings_ticketId_fkey" 
  FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- STEP 8: Update unique constraints
-- ============================================================================

-- ticket_linked_files: update unique constraint
ALTER TABLE "ticket_linked_files" DROP CONSTRAINT IF EXISTS "LinkedFile_issueId_filePath_key";
ALTER TABLE "ticket_linked_files" ADD CONSTRAINT "ticket_linked_files_ticketId_filePath_key" 
  UNIQUE ("ticketId", "filePath");

-- ticket_linked_commits: update unique constraint
ALTER TABLE "ticket_linked_commits" DROP CONSTRAINT IF EXISTS "LinkedCommit_issueId_commitHash_key";
ALTER TABLE "ticket_linked_commits" ADD CONSTRAINT "ticket_linked_commits_ticketId_commitHash_key" 
  UNIQUE ("ticketId", "commitHash");

-- ticket_knowledge_links: update unique constraint
ALTER TABLE "ticket_knowledge_links" DROP CONSTRAINT IF EXISTS "KnowledgeLink_knowledgeItemId_issueId_key";
ALTER TABLE "ticket_knowledge_links" ADD CONSTRAINT "ticket_knowledge_links_knowledgeItemId_ticketId_key" 
  UNIQUE ("knowledgeItemId", "ticketId");

-- ticket_wiki_page_links: update unique constraint
ALTER TABLE "ticket_wiki_page_links" DROP CONSTRAINT IF EXISTS "WikiPageLink_wikiPageId_issueId_key";
ALTER TABLE "ticket_wiki_page_links" ADD CONSTRAINT "ticket_wiki_page_links_wikiPageId_ticketId_key" 
  UNIQUE ("wikiPageId", "ticketId");

-- ============================================================================
-- STEP 9: Rename indexes to match new table/column names
-- ============================================================================

-- ticket_comments indexes
ALTER INDEX IF EXISTS "Comment_issueId_idx" RENAME TO "ticket_comments_ticketId_idx";

-- ticket_attachments indexes
ALTER INDEX IF EXISTS "Attachment_issueId_idx" RENAME TO "ticket_attachments_ticketId_idx";

-- ticket_knowledge_links indexes
ALTER INDEX IF EXISTS "KnowledgeLink_issueId_idx" RENAME TO "ticket_knowledge_links_ticketId_idx";

-- ticket_wiki_page_links indexes
ALTER INDEX IF EXISTS "WikiPageLink_issueId_idx" RENAME TO "ticket_wiki_page_links_ticketId_idx";

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All existing Issue data is now in the tickets table with kind='issue'
-- All relations have been preserved and renamed appropriately
