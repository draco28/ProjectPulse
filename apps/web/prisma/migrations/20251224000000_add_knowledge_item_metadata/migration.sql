-- Ticket #59: Add metadata column to knowledge_items table
-- This column stores JSON metadata for traceability matrices and other knowledge context

ALTER TABLE "knowledge_items" ADD COLUMN "metadata" JSONB;
