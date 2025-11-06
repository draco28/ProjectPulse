# Week 1.75 - Phase 4 Completion Implementation Plan

**Created**: 2025-11-01 14:45
**Phase**: Week 1.75 - Phase 4 Completion
**Estimated Duration**: 3-7 hours

---

## Overview

Complete all deferred tasks from Week 1.5 Phase 4 before starting Week 2 (Issue Tracker Core). Focus on polish, performance optimization, and quality gates.

---

## Success Criteria

- ✅ 0 TypeScript errors
- ✅ 0 lint warnings (currently 11)
- ✅ Font Awesome completely removed (30 files migrated to Lucide)
- ✅ Font Awesome CDN link removed from layout.tsx
- ✅ Bundle size reduced by ~60KB
- ✅ Bundle analyzer configured and baseline documented
- ✅ Accessibility: 0 axe-core violations (WCAG 2.1 AA)
- ✅ Performance: ≥90 Lighthouse score on all pages

---

## Phase 1: Font Awesome → Lucide Migration (2-3 hours)

**Goal**: Replace all Font Awesome icons with Lucide React components

### Strategy

1. Start with High Priority files (most visible to users)
2. Test type-check after every 5 files
3. Verify visually in browser after each migration
4. Remove CDN link only after ALL migrations complete

### Migration Pattern

```tsx
// BEFORE (Font Awesome)
<i className="fas fa-plus"></i>;

// AFTER (Lucide)
import { Plus } from 'lucide-react';
<Plus className="h-5 w-5" aria-hidden="true" />;
```

### Icon Mapping Reference

See: `.agent/task/font-awesome-to-lucide-migration.md` for complete mapping table

### File Priority

**High Priority (8 files)** - Start here:

1. ✅ components/issues/SearchSortBar.tsx - Search, view toggles
2. ⏳ app/issues/page.tsx - New Issue button
3. ⏳ app/issues/[id]/page.tsx - Attachments, comments sections
4. ⏳ components/issues/detail/QuickActions.tsx - Action buttons
5. ⏳ components/issues/detail/IssueActions.tsx - Status change buttons
6. ⏳ components/issues/detail/IssueHeader.tsx - Header icons
7. ⏳ components/dashboard/QuickActionsWidget.tsx - Dashboard actions
8. ⏳ components/issues/FilterSidebar.tsx - Filter icons

**Medium Priority (14 files)**:

- components/issues/detail/DescriptionSection.tsx
- components/issues/detail/CodeSection.tsx
- components/issues/detail/SystemActivity.tsx
- components/issues/detail/WatchersSection.tsx
- components/issues/detail/RelatedIssues.tsx
- components/issues/detail/IssueDetailSidebar.tsx
- components/issues/detail/CommentList.tsx
- components/issues/detail/CommentForm.tsx
- components/issues/IssueListCard.tsx
- app/knowledge/page.tsx
- app/agents/page.tsx
- app/security/page.tsx
- app/wiki/[slug]/page.tsx
- app/wiki/[slug]/not-found.tsx

**Low Priority (8 files)**:

- components/CommandPalette.tsx
- components/agents/AgentCard.tsx
- components/knowledge/SearchBar.tsx
- components/knowledge/ArticleCard.tsx
- components/knowledge/TagFilter.tsx
- components/security/VulnerabilityCard.tsx
- components/security/VulnerabilityFilter.tsx
- components/wiki/WikiSidebar.tsx

### Testing Checkpoints

- After 5 files: `pnpm type-check`
- After 10 files: `pnpm type-check` + visual browser test
- After 20 files: `pnpm type-check` + full page review
- After all files: `pnpm type-check` + `pnpm lint`

---

## Phase 2: Quality Gates (1-2 hours)

### 2.1 Fix Lint Warnings (15 minutes)

**Current State**: 11 unused variable warnings

**Fix Pattern**:

```tsx
// Before
const issueId = parseInt(id, 10);

// After (if truly unused)
const _issueId = parseInt(id, 10);
```

**Files to Check**:

- Run `pnpm lint` to see all warnings
- Fix each by prefixing with underscore or removing if truly unused
- Re-run `pnpm lint` to verify 0 warnings

### 2.2 Bundle Analyzer Setup (30 minutes)

**Steps**:

1. Install: `pnpm add -D @next/bundle-analyzer`
2. Create `next.config.analyzer.js`:

```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... existing config
});
```

3. Add script to package.json: `"analyze": "ANALYZE=true pnpm build"`
4. Run analysis: `pnpm analyze`
5. Document findings in session file

**Expected Findings**:

- Identify largest chunks
- Confirm CodeBlock lazy loading working
- Confirm Font Awesome removed
- Identify additional optimization opportunities

### 2.3 Accessibility Audit (1 hour)

**Tool**: axe-core via Playwright

**Implementation**:

1. Create test file: `e2e/accessibility.spec.ts`
2. Add axe-core integration
3. Test pages: Dashboard, Issues List, Issue Detail
4. Fix any violations found
5. Target: 0 violations (WCAG 2.1 AA)

**Test Pattern**:

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Dashboard accessibility', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

### 2.4 Lighthouse Audit (30 minutes)

**Pages to Test**:

- Dashboard (`/dashboard`)
- Issues List (`/issues`)
- Issue Detail (`/issues/1`)

**Metrics Target**: ≥90 for all

- Performance
- Accessibility
- Best Practices
- SEO

**Documentation**:

- Screenshot baseline scores
- Document in session file
- Note any recommendations

---

## Phase 3: Documentation & Completion (30 minutes)

### 3.1 Create Completion Report

**File**: `docs/COMPLETION_WEEK_1.75.md`

**Template**: Follow `docs/COMPLETION_WEEK_1.5_PHASE_4.md` structure

**Sections**:

- Executive Summary
- Deliverables Completed
- Files Modified (summary table)
- Technical Decisions & Patterns
- Metrics & Impact (before/after)
- Known Issues & Future Work
- Sign-Off

### 3.2 Update Project Documentation

**STATUS.md**:

- Update last completed phase
- Update last task completed
- Update next steps

**DEVELOPMENT_PLAN.md**:

- Mark Week 1.75 complete
- Add completion date
- Note that Week 2 prerequisites satisfied

### 3.3 Git Commit

**Workflow**:

1. Stage changes: `git add .`
2. Commit with message:

```
docs: complete Week 1.75 - Phase 4 finalization

- Migrate 30 files from Font Awesome to Lucide React
- Fix 11 lint warnings (unused variables)
- Configure bundle analyzer
- Run accessibility audit (0 violations)
- Run Lighthouse audit (≥90 all metrics)
- Bundle size reduced by ~60KB

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

3. Verify: `git status`

---

## Dependencies

**None** - All tasks can proceed independently

---

## Risks & Mitigations

**Risk 1**: Icon visual differences after migration

- **Mitigation**: Visual review after each file, adjust sizing if needed

**Risk 2**: Breaking changes in component functionality

- **Mitigation**: Test after every 5 files, maintain type-check passing

**Risk 3**: Build failure with database requirement

- **Mitigation**: Use `pnpm type-check` + `pnpm lint` instead of full build

---

## Token Budget

**Estimated Token Usage**:

- Font Awesome migration: ~40-60K tokens (30 files × 2K avg)
- Quality gates: ~15-20K tokens
- Documentation: ~10-15K tokens
- **Total Estimated**: 65-95K tokens
- **Budget Available**: 200K tokens
- **Safety Margin**: ✅ Comfortable (2-3x buffer)

---

## Next Steps After Week 1.75

**Week 2: Issue Tracker Core**

- Per DEVELOPMENT_PLAN.md lines 2815+
- Prerequisites: ✅ All satisfied after Week 1.75 completion
- Focus: CRUD APIs for issues, comments, attachments
