# DB Migration Baseline Reset – Progress Tracker

**Task Folder:** `.agent/task/db-migration-baseline-reset/`  
**Owner:** DB / Infra track  
**Created:** 2025-11-24

---

## Checklist

### Phase 1 – Preparation

- [ ] Confirm `schema.prisma` and Docker DB schema are in sync (post-`db push` snapshot).
- [ ] Document current problematic migrations under `apps/web/prisma/migrations/`.

### Phase 2 – Archive Old Migrations

- [ ] Move existing migrations to `apps/web/prisma/migrations-archive/`.
- [ ] Verify `apps/web/prisma/migrations/` is empty.

### Phase 3 – Generate Baseline Migration

- [ ] Run `prisma migrate diff --from-empty --to-schema-datamodel=./prisma/schema.prisma --script` to create `2025xxxx_full_baseline/migration.sql`.
- [ ] Manually review `migration.sql` for completeness and safety.

### Phase 4 – Align `_prisma_migrations`

- [ ] Backup `_prisma_migrations` table from `projectpulse_dev`.
- [ ] Run `prisma migrate resolve --applied "2025xxxx_full_baseline"` against Docker DB.
- [ ] Verify `_prisma_migrations` contains the new baseline row.

### Phase 5 – Validation & Workflow Lock-In

- [ ] Run `prisma migrate dev --name validation_baseline_check` and confirm shadow DB rebuild succeeds.
- [ ] Remove any no-op validation migration folder if created.
- [ ] Update internal SOPs/docs to prohibit `prisma db push` on `projectpulse_dev`.
- [ ] Implement first real schema change using `prisma migrate dev` to prove workflow.

---

## Notes

- Use this file to log any deviations from the PLAN or unexpected issues.
- If a step fails, add a short note below with timestamp, error message, and resolution.
