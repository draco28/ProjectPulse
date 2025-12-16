# DB Migration Baseline Reset – Single-DB Strategy (Prisma)

**Date:** 2025-11-24  
**Owner:** DB / Infra track  
**Context:** Mac mini hosts both development and Docker Postgres (`projectpulse_dev`). Prisma migrations are partially broken, causing `prisma migrate dev` shadow DB failures and forcing unsafe `prisma db push` calls that risk data loss.

---

## 1. Problem Statement

- Early schema was created via **`prisma db push` / manual SQL**, not migrations.
- Later migrations (e.g. wiki versioning, full-text search) assume tables like `WikiPage` already exist.
- The first migration (`baseline_schema`) contains **no `CREATE TABLE` SQL**, so the migration history does **not** describe how to build the schema from an empty database.
- When Prisma runs `prisma migrate dev` it:
  1. Creates a **shadow DB** and replays all migrations from empty.
  2. Fails when a migration executes `ALTER TABLE "WikiPage"` while `WikiPage` does not exist in the shadow DB (P3006).
- Because `migrate dev` fails, we fall back to `prisma db push` against the Mac mini Docker DB, which can:
  - Drop/recreate tables or columns.
  - Destroy or rewrite data.

**Goal:**
- Establish a **clean migration baseline** that matches the current schema and allows safe use of `prisma migrate dev` / `prisma migrate deploy` with a **single canonical DB** (Docker Postgres on Mac mini), and **never again rely on `db push`** against that DB.

---

## 2. Constraints & Non-Goals

### 2.1 Constraints

- Mac mini Docker Postgres (`projectpulse_dev`) is the **single source of truth** for development data.
- We must preserve existing data (Memory Banks, Knowledge Base, wiki, etc.).
- We cannot assume deep DB expertise; steps must be simple and reproducible.

### 2.2 Non-Goals (for this task)

- Do **not** redesign the schema itself.
- Do **not** immediately squash or rewrite historical migrations beyond what is needed to create a working baseline.
- Do **not** introduce a permanent second Postgres instance; Prisma’s internal shadow DB is acceptable and invisible.

---

## 3. Target State (Desired Outcome)

After this task:

1. `apps/web/prisma/schema.prisma` and the Mac mini Docker DB schema remain in sync.
2. `apps/web/prisma/migrations/` contains a **single, full baseline migration** (plus any future migrations) that:
   - Creates all tables, indexes, and constraints required by the current schema.
   - Can be applied to an **empty DB** to reproduce the schema.
3. Prisma’s `_prisma_migrations` table in `projectpulse_dev` is updated so that the baseline migration is marked as **already applied** (without executing its SQL).
4. From this point forward:
   - We use `prisma migrate dev --name <change>` for new schema changes.
   - We use `prisma migrate deploy` in Docker to apply migrations.
   - We **never** use `prisma db push` against `projectpulse_dev` again.
5. `prisma migrate dev` runs **successfully** on Mac mini (shadow DB is able to replay from empty using the new baseline + subsequent migrations).

---

## 4. Plan Overview

### Phase 1 – Preparation (Read-Only)

1. Verify current state:
   - `schema.prisma` matches DB schema (already ensured by last `db push`).
   - Current migrations that reference existing tables (e.g. wiki migrations) are **patches** on top of manually-created tables.
2. Inventory existing migrations under `apps/web/prisma/migrations/` and document which ones are incomplete/broken as baselines.

### Phase 2 – Archive Old Migrations (Prisma-Visible History Reset)

3. Move all existing migration folders into an **archive path** Prisma ignores, for example:
   - `apps/web/prisma/migrations-archive/202511111540_baseline_schema/`
   - `apps/web/prisma/migrations-archive/202511111600_wiki_versioning_foundation/`
   - `apps/web/prisma/migrations-archive/20251111170322_wiki_full_text_search/`
4. Leave `apps/web/prisma/migrations/` **empty** so Prisma sees no active migrations.

> Note: This does **not** change the actual DB schema or `_prisma_migrations` table yet; it only affects future migration generation and shadow DB behavior.

### Phase 3 – Generate New Baseline Migration from Current Schema

5. Use `prisma migrate diff` with `--from-empty` to generate a complete baseline SQL script:

   ```bash
   cd apps/web
   npx prisma migrate diff \
     --from-empty \
     --to-schema-datamodel=./prisma/schema.prisma \
     --script > ./prisma/migrations/2025xxxx_full_baseline/migration.sql
   ```

   - This script **must** include all `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`, etc. for the current schema.
   - We will **not** run this SQL against the live DB; it is for fresh DBs and Prisma’s shadow DB only.

6. Manually review `migration.sql` to confirm it looks like a full schema bootstrap (no obvious `DROP TABLE` commands that would be dangerous on a fresh DB).

### Phase 4 – Align `_prisma_migrations` with New Baseline (Without Schema Changes)

7. Update the live `projectpulse_dev` DB’s `_prisma_migrations` table so Prisma believes the baseline migration has already been applied:
   - Use `prisma migrate resolve` with the baseline migration name, for example:

   ```bash
   cd apps/web
   npx prisma migrate resolve \
     --applied "2025xxxx_full_baseline"
   ```

   - This writes a row into `_prisma_migrations` but does **not** execute the SQL in `migration.sql`.
   - The actual schema remains unchanged; only Prisma’s migration metadata is updated.

8. Optionally: back up the `_prisma_migrations` table (e.g. via `pg_dump` on Mac mini) before running `migrate resolve` for rollback safety.

### Phase 5 – Validate and Lock in Workflow

9. Run `prisma migrate dev --name validation_baseline_check` on Mac mini (with `DATABASE_URL` pointing to the Docker DB):
   - Expected behavior:
     - Prisma creates a new shadow DB.
     - Applies the baseline migration there successfully.
     - Compares with `schema.prisma` and generates an **empty** or near-empty validation migration.
   - If it fails, investigate `migration.sql` for missing tables or constraints.

10. Once validated, **delete** the temporary `validation_baseline_check` migration folder (if it only contains no-op SQL) to keep history clean.

11. From this point on, enforce the policy:
   - All schema changes use `prisma migrate dev` / `prisma migrate deploy`.
   - `prisma db push` is forbidden on `projectpulse_dev`.

---

## 5. Risks & Mitigations

### Risk 1 – Baseline Migration Incomplete or Incorrect

- **Symptom:** `migrate dev` still fails on the shadow DB, or a fresh DB built from baseline doesn’t match the real schema.
- **Mitigation:**
  - Carefully review `migration.sql` for all tables and relations.
  - If needed, regenerate baseline after fixing `schema.prisma` (while ensuring it matches the real DB first).

### Risk 2 – `_prisma_migrations` Out of Sync

- **Symptom:** Prisma believes migrations are applied that don’t match the real schema.
- **Mitigation:**
  - Backup `_prisma_migrations` before making changes.
  - If alignment fails, restore the backup and retry with corrected baseline.

### Risk 3 – Accidental Use of `db push` in Future

- **Symptom:** Developer accidentally runs `prisma db push` against `projectpulse_dev` again.
- **Mitigation:**
  - Add internal SOP & warnings (e.g. in `.agent/sops/` or `MAC_MINI_EXECUTION_GUIDE.md`).
  - Optionally, adjust `package.json` scripts to remove or comment out any `db push` pointing at Docker DB.

---

## 6. Acceptance Criteria

- ✅ A single, complete baseline migration exists under `apps/web/prisma/migrations/` that can build the schema from empty.
- ✅ `_prisma_migrations` in `projectpulse_dev` includes the baseline as **applied** without schema changes.
- ✅ `prisma migrate dev` runs successfully on Mac mini with no shadow DB errors.
- ✅ New schema changes are implemented via `prisma migrate dev` (no further `db push` on the main DB).
- ✅ This plan is documented and discoverable under `.agent/task/db-migration-baseline-reset/`.
