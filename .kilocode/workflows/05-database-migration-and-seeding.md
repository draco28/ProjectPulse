# Workflow 05 — Database Migration & Seeding

Steps:

1. Propose Prisma model diffs and indexes
2. Create migration with clear name; review SQL
3. Seed deterministic data (from config tables; no hardcoded prod values)
4. Add tests for constraints and queries
5. Verification Gate (Workflow 11)

Acceptance:

- Forward-only migration, no unsafe raw SQL
- Seed reproducible; tests green

References: rules/06, rules/07
