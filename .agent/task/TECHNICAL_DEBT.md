# Technical Debt - Moksha DevHub

**Last Updated**: 2025-11-01 21:00
**Status**: 11 pre-existing ESLint warnings

---

## Overview

This document tracks known technical debt items that do not block functionality but should be addressed for code quality and maintainability.

**Impact**: All items are **code cleanliness only** - zero functional impact on the application.

---

## ESLint Warnings (11 items)

All warnings are `@typescript-eslint/no-unused-vars` violations for unused variables or function parameters.

**ESLint Rule**: Variables/parameters must be used OR prefixed with underscore (`_`) to indicate intentional non-use.

### Quick Fix Pattern

```typescript
// Before (ESLint warning)
function handleClick(event) {
  console.log('clicked');
}

// After (Fixed - prefix with _)
function handleClick(_event) {
  console.log('clicked');
}
```

---

## Detailed List

### 1. app/issues/[id]/page.tsx (2 warnings)

**File**: [apps/web/app/issues/[id]/page.tsx](../../apps/web/app/issues/[id]/page.tsx)

#### Warning 1: Unused import `Link`

- **Line**: 15
- **Issue**: `'Link' is defined but never used`
- **Fix**: Remove import if not needed, or use it for navigation

```typescript
// Current (Line 15)
import Link from 'next/link';

// Fix: Remove if not used
// OR implement navigation with Link component
```

#### Warning 2: Unused import `format`

- **Line**: 16
- **Issue**: `'format' is defined but never used`
- **Fix**: Remove import from `date-fns` or use for date formatting

```typescript
// Current (Line 16)
import { format } from 'date-fns';

// Fix: Remove if not used
// OR use: format(new Date(issue.createdAt), 'MMM dd, yyyy')
```

---

### 2. components/issues/detail/DescriptionSection.tsx (1 warning)

**File**: [apps/web/components/issues/detail/DescriptionSection.tsx](../../apps/web/components/issues/detail/DescriptionSection.tsx)

#### Warning: Unused parameter `issueId`

- **Line**: 43
- **Issue**: `'issueId' is defined but never used`
- **Context**: Function parameter not used in implementation
- **Fix**: Prefix with underscore to indicate intentional non-use

```typescript
// Current (Line 43)
function handleSave(issueId: number) {
  // Implementation doesn't use issueId
}

// Fix: Prefix with underscore
function handleSave(_issueId: number) {
  // Implementation doesn't use _issueId (intentional)
}
```

---

### 3. components/issues/detail/IssueHeader.tsx (1 warning)

**File**: [apps/web/components/issues/detail/IssueHeader.tsx](../../apps/web/components/issues/detail/IssueHeader.tsx)

#### Warning: Unused variable `projectName`

- **Line**: 118
- **Issue**: `'projectName' is defined but never used`
- **Context**: Variable extracted but not used in render
- **Fix**: Remove if not needed, or display in UI

```typescript
// Current (Line 118)
const projectName = issue.project?.name;

// Fix Option 1: Remove if not needed
// Fix Option 2: Use in breadcrumb
<span>{projectName} / Issue #{issue.id}</span>
```

---

### 4. components/issues/detail/QuickActions.tsx (1 warning)

**File**: [apps/web/components/issues/detail/QuickActions.tsx](../../apps/web/components/issues/detail/QuickActions.tsx)

#### Warning: Unused parameter `issueTitle`

- **Line**: 43
- **Issue**: `'issueTitle' is defined but never used`
- **Context**: Function parameter not used in share/print logic
- **Fix**: Prefix with underscore

```typescript
// Current (Line 43)
function handleShare(issueTitle: string) {
  // Implementation doesn't use issueTitle yet
}

// Fix: Prefix with underscore
function handleShare(_issueTitle: string) {
  // Will be used when share functionality is fully implemented
}
```

---

### 5. components/issues/detail/RelatedIssues.tsx (4 warnings)

**File**: [apps/web/components/issues/detail/RelatedIssues.tsx](../../apps/web/components/issues/detail/RelatedIssues.tsx)

**Context**: All 4 warnings are on Line 116 - function with multiple unused parameters

#### Warning 1: Unused parameter `currentIssueId`

- **Issue**: `'currentIssueId' is defined but never used`

#### Warning 2: Unused parameter `projectId`

- **Issue**: `'projectId' is defined but never used`

#### Warning 3: Unused parameter `labels`

- **Issue**: `'labels' is defined but never used`

#### Warning 4: Unused parameter `module`

- **Issue**: `'module' is defined but never used`

**Fix**: Prefix all unused parameters with underscore

```typescript
// Current (Line 116)
function findRelatedIssues(
  currentIssueId: number,
  projectId: number,
  labels: string[],
  module: string
) {
  // Placeholder implementation - params not used yet
  return mockRelatedIssues;
}

// Fix: Prefix all with underscore
function findRelatedIssues(
  _currentIssueId: number,
  _projectId: number,
  _labels: string[],
  _module: string
) {
  // Placeholder implementation - params reserved for future algorithm
  return mockRelatedIssues;
}
```

**Note**: These parameters are likely reserved for future "smart related issues" algorithm implementation.

---

### 6. components/issues/detail/WatchersSection.tsx (1 warning)

**File**: [apps/web/components/issues/detail/WatchersSection.tsx](../../apps/web/components/issues/detail/WatchersSection.tsx)

#### Warning: Unused parameter `issueId`

- **Line**: 59
- **Issue**: `'issueId' is defined but never used`
- **Context**: Function parameter not used in watcher logic
- **Fix**: Prefix with underscore

```typescript
// Current (Line 59)
function handleAddWatcher(issueId: number) {
  // Implementation doesn't use issueId yet
}

// Fix: Prefix with underscore
function handleAddWatcher(_issueId: number) {
  // Will be used when watcher API integration is complete
}
```

---

### 7. components/issues/FilterSidebar.tsx (1 warning)

**File**: [apps/web/components/issues/FilterSidebar.tsx](../../apps/web/components/issues/FilterSidebar.tsx)

#### Warning: Unused variable `currentFilters`

- **Line**: 47
- **Issue**: `'currentFilters' is assigned a value but never used`
- **Context**: Variable extracted from URL params but not consumed
- **Fix**: Remove if not needed, or use for filter state

```typescript
// Current (Line 47)
const currentFilters = useFilterParams();

// Fix Option 1: Remove if not needed
// Fix Option 2: Use for showing active filter count
<span>Active Filters: {Object.keys(currentFilters).length}</span>
```

---

## Fix Strategy

### Automated Fix (Recommended)

Use ESLint's auto-fix capability:

```bash
# Preview fixes
pnpm lint --fix

# Apply fixes
pnpm lint --fix && git add . && git commit -m "chore: fix ESLint unused variable warnings"
```

**Note**: ESLint `--fix` can handle simple cases (removing unused imports) but may not auto-fix all parameters.

### Manual Fix (Complete)

Apply fixes file-by-file following the patterns above. Estimated time: **15-20 minutes**.

**Steps**:

1. Start with imports (app/issues/[id]/page.tsx) - easiest
2. Prefix unused parameters with underscore
3. Review extracted variables - remove or use
4. Run `pnpm lint` to verify
5. Commit with descriptive message

---

## Impact Assessment

### Current State

- **TypeScript Errors**: 0 ✅
- **ESLint Warnings**: 11 ⚠️
- **Build Status**: Success ✅
- **Runtime**: No issues ✅

### After Fix

- **TypeScript Errors**: 0 ✅
- **ESLint Warnings**: 0 ✅
- **Build Status**: Success ✅
- **Runtime**: No issues ✅

**Code Quality Improvement**: Clean linting makes CI/CD cleaner and prevents masking real issues.

---

## Timeline Recommendation

**Priority**: Low (code cleanliness only)

**Options**:

1. **Immediate** (15-20 min) - Fix during Week 1.85 "Quality Gates" session
2. **Week 2 Pre-work** (10 min) - Clean up before starting Issue Tracker Core
3. **Week 2 End** (15 min) - Fix during Week 2 quality gate phase

**Recommended**: Fix during **Week 1.85 Quality Gates** session along with:

- Bundle analyzer setup
- axe-core accessibility audit
- Lighthouse performance audit

---

## Related Documentation

- **Week 1.75 Completion**: [docs/COMPLETION_WEEK_1.75_PHASE_4.md](../../docs/COMPLETION_WEEK_1.75_PHASE_4.md)
- **ESLint Config**: [apps/web/.eslintrc.json](../../apps/web/.eslintrc.json)
- **TypeScript Config**: [apps/web/tsconfig.json](../../apps/web/tsconfig.json)

---

**Status**: 📋 **Documented - Ready to Fix**
