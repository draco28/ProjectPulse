-- Sprint 10.5: Rename Issue*Option tables to Ticket*Option
-- This migration renames the filter option tables while preserving all data
-- Following Prisma migration workflow SOP

-- ============================================================================
-- STEP 1: Rename tables (preserves data)
-- ============================================================================

-- Rename issue_status_options -> ticket_status_options
ALTER TABLE "issue_status_options" RENAME TO "ticket_status_options";

-- Rename issue_priority_options -> ticket_priority_options  
ALTER TABLE "issue_priority_options" RENAME TO "ticket_priority_options";

-- Rename issue_module_options -> ticket_module_options
ALTER TABLE "issue_module_options" RENAME TO "ticket_module_options";

-- ============================================================================
-- STEP 2: Rename indexes (for consistency)
-- ============================================================================

-- Status option indexes
ALTER INDEX IF EXISTS "issue_status_options_value_key" RENAME TO "ticket_status_options_value_key";
ALTER INDEX IF EXISTS "issue_status_options_value_idx" RENAME TO "ticket_status_options_value_idx";
ALTER INDEX IF EXISTS "issue_status_options_order_idx" RENAME TO "ticket_status_options_order_idx";

-- Priority option indexes
ALTER INDEX IF EXISTS "issue_priority_options_value_key" RENAME TO "ticket_priority_options_value_key";
ALTER INDEX IF EXISTS "issue_priority_options_value_idx" RENAME TO "ticket_priority_options_value_idx";
ALTER INDEX IF EXISTS "issue_priority_options_order_idx" RENAME TO "ticket_priority_options_order_idx";

-- Module option indexes
ALTER INDEX IF EXISTS "issue_module_options_value_key" RENAME TO "ticket_module_options_value_key";
ALTER INDEX IF EXISTS "issue_module_options_value_idx" RENAME TO "ticket_module_options_value_idx";
ALTER INDEX IF EXISTS "issue_module_options_order_idx" RENAME TO "ticket_module_options_order_idx";

-- ============================================================================
-- STEP 3: Rename primary key constraints (optional, for full consistency)
-- ============================================================================

ALTER TABLE "ticket_status_options" RENAME CONSTRAINT "issue_status_options_pkey" TO "ticket_status_options_pkey";
ALTER TABLE "ticket_priority_options" RENAME CONSTRAINT "issue_priority_options_pkey" TO "ticket_priority_options_pkey";
ALTER TABLE "ticket_module_options" RENAME CONSTRAINT "issue_module_options_pkey" TO "ticket_module_options_pkey";
