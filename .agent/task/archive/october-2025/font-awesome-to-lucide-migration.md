# Font Awesome → Lucide Migration Plan

**Created**: 2025-11-01
**Status**: Documented - Ready for implementation
**Priority**: Medium (75KB bundle reduction)
**Complexity**: Medium (30 files, ~2-3 hours)

---

## Overview

Migrate from Font Awesome CDN (75KB) to Lucide React (~15KB tree-shakeable) for significant bundle size reduction and better performance.

## Progress

- **Completed**: Header.tsx, Sidebar.tsx, FilterSidebar.tsx (already using Lucide)
- **Remaining**: 30 files with `fas fa-*` icons

## Benefits

- **Bundle Size**: ~60KB reduction (75KB → 15KB)
- **Performance**: Tree-shaking (only import used icons)
- **DX**: TypeScript types, React-first API
- **Offline**: No CDN dependency

---

## Icon Mapping (Font Awesome → Lucide)

| Font Awesome            | Lucide React    | Import                                         |
| ----------------------- | --------------- | ---------------------------------------------- |
| `fa-plus`               | `Plus`          | `import { Plus } from 'lucide-react'`          |
| `fa-search`             | `Search`        | `import { Search } from 'lucide-react'`        |
| `fa-bell`               | `Bell`          | `import { Bell } from 'lucide-react'`          |
| `fa-link`               | `Link`          | `import { Link } from 'lucide-react'`          |
| `fa-check`              | `Check`         | `import { Check } from 'lucide-react'`         |
| `fa-play`               | `Play`          | `import { Play } from 'lucide-react'`          |
| `fa-redo`               | `RotateCcw`     | `import { RotateCcw } from 'lucide-react'`     |
| `fa-ellipsis-v`         | `MoreVertical`  | `import { MoreVertical } from 'lucide-react'`  |
| `fa-thumbtack`          | `Pin`           | `import { Pin } from 'lucide-react'`           |
| `fa-eye`                | `Eye`           | `import { Eye } from 'lucide-react'`           |
| `fa-share-alt`          | `Share2`        | `import { Share2 } from 'lucide-react'`        |
| `fa-print`              | `Printer`       | `import { Printer } from 'lucide-react'`       |
| `fa-lightbulb`          | `Lightbulb`     | `import { Lightbulb } from 'lucide-react'`     |
| `fa-th-list`            | `List`          | `import { List } from 'lucide-react'`          |
| `fa-th`                 | `Grid3x3`       | `import { Grid3x3 } from 'lucide-react'`       |
| `fa-paperclip`          | `Paperclip`     | `import { Paperclip } from 'lucide-react'`     |
| `fa-comments`           | `MessageSquare` | `import { MessageSquare } from 'lucide-react'` |
| `fa-bolt`               | `Zap`           | `import { Zap } from 'lucide-react'`           |
| `fa-circle-notch`       | `RefreshCw`     | `import { RefreshCw } from 'lucide-react'`     |
| `fa-exclamation-circle` | `AlertCircle`   | `import { AlertCircle } from 'lucide-react'`   |
| `fa-cube`               | `Box`           | `import { Box } from 'lucide-react'`           |
| `fa-code`               | `Code`          | `import { Code } from 'lucide-react'`          |
| `fa-file-code`          | `FileCode`      | `import { FileCode } from 'lucide-react'`      |
| `fa-history`            | `History`       | `import { History } from 'lucide-react'`       |
| `fa-git-alt`            | `GitBranch`     | `import { GitBranch } from 'lucide-react'`     |
| `fa-link`               | `ExternalLink`  | `import { ExternalLink } from 'lucide-react'`  |
| `fa-clock`              | `Clock`         | `import { Clock } from 'lucide-react'`         |
| `fa-user`               | `User`          | `import { User } from 'lucide-react'`          |
| `fa-users`              | `Users`         | `import { Users } from 'lucide-react'`         |
| `fa-tag`                | `Tag`           | `import { Tag } from 'lucide-react'`           |
| `fa-tags`               | `Tags`          | `import { Tags } from 'lucide-react'`          |

---

## Migration Pattern

### Before (Font Awesome):

```tsx
<button>
  <i className="fas fa-plus"></i>
  <span>New Issue</span>
</button>
```

### After (Lucide):

```tsx
import { Plus } from 'lucide-react';

<button>
  <Plus className="h-5 w-5" aria-hidden="true" />
  <span>New Issue</span>
</button>;
```

**Key Changes:**

1. Import icon component from `lucide-react`
2. Replace `<i>` with `<IconName />` component
3. Add `className="h-5 w-5"` for consistent sizing
4. Add `aria-hidden="true"` for accessibility
5. Remove `fas fa-*` classes

---

## Files Requiring Migration (30 total)

### High Priority (User-facing, frequently used):

1. `app/issues/page.tsx` - Issues list header
2. `app/issues/[id]/page.tsx` - Issue detail page
3. `components/issues/SearchSortBar.tsx` - Search and view toggles
4. `components/issues/FilterSidebar.tsx` - Filter icons
5. `components/issues/detail/QuickActions.tsx` - Action buttons
6. `components/issues/detail/IssueActions.tsx` - Status buttons
7. `components/issues/detail/IssueHeader.tsx` - Header icons
8. `components/dashboard/QuickActionsWidget.tsx` - Dashboard actions

### Medium Priority (Secondary pages):

9. `components/issues/detail/DescriptionSection.tsx`
10. `components/issues/detail/CodeSection.tsx`
11. `components/issues/detail/SystemActivity.tsx`
12. `components/issues/detail/WatchersSection.tsx`
13. `components/issues/detail/RelatedIssues.tsx`
14. `components/issues/detail/IssueDetailSidebar.tsx`
15. `components/issues/detail/CommentList.tsx`
16. `components/issues/detail/CommentForm.tsx`
17. `components/issues/IssueListCard.tsx`
18. `app/knowledge/page.tsx`
19. `app/agents/page.tsx`
20. `app/security/page.tsx`
21. `app/wiki/[slug]/page.tsx`
22. `app/wiki/[slug]/not-found.tsx`

### Low Priority (Less frequently used):

23. `components/CommandPalette.tsx`
24. `components/agents/AgentCard.tsx`
25. `components/knowledge/SearchBar.tsx`
26. `components/knowledge/ArticleCard.tsx`
27. `components/knowledge/TagFilter.tsx`
28. `components/security/VulnerabilityCard.tsx`
29. `components/security/VulnerabilityFilter.tsx`
30. `components/wiki/WikiSidebar.tsx`
31. `components/wiki/TableOfContents.tsx`

---

## Step-by-Step Implementation

1. **Migrate one file at a time** to avoid breaking changes
2. **Test after each migration** (`pnpm dev` + visual check)
3. **Start with High Priority files** (most visible to users)
4. **Run type-check** after every 5 files: `pnpm type-check`
5. **Remove FA CDN link** only after ALL files migrated

## Completion Checklist

- [ ] Migrate all 30 files listed above
- [ ] Run `pnpm type-check` (0 errors)
- [ ] Visual regression test on all pages
- [ ] Remove Font Awesome CDN link from `app/layout.tsx`
- [ ] Run Lighthouse audit (verify bundle size reduction)
- [ ] Update this document with completion date

---

## Expected Results

| Metric            | Before         | After           | Improvement      |
| ----------------- | -------------- | --------------- | ---------------- |
| Bundle Size       | ~75KB (FA CDN) | ~15KB (Lucide)  | **-60KB**        |
| Icons Loaded      | All FA icons   | Only used icons | **Tree-shaking** |
| External Requests | 1 (CDN)        | 0               | **Faster load**  |
| Offline Support   | ❌ Broken      | ✅ Works        | **Better UX**    |

---

## Notes

- Lucide has 1000+ icons, equivalent coverage to Font Awesome Free
- All icons are MIT licensed
- Consistent 24×24px viewBox (scales with className)
- React components = better TypeScript support
- Already used in: Header, Sidebar, FilterSidebar (working examples)

---

**Next Session Task**: Start with High Priority files, migrate 5-10 per session
