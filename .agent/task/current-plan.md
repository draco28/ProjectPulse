# Implementation Plan: Wiki Detail Page Enhancement

**User Story**: US-019 - Wiki Detail Page (5 points)
**Session**: 2025-11-10 14:30
**Goal**: Enhance wiki detail page to match mockup design with contributors, stats, navigation

## Overview

Transform the basic wiki detail page into a fully-featured documentation page with:
- Enhanced article header with metadata
- Contributors section
- Page statistics
- Category-based quick navigation
- Previous/next page navigation
- Feedback mechanism
- Enhanced code block styling

## Phase Breakdown

### Phase 1: Database Schema Updates (1 point, ~1 hour)

**Tasks**:
1. Update Prisma schema with new fields:
   ```prisma
   model WikiPage {
     // ... existing fields
     views        Int      @default(0)
     revisions    Int      @default(1)
     contributors Json?    // Array of { name, avatar, editCount }
   }
   ```
2. Generate migration: `npx prisma migrate dev --name add_wiki_metadata`
3. Seed example data with contributors

**Files**:
- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/`
- `packages/database/prisma/seed.ts`

**Success Criteria**:
- [ ] Migration runs successfully
- [ ] Fields visible in Prisma Studio
- [ ] Seed data includes contributors

---

### Phase 2: Enhanced Components (2 points, ~2 hours)

#### 2A: WikiHeader Component

**Purpose**: Article header with metadata, contributors, tags

**Props**:
```typescript
interface WikiHeaderProps {
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  contributors: Array<{ name: string; avatar?: string; editCount: number }>;
  updatedAt: string;
  views: number;
  path: string;
}
```

**Features**:
- Title + description
- Primary contributor avatar + name + "Updated by..."
- Last updated timestamp + views count
- Category tags (coral gradient for category, neu-raised for tags)
- Edit button (links to `/wiki/[slug]/edit`)

**Files**:
- `apps/web/components/wiki/WikiHeader.tsx`

#### 2B: WikiContributors Component

**Purpose**: Right sidebar with contributors, stats, feedback

**Props**:
```typescript
interface WikiContributorsProps {
  contributors: Array<{ name: string; avatar?: string; editCount: number }>;
  views: number;
  revisions: number;
}
```

**Features**:
- Contributors list (sorted by editCount desc)
- Page stats card (views, revisions)
- "Was this helpful?" feedback card (UI only, no backend)

**Files**:
- `apps/web/components/wiki/WikiContributors.tsx`

#### 2C: EnhancedCodeBlock Component

**Purpose**: Code block with language label and copy button

**Features**:
- Language indicator (top-left)
- Copy button (top-right) with success animation
- Syntax highlighting (via existing WikiContent)

**Files**:
- Update existing `apps/web/components/wiki/CodeBlock.tsx`

**Success Criteria**:
- [ ] WikiHeader displays all metadata correctly
- [ ] Contributors section shows avatars and edit counts
- [ ] Page stats display correctly
- [ ] Feedback buttons render (no functionality yet)
- [ ] Code blocks have copy button

---

### Phase 3: Quick Navigation (1 point, ~1 hour)

**Purpose**: Left sidebar with category-based navigation

**Tasks**:
1. Update WikiSidebar to accept category navigation
2. Fetch category list with page counts
3. Highlight active category
4. Add search input (use existing WikiSearchBar logic)

**Props**:
```typescript
interface QuickNavigationProps {
  categories: Array<{ name: string; icon: string; count: number }>;
  currentCategory?: string;
}
```

**Features**:
- Category list with icons and counts
- Active state for current page's category
- Hover effects (slide-in, background change)
- Search input at top

**Files**:
- Update `apps/web/components/wiki/WikiSidebar.tsx` or create new component
- Update `apps/web/app/wiki/[slug]/page.tsx` to pass category data

**Success Criteria**:
- [ ] Categories display in left sidebar
- [ ] Current category highlighted
- [ ] Hover effects smooth
- [ ] Search input functional

---

### Phase 4: Footer Navigation (0.5 points, ~30 min)

**Purpose**: Previous/next page navigation

**Tasks**:
1. Create server-side function to fetch prev/next pages
2. Query WikiPage ordered by category + title
3. Create WikiFooterNav component

**Logic**:
```typescript
async function getAdjacentPages(currentId: number, category: string) {
  const prevPage = await prisma.wikiPage.findFirst({
    where: { category, id: { lt: currentId } },
    orderBy: { id: 'desc' },
    select: { id: true, title: true, path: true }
  });

  const nextPage = await prisma.wikiPage.findFirst({
    where: { category, id: { gt: currentId } },
    orderBy: { id: 'asc' },
    select: { id: true, title: true, path: true }
  });

  return { prevPage, nextPage };
}
```

**Files**:
- `apps/web/components/wiki/WikiFooterNav.tsx`
- Update `apps/web/app/wiki/[slug]/page.tsx`

**Success Criteria**:
- [ ] Previous page link works
- [ ] Next page link works
- [ ] Handles first/last page gracefully
- [ ] Hover effects applied

---

### Phase 5: Polish & Testing (0.5 points, ~30 min)

**Tasks**:
1. Verify all components render correctly
2. Test responsiveness (desktop, tablet, mobile)
3. Test accessibility (ARIA labels, keyboard navigation)
4. Run TypeScript checks: `pnpm type-check`
5. Test on Mac mini: http://192.168.1.15:3000/wiki/quick-start
6. Update documentation

**Success Criteria**:
- [ ] Zero TypeScript errors
- [ ] All features functional
- [ ] Responsive on all screen sizes
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Documentation updated

---

## Technical Decisions

### Server Components vs Client Components

**Server Components** (default):
- `/wiki/[slug]/page.tsx` - Fetch page data, pass to components
- WikiHeader - Static content
- WikiFooterNav - Static links

**Client Components** (interactive):
- WikiContributors - Feedback buttons (future)
- CodeBlock - Copy button
- QuickNavigation - Search input (if interactive)

### Data Fetching Strategy

**ISR (Incremental Static Regeneration)**:
- Revalidate: 3600s (1 hour)
- Static params: Top 50 pages
- On-demand: Rest generated at runtime

**Parallel Queries**:
```typescript
const [page, categoryStats, adjacentPages] = await Promise.all([
  getWikiPage(slug),
  getCategoryStats(),
  getAdjacentPages(currentId, category)
]);
```

### Styling Approach

**Follow Existing Patterns**:
- `.neu-raised` - Cards and buttons
- `.coral-gradient` - Primary actions and highlights
- `.smooth-transition` - All hover effects
- Tailwind classes for layout

---

## Dependencies

**Blocked By**:
- None (all prerequisites complete)

**Blocks**:
- None (this is final wiki feature)

---

## Testing Plan

**Manual Testing**:
1. Navigate to http://192.168.1.15:3000/wiki/quick-start
2. Verify header shows contributors, views, tags
3. Check right sidebar shows contributors and stats
4. Verify left sidebar shows category navigation
5. Test footer navigation (prev/next links)
6. Test code block copy button
7. Test responsive layout

**Automated Testing**:
- Component tests for WikiHeader, WikiContributors
- Integration test for wiki detail page rendering
- Accessibility audit with axe-core

---

## Rollout Plan

**Commit Strategy**:
1. Commit 1: Database schema migration
2. Commit 2: WikiHeader + WikiContributors components
3. Commit 3: Quick navigation + footer navigation
4. Commit 4: Testing + documentation

**Documentation Updates**:
- Update `.agent/progress.md` - Mark Day 4 complete
- Update `docs/13-Project-Plan.md` - Sprint 2 Week 3 progress
- Optional: Create completion doc for wiki system

---

## Estimated Timeline

| Phase | Estimated Time | Actual Time |
|-------|---------------|-------------|
| Phase 1: Database | 1 hour | - |
| Phase 2: Components | 2 hours | - |
| Phase 3: Navigation | 1 hour | - |
| Phase 4: Footer | 30 min | - |
| Phase 5: Testing | 30 min | - |
| **TOTAL** | **5 hours** | - |

**Target Completion**: 2025-11-10 EOD

---

## Risks & Mitigations

**Risk 1**: Migration fails on Mac mini
- **Mitigation**: Test migration on Windows first, then deploy to Mac mini

**Risk 2**: Contributors JSON field complex to manage
- **Mitigation**: Use simple structure: `[{ name, avatar, editCount }]`

**Risk 3**: Category navigation too complex
- **Mitigation**: Start with simple list, enhance later if needed
