-- =============================================================================
-- Update Module Options: Replace game modules with dev-focused modules
-- =============================================================================
-- Sprint 14: Ticket #15 - Module filter shows irrelevant modules
--
-- Safe to run multiple times (idempotent via ON CONFLICT)
-- Run on: Dev (localhost:5432) and Prod (localhost:5433)
--
-- NOTE: Prisma's @updatedAt doesn't create a DB trigger, so we must
--       explicitly set "updatedAt" in raw SQL.
-- =============================================================================

-- Step 1: Delete old/irrelevant modules
-- Includes: game modules, duplicates with wrong casing, legacy values
DELETE FROM ticket_module_options
WHERE value IN (
  'combat', 'animation', 'Feature', 'Security', 'Performance',  -- old game/legacy
  'core', 'ui', 'Documentation'  -- lowercase duplicates and wrong naming
);

-- Step 2: Upsert new dev-focused modules (with proper timestamps)
INSERT INTO ticket_module_options (value, label, "order", "createdAt", "updatedAt") VALUES
  ('UI', 'UI / Frontend', 0, NOW(), NOW()),
  ('API', 'API / Backend', 1, NOW(), NOW()),
  ('Database', 'Database', 2, NOW(), NOW()),
  ('MCP', 'MCP Server', 3, NOW(), NOW()),
  ('Auth', 'Authentication', 4, NOW(), NOW()),
  ('Testing', 'Testing', 5, NOW(), NOW()),
  ('Docs', 'Documentation', 6, NOW(), NOW()),
  ('DevOps', 'DevOps / Infra', 7, NOW(), NOW()),
  ('Core', 'Core', 8, NOW(), NOW())
ON CONFLICT (value) DO UPDATE SET
  label = EXCLUDED.label,
  "order" = EXCLUDED."order",
  "updatedAt" = NOW();

-- Step 3: Verify results
SELECT value, label, "order" FROM ticket_module_options ORDER BY "order";
