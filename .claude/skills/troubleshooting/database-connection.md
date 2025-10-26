---
name: database-connection
description: Fix Prisma and PostgreSQL connection issues
category: troubleshooting
tokens: 180
triggers:
  - prisma error
  - database connection
  - ECONNREFUSED
  - connection timeout
  - prisma client
  - database not found
related_docs:
  - ../../.agent/system/database-schema.md
---

# Database Connection Quick Fix

## Common Issues & Fixes

### 1. ECONNREFUSED - Database Not Running

```bash
# Check Docker container
docker ps | grep postgres

# If not running, start it
docker-compose up -d db
# or
pnpm docker:up
```

### 2. DATABASE_URL Not Set

```bash
# Check .env.local has DATABASE_URL
cat .env.local | grep DATABASE_URL

# Should be:
# DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### 3. Prisma Client Not Generated

```bash
# Generate Prisma client
pnpm prisma generate

# Then restart dev server
pnpm dev
```

### 4. Connection String Format Wrong

```bash
# Correct format:
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE

# Example:
postgresql://moksha:password123@localhost:5432/moksha_devhub
```

### 5. Migrations Not Applied

```bash
# Apply migrations
pnpm prisma migrate dev

# Or reset database (WARNING: deletes data)
pnpm prisma migrate reset
```

## Quick Diagnostic

```bash
# Test connection
pnpm prisma db pull

# ✅ Success: Connected to database
# ❌ Error: Check above issues
```

## Related

[Database Schema](../../.agent/system/database-schema.md)
