# Prisma Migration SOP for Production

**Version**: 1.0
**Last Updated**: 2025-12-02
**Author**: Sprint 11 Infrastructure

---

## Overview

This SOP covers how to safely migrate database schema changes from development to production using Prisma and Dokploy's GitOps workflow.

**Key Principle**: Prisma does NOT support down migrations. Always keep migrations additive when possible.

---

## Migration Risk Levels

| Migration Type | Risk | Auto-Safe? | Example |
|---------------|------|------------|---------|
| Add table | Low | Yes | `model Skill { ... }` |
| Add column (nullable) | Low | Yes | `description String?` |
| Add column (with default) | Low | Yes | `status String @default("active")` |
| Add index | Low | Yes | `@@index([slug])` |
| Add column (NOT NULL, no default) | HIGH | No | `slug String` on existing table |
| Rename column | HIGH | No | Prisma creates DROP + ADD |
| Drop column | HIGH | No | Data loss |
| Change type | Medium | Maybe | `Int` -> `BigInt` |

---

## Safe Migration Workflow (Green Migrations)

For additive changes that are safe to auto-apply:

### Step 1: Make Schema Change (Dev)

```bash
# Edit schema in apps/web/prisma/schema.prisma
# Example: Adding a new table
model Skill {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  content     String
  createdAt   DateTime @default(now())
}
```

### Step 2: Create Migration

```bash
cd apps/web
pnpm prisma migrate dev --name add_skill_table
```

This:
- Creates SQL file in `prisma/migrations/`
- Applies migration to dev database
- Updates Prisma client

### Step 3: Test Locally

```bash
# Verify app works with new schema
pnpm dev
# Test affected features
```

### Step 4: Commit Migration Files

```bash
git add prisma/migrations/
git commit -m "feat: add Skill table for Session 3"
```

### Step 5: Push to Master

```bash
git push origin master
```

**Result**: Dokploy auto-deploys. The `docker-entrypoint.sh` runs `prisma migrate deploy` which applies the new migration.

---

## Risky Migration Workflow (Red/Yellow Migrations)

For changes that could fail on existing data:

### Problem Example

Adding `slug String @unique` (NOT NULL) to existing `AgentPersona` table:
- If table has rows without slug values, migration FAILS

### Solution: 3-Step Migration

**Step A: Add nullable column**

```prisma
model AgentPersona {
  // ...existing fields...
  slug String?  // nullable first
}
```

```bash
pnpm prisma migrate dev --name add_persona_slug_nullable
```

**Step B: Backfill data**

Edit the migration SQL file BEFORE pushing:

```sql
-- prisma/migrations/xxx_add_persona_slug_nullable/migration.sql
ALTER TABLE "AgentPersona" ADD COLUMN "slug" TEXT;

-- Backfill existing rows
UPDATE "AgentPersona"
SET "slug" = LOWER(REPLACE("name", ' ', '-'))
WHERE "slug" IS NULL;
```

**Step C: Make NOT NULL**

```prisma
model AgentPersona {
  // ...existing fields...
  slug String @unique  // now required
}
```

```bash
pnpm prisma migrate dev --name make_persona_slug_required
```

**Now safe to push to master.**

---

## Pre-Production Testing (Risky Migrations)

For high-risk migrations, test against a copy of production data:

### Step 1: Backup Production Database

```bash
pg_dump $PROD_DATABASE_URL > prod_backup_$(date +%Y%m%d).sql
```

### Step 2: Create Test Database

```bash
createdb projectpulse_migration_test
psql projectpulse_migration_test < prod_backup.sql
```

### Step 3: Test Migration

```bash
DATABASE_URL="postgresql://...migration_test" pnpm prisma migrate deploy
```

### Step 4: Verify Application

```bash
DATABASE_URL="postgresql://...migration_test" pnpm dev
# Test affected features manually
```

### Step 5: If Successful, Push to Master

---

## When Migration Fails in Production

### Symptoms

- Dokploy shows deployment failed
- Container won't start
- Logs show Prisma migration error

### Diagnosis

```bash
# Check Dokploy logs
dokploy logs projectpulse-web

# Or SSH and check container logs
docker logs projectpulse-prod-web
```

### Fix Options

**Option A: Fix and Re-push**

1. Fix the migration locally
2. Test against test database
3. Push fix to master
4. Dokploy re-deploys

**Option B: Manual Resolution**

If you manually fixed the database:

```bash
# Mark migration as applied (database already matches)
DATABASE_URL="$PROD_URL" pnpm prisma migrate resolve --applied <migration_name>
```

**Option C: Rollback to Previous Image**

In Dokploy dashboard:
1. Go to project > Web app
2. Deployments tab
3. Click "Rollback" on previous successful deployment

---

## Rollback Strategy

### For Additive Migrations (Added table/column)

**Recommended**: Leave the new column/table in place.
- Rollback code to previous version
- New column just won't be used
- No data loss, no additional migration needed

### For Destructive Migrations (Dropped/renamed)

**Options**:
1. Restore from backup
2. Write manual SQL to recreate
3. Create a new migration to add back

---

## Commands Reference

### Development

```bash
# Create and apply migration
pnpm prisma migrate dev --name <name>

# Create migration without applying
pnpm prisma migrate dev --create-only

# Reset database (DEVELOPMENT ONLY!)
pnpm prisma migrate reset

# View migration status
pnpm prisma migrate status
```

### Production

```bash
# Apply pending migrations (used in docker-entrypoint.sh)
pnpm prisma migrate deploy

# Check migration status
pnpm prisma migrate status

# Mark migration as applied (after manual fix)
pnpm prisma migrate resolve --applied <migration_name>

# Mark migration as rolled back
pnpm prisma migrate resolve --rolled-back <migration_name>
```

---

## Best Practices

### DO

- Keep migrations additive whenever possible
- Test risky migrations against prod-like data
- Commit migration files to git
- Use meaningful migration names (`add_skill_table`, not `migration1`)
- Backfill data in migration SQL for NOT NULL columns

### DON'T

- Run `migrate reset` in production (drops all data!)
- Rename columns directly (use add + migrate + deprecate pattern)
- Skip testing for schema changes that affect existing data
- Edit migration files after they've been applied to prod

---

## Troubleshooting

### "Migration failed to apply cleanly"

- Check if database was modified manually outside Prisma
- Use `prisma migrate resolve` to sync state

### "Drift detected"

- Schema in database doesn't match expected state
- Run `prisma migrate diff` to see differences
- May need to create baseline migration

### "Cannot drop column - it has dependent objects"

- Check for indexes, foreign keys, or views using the column
- Drop dependents first, or cascade

---

## See Also

- [Dokploy Setup Guide](.agent/sops/dokploy-setup.md)
- [Dev to Prod Deployment SOP](.agent/sops/dev-to-prod-deployment.md)
- [Prisma Migration Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
