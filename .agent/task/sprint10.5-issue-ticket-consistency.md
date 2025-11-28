# Sprint 10.5: Issue → Ticket Consistency Refactor

**Version**: 1.0.0
**Created**: 2025-11-28
**Status**: 📋 PLANNING
**Sprint Duration**: 3-4 days (~15 story points)
**Branch**: `feature/sprint-10.5-ticket-consistency`

---

## 1. Executive Summary

### Goal

Complete the Issue → Ticket migration started in Sprint 10 by eliminating all remaining "Issue" terminology from the codebase. After this sprint, "Issue" will only exist as a `kind` value (`kind='issue'`), not as a separate concept.

### Key Principle

> **There is no "Create Issue" button. Users always create a Ticket, then select the `kind` (feature, task, epic, issue, bug, scanner_finding, tech_debt).**

### Success Criteria

| Metric | Target |
|--------|--------|
| No "Create Issue" buttons in UI | 0 occurrences |
| All `IssueXxx` components renamed to `TicketXxx` | 100% |
| All `issueId` props renamed to `ticketId` | 100% |
| Schema models renamed (IssueStatusOption → TicketStatusOption) | Migration applied |
| Command palette uses `/tickets` routes | 100% |
| E2E tests updated | 100% |
| TypeScript compiles without errors | ✅ |

---

## 2. Deep Analysis Results

### Category 1: UI Text/Labels (User-Facing) - 3 points

| File | Current | Required Change |
|------|---------|-----------------|
| `components/dashboard/QuickActionsWidget.tsx:60-70` | "Create Issue" button | Remove or change to "Create Ticket" linking to `/tickets/create` |
| `components/security/VulnerabilityCard.tsx:170` | "Create Issue" button | "Create Ticket" with `?kind=scanner_finding` |

**Decision**: The QuickActionsWidget should link to `/tickets/create` (default kind can be 'issue' for quick bug logging).

---

### Category 2: Component/Directory Renames - 5 points

| Current Path | New Path |
|--------------|----------|
| `components/issues/` | `components/tickets/` |
| `components/issues/IssueListCard.tsx` | `components/tickets/TicketListCard.tsx` |
| `components/issues/IssuesPageClient.tsx` | `components/tickets/TicketsPageClient.tsx` |
| `components/issues/detail/IssueHeader.tsx` | `components/tickets/detail/TicketHeader.tsx` |
| `components/issues/detail/IssueDetailSidebar.tsx` | `components/tickets/detail/TicketDetailSidebar.tsx` |
| `components/issues/detail/IssueActions.tsx` | `components/tickets/detail/TicketActions.tsx` |
| `components/issues/detail/RelatedIssues.tsx` | `components/tickets/detail/RelatedTickets.tsx` |
| `components/dashboard/IssueCard.tsx` | `components/dashboard/TicketCard.tsx` |

**Internal exports will also be renamed** (e.g., `IssueHeader` → `TicketHeader`).

---

### Category 3: Type/Interface Renames - 2 points

| File | Exports to Rename |
|------|-------------------|
| `types/issue.ts` | Rename to `types/ticket.ts`, keep `IssueDetail` as alias for backwards compat |
| `lib/types/issues.ts` | Rename to `lib/types/tickets.ts`, update all `Issue*` types |
| `lib/validations/issue.ts` | Consolidate into `lib/validations/ticket.ts` |
| `lib/issues/options.ts` | Move to `lib/tickets/options.ts` |
| `types/filters.ts` | Update comments referencing IssueStatusOption |

---

### Category 4: Schema Models (Database Migration) - 2 points

**Current models in `schema.prisma`:**

```prisma
model IssueStatusOption { ... }   // line 1123
model IssuePriorityOption { ... } // line 1137
model IssueModuleOption { ... }   // line 1152
```

**Required migration:**
- Rename tables: `IssueStatusOption` → `TicketStatusOption`, etc.
- These are **configuration/dropdown option tables**, not the main data table
- Low-risk rename (no FK changes needed)

---

### Category 5: Props/Variables - 2 points

All components using `issueId` props need updating:

| Component | Current Prop | New Prop |
|-----------|--------------|----------|
| `DescriptionSection` | `issueId: string` | `ticketId: string` |
| `CommentForm` | `issueId: string` | `ticketId: string` |
| `WatchersSection` | `issueId: string` | `ticketId: string` |
| `QuickActions` | `issueId: string` | `ticketId: string` |
| `IssueActions` | `issueId: string` | `ticketId: string` |
| `RelatedIssues` | `issueId: string` | `ticketId: string` |
| `IssueDetailSidebar` | `issueId: string` | `ticketId: string` |
| `CommentList` | `issueId: string` | `ticketId: string` |

**Ticket detail page** (`app/tickets/[id]/page.tsx`) calls these with `issueId={serializedTicket.id}` - needs to change to `ticketId`.

---

### Category 6: Command Palette / Shortcuts - 1 point

| File | Current | Required |
|------|---------|----------|
| `components/CommandPalette.tsx:140` | `url: '/issues/1'` | `url: '/tickets/1'` |
| `components/command-palette/useGlobalShortcuts.ts:48` | `/issues` | `/tickets` |
| `components/command-palette/useGlobalShortcuts.ts:72` | `/issues/new` | `/tickets/create` |
| `components/command-palette/commands.ts:46` | `/issues/new` | `/tickets/create` |
| `components/command-palette/commands.ts:175` | `/issues` | `/tickets` |

---

### Category 7: API Route References in Components - 1 point

| File | Current | Required |
|------|---------|----------|
| `CommentForm.tsx:43` | `/api/issues/${issueId}/comments` | `/api/tickets/${ticketId}/comments` |
| `IssueActions.tsx:104` | `/api/issues/${issueId}/status` | `/api/tickets/${ticketId}/status` |
| `DescriptionSection.tsx:61` | `/api/issues/${issueId}` | `/api/tickets/${ticketId}` |

---

### Category 8: Hardcoded Links in Components - 1 point

| File | Current | Required |
|------|---------|----------|
| `VulnerabilityCard.tsx:161` | `/issues/${id}` | `/tickets/${id}` |
| `RelatedIssues.tsx:149` | `/issues/${issue.id}` | `/tickets/${ticket.id}` |
| `Pagination.tsx:33` | `/issues?...` | `/tickets?...` |
| `QuickActions.tsx:50` | `/issues/${issueId}` | `/tickets/${ticketId}` |

---

### Category 9: E2E Tests - 1 point

| File | Changes Needed |
|------|----------------|
| `tests/e2e/issue-detail.spec.ts` | Rename to `ticket-detail.spec.ts`, update selectors |
| `tests/e2e/dashboard.spec.ts` | Update "Create Issue" references |
| All tests using `.issue-card` | Change to `.ticket-card` |

---

### Category 10: Seed Files & Documentation - 1 point

| File | Changes |
|------|---------|
| `prisma/seed.ts` | Update `issueStatusOption` → `ticketStatusOption` references |
| `prisma/seed.ts:1676-1680` | Update example code comments |
| `lib/onboarding/create-workflows-sops.ts:619-643` | Update example test code |

---

## 3. Implementation Plan

### Phase 1: Schema Migration (Day 1, ~2 hours)

1. Create migration to rename option tables:
   - `IssueStatusOption` → `TicketStatusOption`
   - `IssuePriorityOption` → `TicketPriorityOption`
   - `IssueModuleOption` → `TicketModuleOption`
2. Update `schema.prisma` model names
3. Run `prisma generate`
4. Update all Prisma client references

### Phase 2: Component Directory Restructure (Day 1-2, ~4 hours)

1. Create `components/tickets/` directory
2. Move and rename files from `components/issues/` → `components/tickets/`
3. Update all export names (IssueXxx → TicketXxx)
4. Update all import statements across the app
5. Rename `components/dashboard/IssueCard.tsx` → `TicketCard.tsx`

### Phase 3: Type/Lib File Updates (Day 2, ~2 hours)

1. Rename `types/issue.ts` → `types/ticket.ts`
2. Rename `lib/types/issues.ts` → `lib/types/tickets.ts`
3. Consolidate `lib/validations/issue.ts` into `lib/validations/ticket.ts`
4. Move `lib/issues/` → `lib/tickets/`
5. Update all imports

### Phase 4: Props & Variables (Day 2, ~2 hours)

1. Update all `issueId` props to `ticketId`
2. Update component interfaces
3. Update caller sites (especially `app/tickets/[id]/page.tsx`)

### Phase 5: UI Text & Links (Day 3, ~2 hours)

1. Update QuickActionsWidget "Create Issue" → "Create Ticket"
2. Update VulnerabilityCard "Create Issue" → "Create Ticket"
3. Update all `/issues` links to `/tickets`
4. Update command palette routes

### Phase 6: Tests & Documentation (Day 3, ~2 hours)

1. Rename E2E test files
2. Update test selectors (`.issue-card` → `.ticket-card`)
3. Update seed file references
4. Update documentation/comments

### Phase 7: Verification (Day 4, ~2 hours)

1. Run TypeScript compilation (`tsc --noEmit`)
2. Run linter (`pnpm lint`)
3. Run unit tests
4. Run E2E tests
5. Manual UI smoke test

---

## 4. Files to Modify (Complete List)

### Components (Rename)
- [ ] `components/issues/` → `components/tickets/` (entire directory)
- [ ] `components/dashboard/IssueCard.tsx` → `TicketCard.tsx`

### Components (Edit Content)
- [ ] `components/dashboard/QuickActionsWidget.tsx`
- [ ] `components/security/VulnerabilityCard.tsx`
- [ ] `components/CommandPalette.tsx`
- [ ] `components/command-palette/useGlobalShortcuts.ts`
- [ ] `components/command-palette/commands.ts`

### Types/Lib (Rename)
- [ ] `types/issue.ts` → `types/ticket.ts`
- [ ] `lib/types/issues.ts` → `lib/types/tickets.ts`
- [ ] `lib/issues/` → `lib/tickets/`

### Types/Lib (Edit)
- [ ] `lib/validations/issue.ts` - consolidate
- [ ] `lib/filters.ts`
- [ ] `types/filters.ts`

### Schema
- [ ] `prisma/schema.prisma` (rename 3 models)
- [ ] Create migration file

### App Pages (Edit imports/props)
- [ ] `app/tickets/page.tsx`
- [ ] `app/tickets/[id]/page.tsx`
- [ ] `app/dashboard/page.tsx`

### Tests
- [ ] `tests/e2e/issue-detail.spec.ts` → `ticket-detail.spec.ts`
- [ ] `tests/e2e/dashboard.spec.ts`
- [ ] `components/issues/__tests__/` → `components/tickets/__tests__/`

### Seeds/Docs
- [ ] `prisma/seed.ts`
- [ ] `lib/onboarding/create-workflows-sops.ts`

---

## 5. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking imports | Medium | High | Run TypeScript after each phase |
| Missing renames | Medium | Medium | Grep for "Issue" before completion |
| E2E test failures | Low | Medium | Update selectors carefully |
| Database migration issues | Low | High | Test migration on dev first |

---

## 6. Definition of Done

- [ ] Zero "Create Issue" buttons in UI
- [ ] Zero `IssueXxx` component names (except as documented aliases)
- [ ] Zero `issueId` prop names
- [ ] Schema models renamed with successful migration
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes
- [ ] All E2E tests pass
- [ ] Manual smoke test complete
- [ ] `13-Project-Plan.md` updated with Sprint 10.5 completion

---

## 7. Grep Validation Commands

Run these after completion to verify no remaining inconsistencies:

```bash
# Should return 0 results (except inside kind enums and MCP adapter comments)
grep -rn "Create Issue" --include="*.tsx" apps/web/components

# Should return only backwards-compat aliases
grep -rn "IssueHeader\|IssueCard\|IssueList" --include="*.tsx" apps/web/components

# Should return 0 in components (only in MCP adapters)
grep -rn "issueId" --include="*.tsx" apps/web/components

# Check schema
grep -rn "IssueStatusOption\|IssuePriorityOption\|IssueModuleOption" apps/web/prisma/schema.prisma
```

---

## 8. Notes

### What Stays as "Issue"

1. **`kind='issue'`** - This is a valid ticket type
2. **MCP `issue.*` tools** - Backwards-compatible adapters (documented in route.ts)
3. **`/api/issues/*` routes** - Adapters that delegate to `/api/tickets/*`
4. **Comments explaining migration** - Historical context

### What Changes

Everything else that uses "Issue" as a concept separate from "Ticket".
