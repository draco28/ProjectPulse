---
name: moksha-database-connection
description: Quick fixes for Prisma/PostgreSQL connection issues. Use when encountering database errors, connection refused, or Prisma client errors.
triggers:
  [
    'prisma error',
    'database connection',
    'ECONNREFUSED',
    'database pool',
    'prisma client',
    'connection timeout',
    'postgres error',
  ]
token_estimate: 180
last_updated: 2025-10-26
related_docs:
  - ../../.agent/system/mcp-tools-guide.md
---

# Database Connection Quick Fix

## Common Errors

**Error 1**: `Error: P1001: Can't reach database server`
**Error 2**: `ECONNREFUSED`
**Error 3**: `PrismaClientInitializationError`
**Error 4**: `Connection pool timeout`

## Quick Diagnosis

**Step 1: Check Docker**

```bash
docker ps
# Should show: postgres:16-alpine container RUNNING
```

**If not running:**

```bash
docker-compose up -d postgres
# Wait 5 seconds for startup
```

**Step 2: Verify DATABASE_URL**

```bash
# Check .env file
cat .env | grep DATABASE_URL

# Should be:
# DATABASE_URL="postgresql://postgres:devhub2025@localhost:5432/moksha_devhub"
```

**Step 3: Test connection**

```bash
# Using psql
psql -h localhost -U postgres -d moksha_devhub
# Enter password: devhub2025

# Or using Prisma
pnpm prisma db push
```

## Common Fixes

### Fix 1: Restart PostgreSQL

```bash
docker-compose restart postgres
# Wait 5-10 seconds
pnpm prisma generate
```

### Fix 2: Regenerate Prisma Client

```bash
pnpm prisma generate
# Clears cache and regenerates client
```

### Fix 3: Reset Connection Pool

```bash
# Kill dev server
# Restart:
pnpm dev
```

### Fix 4: Check for Port Conflicts

```bash
# Check if port 5432 is in use
netstat -ano | findstr :5432   # Windows
lsof -i :5432                  # Mac/Linux

# If another process using 5432:
# Stop it or change PostgreSQL port in docker-compose.yml
```

## PrismaClient Singleton Pattern

**Correct pattern** (prevents connection pool exhaustion):

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Import from lib/db.ts everywhere**, not creating new instances!

## Connection Pool Settings

**In schema.prisma:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Optional: Adjust pool size
  // connection_limit = 10
}
```

## Troubleshooting Checklist

- [ ] Docker container running (`docker ps`)
- [ ] DATABASE_URL correct in .env
- [ ] Port 5432 not blocked
- [ ] Prisma client regenerated
- [ ] PrismaClient singleton pattern used
- [ ] No connection pool exhaustion

## Advanced: Using MCP Tool

**If still failing**, use postgres MCP tool to test:

```typescript
// Via Claude Code MCP
mcp__postgres__query({ sql: 'SELECT 1;' });
// Should return: [{ "?column?": 1 }]
```

**See**: [.agent/system/mcp-tools-guide.md](../../.agent/system/mcp-tools-guide.md#postgres-mcp)

---

**Token Cost**: ~180 tokens
**When to Load**: Database errors, Prisma issues, connection problems
