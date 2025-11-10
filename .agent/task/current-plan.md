# Implementation Plan: Wiki List & Detail UI (US-016, US-017)

**Created**: 2025-11-10 16:45 IST
**Sprint**: Sprint 2 Week 3 Day 2
**User Stories**: US-016 (5 points), US-017 (5 points)
**Total Points**: 10 points

---

## Overview

Implement wiki list and detail pages leveraging existing UI-first architecture (Week 1.5) with neumorphic coral theme. The wiki detail page already exists and works well - we need to create the list page and enhance both for consistency.

**Key Insight**: We can reuse 60-70% of the existing issues list page pattern for the wiki list page.

---

## Success Criteria

### US-016: Wiki List Page (5 points)

- [ ] Create `/wiki/page.tsx` (list page) with Server Component
- [ ] Category filtering (getting-started, guides, reference, troubleshooting)
- [ ] Search functionality (title + content search)
- [ ] Grid or list view with wiki page cards
- [ ] Pagination (10 items per page)
- [ ] Sorting (newest, oldest, title A-Z)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Uses neumorphic theme from existing pages

### US-017: Wiki Detail Page (5 points)

- [ ] Enhance existing `/wiki/[slug]/page.tsx`
- [ ] Verify markdown rendering works
- [ ] Verify TOC (table of contents) works
- [ ] Verify related pages sidebar works
- [ ] Add breadcrumb navigation
- [ ] Add "Edit" button placeholder (future feature)
- [ ] Responsive design verification

---

## Implementation Steps

### Step 1: Create Wiki List Page (US-016)

**File**: `apps/web/app/wiki/page.tsx`

**Pattern to Follow**: `apps/web/app/issues/page.tsx` (existing list page)

**Component Structure**:
- Server Component with async data fetching
- URL search params for filters (category, search, sort, page)
- Prisma query with where clauses
- Pagination support
- Search across title and content

### Step 2: Create WikiCard Component

**File**: `apps/web/components/wiki/WikiCard.tsx`
- Neumorphic card (neu-raised class)
- Title, excerpt, category badge, timestamp
- Click → navigate to wiki detail

### Step 3: Create CategoryFilter Component

**File**: `apps/web/components/wiki/CategoryFilter.tsx`
- Horizontal scrollable chips
- Category counts with toggle selection

### Step 4: Enhance Wiki Detail Page (US-017)

**File**: `apps/web/app/wiki/[slug]/page.tsx` (already exists)
- Add breadcrumb navigation
- Add "Edit" button placeholder
- Verify all existing functionality

### Step 5: Create WikiListClient

**File**: `apps/web/components/wiki/WikiListClient.tsx`
- Handle client-side interactions
- Update URL search params

---

## File Structure

```
apps/web/
├── app/wiki/
│   ├── page.tsx              [NEW] List page
│   └── [slug]/page.tsx       [ENHANCE] Detail page
├── components/wiki/
│   ├── WikiCard.tsx          [NEW]
│   ├── CategoryFilter.tsx    [NEW]
│   ├── WikiListClient.tsx    [NEW]
│   ├── WikiSidebar.tsx       [EXISTS]
│   ├── WikiContent.tsx       [EXISTS]
│   └── CodeBlock.tsx         [EXISTS]
```

---

## Dependencies

- ✅ WikiPage model exists
- ✅ 7 seed pages in database
- ✅ Existing wiki components
- ✅ Neumorphic theme CSS
- ✅ Issues list pattern to follow

**No blockers!** Ready to implement.

---

## Estimated Effort

- Create list page: ~2 hours
- Create components: ~2 hours
- Enhance detail page: ~1 hour
- Testing: ~1 hour
- **Total**: ~6 hours (within 10 points)

---

**Created**: 2025-11-10 16:45 IST
