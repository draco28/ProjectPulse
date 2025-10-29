# Current Implementation Plan - Week 1.5 Phase 3 Day 5

**Created**: 2025-10-29 21:54
**Task**: Issue Detail Page Implementation
**Estimated Duration**: 6-8 hours

---

## Overview

Transform the Issue Detail page using the neumorphic coral theme mockup, implementing a full-featured issue view with comments, attachments, status management, and related content.

**Scope**: Create dynamic route `app/issues/[id]/page.tsx` with 12 components (7 new, 5 existing from Day 4).

---

## Phase Breakdown

### Phase 1: API Foundation (30 min)

**Goal**: Create GET /api/issues/[id] endpoint with full relation support

**Tasks**:

1. Create `app/api/issues/[id]/route.ts` - GET endpoint
2. Add Zod schema for issue detail response validation
3. Implement Prisma query with optimized includes:
   - comments (with author)
   - attachments
   - labels
   - project
   - assignedTo
   - linkedCommits
4. Error handling (404 for not found, 400 for invalid ID, 500 for server errors)
5. Unit tests: Success response, 404, 400, relation includes

**Success Criteria**:

- ✅ GET /api/issues/42 returns full issue with relations
- ✅ All tests passing
- ✅ TypeScript 0 errors

---

### Phase 2: Server Component Layout (60 min)

**Goal**: Build main page layout with 6 server components

**Tasks**:

1. Create `app/issues/[id]/page.tsx` - Main Server Component
2. Fetch issue data with parallel queries (issue + breadcrumb data)
3. Build **IssueHeader** component:
   - Issue number badge
   - Title (h2)
   - Status/Priority/Module badges
   - Assignee display
   - Timestamps (created, updated, closed)
4. Build **SystemActivity** component:
   - Timeline of PR links, status changes, commits
   - Activity type icons and formatting
5. Build **CodeSection** component:
   - Syntax highlighting for code blocks
   - Copy button (Client Component child)
6. Build **WatchersSection** component:
   - Avatar stack display
7. Build **RelatedIssues** component:
   - Linked issues list with type badges

**Success Criteria**:

- ✅ Page loads at `/issues/42`
- ✅ All server components render with Prisma data
- ✅ No client-side JavaScript for static sections

---

### Phase 3: Client Components & Interactivity (45 min)

**Goal**: Add interactive features and wire up existing components

**Tasks**:

1. Build **IssueActions** component:
   - Status change buttons (Open → In Progress → Closed)
   - Calls PATCH /api/issues/[id]/status
   - Loading states during API calls
   - Success/error toasts
2. Build **DescriptionSection** component:
   - Markdown rendering with react-markdown
   - Edit mode toggle (future enhancement placeholder)
3. Build **QuickActions** component:
   - Watch button (toggle state)
   - Copy Link button (clipboard API)
   - Create Branch button (navigation)
4. Wire up existing Day 4 components:
   - Import CommentList, CommentForm
   - Import AttachmentList
   - Import IssueDetailSidebar

**Success Criteria**:

- ✅ Status changes work with optimistic UI updates
- ✅ Comments submit and display immediately
- ✅ Copy link copies current URL to clipboard
- ✅ All interactive features functional

---

### Phase 4: Integration & Styling (30 min)

**Goal**: Polish layout, styling, and accessibility

**Tasks**:

1. Integrate all 12 components into 3-column layout:
   - Left sidebar: Breadcrumb + QuickActions + WatchersSection
   - Main content: IssueHeader + IssueActions + DescriptionSection + CodeSection + CommentList + CommentForm
   - Right sidebar: IssueDetailSidebar + RelatedIssues
2. Apply neumorphic design tokens:
   - `.neu-raised` for cards
   - `.neu-pressed` for inset sections
   - `.coral-gradient` for primary buttons
   - `.smooth-transition` for hover states
3. Responsive breakpoints:
   - Mobile: Single column, collapsible sidebars
   - Tablet: 2 columns (main + right sidebar)
   - Desktop: 3 columns (full layout)
4. Accessibility audit:
   - ARIA labels for all interactive elements
   - Keyboard navigation (Tab, Enter, Escape)
   - Screen reader announcements for status changes
   - Focus management for modal dialogs

**Success Criteria**:

- ✅ Matches mockup design pixel-perfect
- ✅ Responsive on 375px mobile, 768px tablet, 1440px desktop
- ✅ WCAG 2.1 AA compliance verified

---

### Phase 5: Testing (60 min)

**Goal**: Achieve ≥80% coverage with comprehensive tests

**Tasks**:

1. **Unit tests** (`__tests__/api/issues/[id]/route.test.ts`):
   - GET success (200 with full issue data)
   - GET not found (404 for non-existent issue)
   - GET invalid ID (400 for malformed ID)
   - Prisma includes all relations
2. **Component tests** (React Testing Library):
   - IssueHeader: Renders badges, title, metadata
   - SystemActivity: Formats activity types correctly
   - IssueActions: Calls API on status change, shows loading state
3. **E2E test** (Playwright):
   - Navigate to issue
   - Add comment
   - Change status
   - Verify UI updates
4. Run quality gates:
   - `pnpm lint`
   - `pnpm type-check`
   - `pnpm build`
   - `pnpm test`
5. Verify coverage targets:
   - API routes: ≥90%
   - Components: ≥75%
   - Overall new code: ≥80%

**Success Criteria**:

- ✅ 52+ tests passing (unit + component + E2E)
- ✅ All gates green
- ✅ Coverage targets met

---

## Component Architecture

### Server Components (6)

1. `page.tsx` - Main layout with data fetching
2. `IssueHeader` - Static display
3. `SystemActivity` - Timeline rendering
4. `CodeSection` - Syntax highlighting
5. `WatchersSection` - Avatar stack
6. `RelatedIssues` - Linked issues list

### Client Components (6)

1. `IssueActions` - Status change buttons
2. `DescriptionSection` - Markdown rendering
3. `QuickActions` - Interactive sidebar
4. `CommentList` (existing Day 4)
5. `CommentForm` (existing Day 4)
6. `AttachmentList` (existing Day 4)

---

## Dependencies

**✅ All prerequisites met**:

- Database schema complete (no migrations needed)
- 2 API endpoints exist (POST comments, PATCH status)
- 5 components exist (from Day 4)
- Mockup available
- Testing patterns documented
- Component patterns documented

**No blockers identified.**

---

## Expert Consultation Required

**Before Phase 1 implementation**:

1. **next-js-expert** - Data fetching strategy:
   - Question: "For issue detail page with comments, attachments, and activity timeline, should I use Server Component with direct Prisma query, or Client Component with API fetch? What's the optimal data loading pattern for nested relations?"

2. **react-expert** - Component composition:
   - Question: "With 12 components (6 server, 6 client) in 3-column layout, what's the best composition strategy to avoid prop drilling while maintaining type safety?"

---

## Timeline

| Phase      | Duration  | Cumulative    |
| ---------- | --------- | ------------- |
| Phase 1    | 30 min    | 0.5 hours     |
| Phase 2    | 60 min    | 1.5 hours     |
| Phase 3    | 45 min    | 2.25 hours    |
| Phase 4    | 30 min    | 2.75 hours    |
| Phase 5    | 60 min    | 3.75 hours    |
| **Buffer** | 3-4 hours | **6-8 hours** |

---

## Success Criteria

**Functional**:

- ✅ Issue detail page loads at `/issues/[id]`
- ✅ All issue data displayed
- ✅ Status changes work
- ✅ Comments can be added
- ✅ Attachments viewable

**Quality**:

- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 errors
- ✅ Tests: ≥80% coverage
- ✅ Build: Successful
- ✅ Accessibility: WCAG 2.1 AA

**Design**:

- ✅ Matches mockup
- ✅ Responsive
- ✅ Smooth animations
- ✅ Consistent with Dashboard

---

## Post-Completion (Protocol Step 5)

1. Create `COMPLETION_WEEK_1.5_PHASE_3_DAY_5.md`
2. Update `STATUS.md` (mark Day 5 complete)
3. Update `DEVELOPMENT_PLAN.md`
4. Update `.agent/active-context.md`
5. Docs-first commit, then code commit
