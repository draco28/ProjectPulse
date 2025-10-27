# Database Schema Reference

**Generated:** 2025-10-26
**Database:** PostgreSQL 16
**Prisma Version:** 5.x
**Status:** Minimal schema (Theme system only - full schema pending Week 1 Day 2)

---

## Quick Index

### Models

- [UserPreferences](#userpreferences) - User theme and UI preferences

### Enums

_(No enums defined yet)_

### Database Features

- Full-text search (preview feature enabled)
- Full-text indexes (preview feature enabled)

---

## Models

### UserPreferences

**Table:** `user_preferences`
**Purpose:** Stores user theme preferences and UI settings

#### Fields

| Field              | Type       | Constraints           | Default    | Description                           |
| ------------------ | ---------- | --------------------- | ---------- | ------------------------------------- |
| `id`               | `Int`      | `@id`, auto-increment | -          | Primary key                           |
| `userId`           | `Int?`     | `@unique`, nullable   | -          | Foreign key to User (when auth added) |
| `theme`            | `String`   | -                     | `"desert"` | Current theme selection               |
| `sidebarCollapsed` | `Boolean`  | -                     | `false`    | Sidebar state preference              |
| `compactMode`      | `Boolean`  | -                     | `false`    | Compact UI mode preference            |
| `createdAt`        | `DateTime` | -                     | `now()`    | Record creation timestamp             |
| `updatedAt`        | `DateTime` | `@updatedAt`          | -          | Last update timestamp                 |

#### Relations

- **userId** → `User` (pending implementation)

#### Indexes

- `@@index([userId])` - User lookup optimization
- `@@index([theme])` - Theme-based queries

#### Constraints

- `userId` is unique when present (one preference record per user)

#### Valid Theme Values

- `"desert"` - Desert theme (warm earth tones)
- `"neon"` - Neon theme (vibrant colors)
- `"earthy"` - Earthy theme (natural greens/browns)
- `"coral"` - Coral theme (ocean-inspired)

---

## Enums

_(No enums currently defined - will be added with full schema)_

---

## Database Features

### Preview Features Enabled

**Full-text Search**

```prisma
previewFeatures = ["fullTextSearch"]
```

- Enables PostgreSQL `tsvector` and `tsquery` operations
- Required for Issue/Knowledge search (future)

**Full-text Indexes**

```prisma
previewFeatures = ["fullTextIndex"]
```

- Enables `@@fulltext` index creation
- Optimizes search performance

### PostgreSQL Version

- **Required:** PostgreSQL 16
- **Extensions:** _(None currently - pgvector will be added for hybrid search)_

---

## Common Queries

### User Preferences

**Get user's theme preferences**

```typescript
const prefs = await prisma.userPreferences.findUnique({
  where: { userId: 123 },
});
```

**Create default preferences**

```typescript
const prefs = await prisma.userPreferences.create({
  data: {
    userId: 123,
    theme: 'desert',
  },
});
```

**Update theme**

```typescript
const updated = await prisma.userPreferences.update({
  where: { userId: 123 },
  data: { theme: 'neon' },
});
```

**Get all users with specific theme**

```typescript
const users = await prisma.userPreferences.findMany({
  where: { theme: 'coral' },
});
```

---

## Schema Evolution

### Current State (2025-10-26)

- ✅ UserPreferences model (theme system support)
- ⏳ Full schema implementation pending (Week 1 Day 2)

### Planned Models (Week 1 Day 2)

Based on project requirements, the following models will be added:

- **User** - Authentication and user management
- **Issue** - Issue tracking with full-text search
- **Comment** - Issue comments
- **KnowledgeItem** - Knowledge base entries
- **Tag** - Tagging system
- **Activity** - Activity logs
- **Notification** - User notifications
- **Project** - Project management (optional)

### Migration Strategy

1. **Phase 1 (Current):** Theme system only
2. **Phase 2 (Week 1 Day 2):** Core models (User, Issue, Comment, KnowledgeItem)
3. **Phase 3 (Future):** Advanced features (Projects, Teams, Advanced search)

---

## Maintenance Notes

### Database Migrations

**Generate migration**

```bash
pnpm prisma migrate dev --name description
```

**Apply migrations (production)**

```bash
pnpm prisma migrate deploy
```

**Reset database (dev only)**

```bash
pnpm prisma migrate reset
```

### Client Generation

**After schema changes**

```bash
pnpm prisma generate
```

**Type-check integration**

```bash
pnpm tsc --noEmit
```

### Index Optimization

**Current indexes:**

- `user_preferences.userId` - User lookup
- `user_preferences.theme` - Theme filtering

**Future indexes (planned):**

- Full-text search indexes on Issue.title, Issue.description
- Full-text search indexes on KnowledgeItem content
- pgvector indexes for semantic search

### Performance Considerations

**Connection Pooling**

```env
# Recommended for Vercel/serverless
DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=20"
```

**Query Optimization**

- Use `select` to limit returned fields
- Use `include` judiciously (N+1 problem)
- Leverage indexes for frequent queries

---

## Database Conventions

### Naming Conventions

- **Tables:** `snake_case` (via `@@map`)
- **Models:** `PascalCase`
- **Fields:** `camelCase`
- **Relations:** `camelCase`

### Timestamp Patterns

All models include:

- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### ID Strategy

- **Primary keys:** Auto-incrementing integers
- **Future consideration:** UUIDs for distributed systems (if needed)

### Soft Deletes

_(Not currently implemented - will be added if needed)_

Planned pattern:

```prisma
deletedAt DateTime?
@@index([deletedAt])
```

---

## Quick Reference Card

### Connection String Format

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

### Environment Variables

```env
DATABASE_URL="postgresql://..."
```

### Essential Commands

```bash
# Development
pnpm prisma migrate dev          # Create and apply migration
pnpm prisma studio              # Open Prisma Studio GUI
pnpm prisma generate            # Regenerate client

# Production
pnpm prisma migrate deploy      # Apply migrations
pnpm prisma db push            # Quick schema sync (dev only)

# Utilities
pnpm prisma validate           # Validate schema
pnpm prisma format             # Format schema file
pnpm prisma db seed            # Run seed script
```

### Type Safety

```typescript
import { PrismaClient, UserPreferences } from '@prisma/client';
import type { Prisma } from '@prisma/client';

// Type-safe queries
type UserPrefsWithRelations = Prisma.UserPreferencesGetPayload<{
  include: { user: true };
}>;
```

---

## Troubleshooting

### Common Issues

**"Migration failed" errors**

- Check PostgreSQL version (must be 16+)
- Verify database permissions
- Check connection string format

**Type errors after schema changes**

- Run `pnpm prisma generate`
- Restart TypeScript server
- Clear `.next` cache if needed

**Slow queries**

- Add indexes for frequently queried fields
- Use `EXPLAIN ANALYZE` in PostgreSQL
- Consider materialized views for complex queries

**Connection pool exhaustion**

- Adjust `connection_limit` in DATABASE_URL
- Ensure proper client cleanup
- Use single PrismaClient instance (see lib/prisma.ts)

---

## Resources

### Documentation

- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL 16 Docs](https://www.postgresql.org/docs/16/)
- [Full-text Search Guide](https://www.prisma.io/docs/concepts/components/prisma-client/full-text-search)

### Project Documentation

- Architecture: `docs/01-ARCHITECTURE.md`
- Database Design: `docs/03-DATABASE_DESIGN.md` (when created)
- API Patterns: `.claude/skills/backend/api-design-patterns.md`

### Tools

- [Prisma Studio](https://www.prisma.io/studio) - GUI for database
- [pgAdmin](https://www.pgadmin.org/) - PostgreSQL admin
- [TablePlus](https://tableplus.com/) - Database client

---

**Last Updated:** 2025-10-26
**Schema Status:** Minimal (Theme system only)
**Next Update:** Week 1 Day 2 (Full schema implementation)

**See also**: [STATUS.md](../../STATUS.md) for current project status
