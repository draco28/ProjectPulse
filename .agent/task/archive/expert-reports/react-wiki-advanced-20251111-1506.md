# React Implementation Plan: Wiki Revision Timeline, Search, Analytics

**Created**: 2025-11-11 15:06 PST  
**Type**: Component Architecture + Hook Strategy  
**Context**: Sprint 2 Week 3 Days 6-7 (US-023/024/025)

## Component Architecture

### Component Tree (new/updated)
```
app/wiki/[slug]/page.tsx (Server)
├── WikiHeader (Server)
├── WikiContent (Client for TipTap preview)
├── WikiRevisionTimeline (Server)
│   └── RevisionDiffViewer (Client)
├── WikiContributors (Client)
└── WikiFooterNav (Server)

app/wiki/search/page.tsx (Server)
└── WikiSearchResults (Client)
    ├── SearchSummary
    ├── ResultList
    │   └── ResultCard (memoized)
    └── ResultFilters (Client)

app/wiki/analytics/page.tsx (Server)
└── WikiAnalyticsDashboard (Client shell)
    ├── TopPagesCard (Server + Client hydration for charts)
    ├── TrendingTagsCard
    ├── FeedbackFunnelCard
    └── ViewTimelineChart (Client, lazy-loaded)
```

### State Management
- **Revision timeline**: Server fetch with streaming (Suspense) + `RevisionDiffViewer` uses `useState` for selected revision + `useTransition` for revert actions.  
- **Search UI**: URL search params as single source of truth (Server) + Client component reads via `useSearchParams`. Debounced input using `useDeferredValue`.  
- **Analytics dashboard**: Server provides aggregated data; charts rendered client-side using lightweight lib (e.g., Recharts) dynamically imported to keep bundle small.  
- **Feedback stats**: derived props from analytics API; `WikiContributors` receives counts via new props.

## Implementation Steps

### Step 1: Hooks + Utilities
- `useRevisionHistory(slug: string)` – wraps fetcher for history/revert actions with optimistic UI.  
- `useSearchQuery(initial)` – manages query string, debounced updates, highlight helpers.  
- `useAnalyticsCards(data)` – splits aggregated payload into card props + memoized chart datasets.

### Step 2: Revision Components
```tsx
// components/wiki/WikiRevisionTimeline.tsx (Server)
export async function WikiRevisionTimeline({ slug }: Props) {
  const revisions = await getRevisions(slug);
  return (
    <Timeline>
      {revisions.map((rev) => (
        <TimelineItem key={rev.version}>
          <RevisionMetadata ... />
          <RevisionDiffViewer revision={rev} />
        </TimelineItem>
      ))}
    </Timeline>
  );
}
```

```tsx
// components/wiki/RevisionDiffViewer.tsx (Client)
'use client';
const RevisionDiffViewer = ({ revision }: Props) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'inline'>('side-by-side');
  const [isReverting, startTransition] = useTransition();
  const onRevert = () => startTransition(async () => {
    await revertRevision({ slug: revision.slug, version: revision.version });
    router.refresh();
  });
  return (
    <Card>
      <Diff diffHtml={revision.diffHtml} mode={viewMode} />
      <Button disabled={isReverting} onClick={onRevert}>Revert to v{revision.version}</Button>
    </Card>
  );
};
```

### Step 3: Search Experience
- `WikiSearchResults` (client) consumes server-provided `results`, `query`, `facets`.  
- Add highlight utility using `markMatches(contentExcerpt, query)` to render `<mark>`.  
- Debounce input to 250ms; update URL via `router.replace`.  
- Result cards memoized; include badges for category + rank score.  
- Provide empty state + skeletons.

### Step 4: Analytics Dashboard
- Server component fetches analytics JSON (top pages, trending tags, feedback stats).  
- Lazy-load chart component: `const ViewTimelineChart = dynamic(() => import('./ViewTimelineChart'), { ssr: false, loading: Skeleton })`.  
- Keep cards modular with `CardHeader`, `CardContent`, `CardFooter`.  
- Provide CTA linking back to wiki pages.

## TypeScript Types
```typescript
export type WikiRevisionDTO = {
  version: number;
  title: string;
  excerpt?: string | null;
  diffHtml: string;
  author: string;
  createdAt: string;
};

export type WikiSearchResult = {
  id: number;
  title: string;
  path: string;
  category: string;
  excerpt: string;
  rank: number;
};

export interface WikiAnalyticsSnapshot {
  topPages: Array<{ id: number; title: string; viewCount: number; popularity: number }>;
  trendingTags: Array<{ tag: string; delta: number }>;
  feedback: { positive: number; negative: number; ratio: number };
  timeline: Array<{ date: string; views: number }>;
}
```

## Performance Considerations
- Wrap heavy client bundles (`DiffViewer`, charts) in dynamic imports.  
- Use `React.Suspense` around `WikiRevisionTimeline` to avoid blocking main render.  
- Memoize result cards + analytics cards to avoid re-renders on search query change.  
- Limit timeline to latest 20 revisions + paginate for more.  
- Ensure diff viewer only mounts when revision expanded (`details/summary` pattern) to cut render cost.

## Testing Recommendations
- RTL tests for `RevisionDiffViewer` (revert button states, view toggle).  
- RTL tests for `WikiSearchResults` (debounce, highlight).  
- Playwright flows: revert revision, search with ranking, analytics cards display data.  
- Snapshot tests for analytics cards to detect regressions.

## Next Steps for Parent Agent
1. Implement `WikiRevisionTimeline` + diff viewer using dynamic import + optimistic revert.  
2. Build enhanced `/wiki/search` UI leveraging new API + highlight helper.  
3. Create analytics dashboard + card components, ensuring lazy-loaded charts and accessible summaries.
