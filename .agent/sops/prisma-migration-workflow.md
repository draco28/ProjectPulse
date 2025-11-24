# Prisma Migration Workflow SOP

**Version**: 1.0
**Created**: 2025-11-25
**Status**: Active

---

## Overview

This SOP documents the proper Prisma migration workflow for ProjectPulse. Following this workflow ensures schema changes are tracked, reproducible, and deployable across environments.

## Golden Rules

1. **NEVER use `db push` in development** - Use `migrate dev` instead
2. **ALWAYS use migrations** - Schema changes must be tracked in migration files
3. **Shadow DB validates everything** - If `migrate dev` succeeds, production deploy will too

## Commands Reference

| Command | Use Case | Environment |
|---------|----------|-------------|
| `pnpm db:migrate:dev` | Create new migration | Development |
| `pnpm db:migrate:deploy` | Apply pending migrations | Production/CI |
| `pnpm db:migrate:status` | Check migration state | Any |
| `pnpm db:push:DANGER` | Emergency only (breaks tracking) | Never in normal workflow |

## Daily Workflow

### Making Schema Changes

```bash
# 1. Edit schema.prisma with your changes

# 2. Create migration (runs shadow DB validation)
DATABASE_URL="postgresql://..." pnpm db:migrate:dev --name add_user_preferences

# 3. Review generated migration SQL
cat apps/web/prisma/migrations/[timestamp]_add_user_preferences/migration.sql

# 4. Commit migration with code changes
git add apps/web/prisma/
git commit -m "feat: add user preferences table"
```

### Checking Migration Status

```bash
DATABASE_URL="postgresql://..." pnpm db:migrate:status
# Should show: "Database schema is up to date!"
```

### Deploying to Production

```bash
# CI/CD pipeline or manual deploy
DATABASE_URL="postgresql://..." pnpm db:migrate:deploy
```

## Troubleshooting

### "Migration failed to apply to shadow database"

**Cause**: Migration SQL is invalid or missing extensions.

**Fix**:
1. Check for missing `CREATE EXTENSION` statements
2. Verify enum types exist before using them
3. Run `prisma migrate diff --from-empty --to-schema-datamodel=./prisma/schema.prisma --script` to see full schema

### "Schema drift detected"

**Cause**: Someone used `db push` instead of migrations.

**Fix**:
1. Run `prisma migrate diff --from-schema-datasource=./prisma/schema.prisma --to-schema-datamodel=./prisma/schema.prisma --script`
2. If empty → schema is in sync, just mark migrations as applied
3. If not empty → create migration to capture drift

### "Migration checksum mismatch"

**Cause**: Migration file was modified after applying.

**Fix**:
```bash
# Remove old record and re-resolve
DATABASE_URL="..." npx prisma db execute --stdin <<< "DELETE FROM _prisma_migrations WHERE migration_name = 'migration_name';"
DATABASE_URL="..." npx prisma migrate resolve --applied "migration_name"
```

## Why Not `db push`?

| Aspect | `migrate dev` | `db push` |
|--------|---------------|-----------|
| Tracks history | Yes | No |
| Reproducible | Yes | No |
| Shadow DB validation | Yes | No |
| Safe for production | Yes | **NO** |
| Team collaboration | Yes | No |

**db push is destructive** - it can drop columns/tables without warning. Use only for prototyping throw-away databases.

## Baseline Migration

The baseline migration `20251125020700_full_baseline` contains:
- All 56+ database tables
- All enums (Status, WikiEventType, etc.)
- All indexes and constraints
- Required extensions (pgvector)

**Do not modify** this migration unless absolutely necessary.

## Emergency Procedures

### If production database is corrupted

1. **Do NOT run `migrate dev`** on production
2. Use `migrate deploy` only
3. If needed, use `migrate resolve --rolled-back "migration_name"` to mark failed migration

### If migration history is lost

```bash
# Mark all migrations as applied (existing database)
DATABASE_URL="..." npx prisma migrate resolve --applied "migration_name"
```

---

## Related Documentation

- [Prisma Migration Docs](https://www.prisma.io/docs/orm/prisma-migrate)
- [Schema Reference](../system/database-schema.md)
- [Architecture Overview](../../docs/03-Architecture.md)
