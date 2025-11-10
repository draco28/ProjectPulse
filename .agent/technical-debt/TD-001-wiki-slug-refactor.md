# Technical Debt: Wiki Slug Refactoring

**ID**: TD-001
**Created**: 2025-11-10
**Priority**: Medium
**Effort**: 3 story points (~4-6 hours)
**Status**: Backlog

---

## Problem

Current WikiPage schema uses `path` field for both URL routing AND hierarchical structure, which conflates two concerns:
- **URL identifier** (should be immutable, SEO-friendly)
- **Hierarchical location** (can change if parent changes)

**Current schema**:
```prisma
model WikiPage {
  path String @unique  // "/getting-started" or "/guides/api-setup"
}
```

**Issues**:
1. Leading slash in path causes URL issues: `/wiki//getting-started`
2. If page moves in hierarchy, URL breaks (no redirect)
3. Non-standard approach (most CMS use `slug` + `parentId`)

---

## Proposed Solution

Add separate `slug` field for URL routing:

```prisma
model WikiPage {
  slug String @unique  // "getting-started" (immutable, URL-safe)
  path String @unique  // "/guides/api-setup" (hierarchical, can change)
  parentPath String?   // "/guides" (for hierarchy)
}
```

**Benefits**:
- Clean URLs: `/wiki/getting-started` (no double slash)
- URL stability: Moving page in hierarchy doesn't break links
- SEO-friendly: Slugs are standard (WordPress, Contentful pattern)
- Redirects: Old path → new path, slug stays stable

---

## Current Workaround (Sprint 2 Day 3)

**Normalization approach** implemented to unblock Sprint 2:
- Keep `path` as unique identifier
- Normalize paths: Remove leading slash in validation
- Handle both `/wiki/path` and `/wiki//path` in routes
- Generate path from title (slug-like behavior)

**Files affected by workaround**:
- `lib/validations/wiki.ts` - Path normalization in Zod schemas
- `components/wiki/WikiEditor.tsx` - Auto-generate path (not slug)
- `app/wiki/[slug]/edit/page.tsx` - Uses path param (confusing naming)
- `app/api/wiki/route.ts` - Path-based lookups
- `app/api/wiki/[slug]/route.ts` - Path param (naming inconsistency)

---

## Refactoring Plan (Future Sprint)

### Step 1: Schema Migration
```prisma
// Add slug field (non-breaking)
model WikiPage {
  slug String? @unique  // Make optional initially
  path String @unique   // Keep existing
}
```

**Migration**:
```sql
-- Add slug column
ALTER TABLE "WikiPage" ADD COLUMN "slug" TEXT;

-- Populate slug from existing paths
UPDATE "WikiPage"
SET "slug" = TRIM(BOTH '/' FROM "path");

-- Make slug required and unique
ALTER TABLE "WikiPage" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "WikiPage_slug_key" ON "WikiPage"("slug");
```

### Step 2: Update Code (Breaking Changes)
1. Update Zod schemas: `slug` field (immutable), `parentPath` field (hierarchy)
2. Update WikiEditor: Generate slug from title (keep path for hierarchy)
3. Update routes: `/wiki/[slug]` uses slug field, not path
4. Update API: Lookup by slug, not path
5. Update seed data: Add slug field to all 7 pages

### Step 3: Data Migration
```typescript
// Migrate existing pages
const pages = await prisma.wikiPage.findMany();
for (const page of pages) {
  const slug = page.path.replace(/^\//, '').replace(/\//g, '-'); // "/guides/api-setup" → "guides-api-setup"
  await prisma.wikiPage.update({
    where: { id: page.id },
    data: { slug },
  });
}
```

### Step 4: Deprecate Path for Routing
- Keep `path` for hierarchy display (breadcrumbs)
- Use `slug` for all URL routing
- Add redirects: Old `/wiki//path` → New `/wiki/slug`

---

## Breaking Changes

**Routes**:
- Old: `/wiki/[slug]/page.tsx` (uses path param)
- New: `/wiki/[slug]/page.tsx` (uses actual slug field)

**API**:
- Old: `GET /api/wiki/:path` (path-based lookup)
- New: `GET /api/wiki/:slug` (slug-based lookup)

**URLs**:
- Old: `/wiki/getting-started` (works but confusing)
- New: `/wiki/getting-started` (same URL, different field)

---

## Testing Requirements

1. ✅ Existing pages still accessible after migration
2. ✅ Slug uniqueness enforced
3. ✅ URL redirects work (old paths → slugs)
4. ✅ Hierarchy still works (path field for breadcrumbs)
5. ✅ MCP tools use slug (not path)

---

## Acceptance Criteria

- [ ] WikiPage schema has `slug` field (unique, non-null)
- [ ] All 7 seed pages have valid slugs
- [ ] `/wiki/[slug]` routes use slug field (not path)
- [ ] API endpoints use slug parameter
- [ ] Path field used only for hierarchy (breadcrumbs, parent/child)
- [ ] Zero breaking changes for existing URLs
- [ ] MCP tools refactored to use slug
- [ ] Documentation updated (openapi.yaml, README)

---

## Related Issues

- US-018: Wiki Editor UI (current sprint - workaround implemented)
- US-020: wiki.create MCP tool (will use path for now)
- US-021: wiki.search MCP tool (will use path for now)
- US-022: wiki.update MCP tool (will use path for now)

---

## Notes

**Why not do this now?**
- Sprint 2 Day 3 already at 103K/200K tokens (51% budget used)
- Schema migration + code refactor = ~15K tokens
- Would delay MCP tools implementation (higher priority)
- Normalization workaround is sufficient for MVP

**When to refactor?**
- Sprint 3 or Sprint 4 (when hierarchy feature is planned)
- Post-MVP cleanup sprint
- When URL stability becomes critical (production launch)

---

**Created**: 2025-11-10 20:20 IST
**Logged by**: Claude Code (Sprint 2 Day 3)
**Discovere during**: Step 4 checkpoint (schema verification)
