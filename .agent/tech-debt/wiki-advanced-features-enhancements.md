# Technical Debt: Wiki Advanced Features Enhancements

**Created:** 2025-11-11
**Sprint:** Post Sprint 2 Week 3
**Related User Stories:** US-023 (Wiki Versioning), US-024 (Full-Text Search), US-025 (Analytics Dashboard)
**Status:** Documented for future implementation

---

## Overview

This document tracks future enhancements for the wiki system that were identified during Sprint 2 Week 3 implementation but deferred to maintain focus on core features. These enhancements build upon the foundation established in US-023, US-024, and US-025.

---

## Enhancement 1: Real-Time Analytics with WebSocket Integration

**Priority:** Medium
**Complexity:** 8 story points
**User Value:** High engagement visibility for editors and moderators

### Description

Currently, analytics are updated via periodic aggregation jobs and page refreshes. Real-time analytics would provide live updates to view counts, active readers, and feedback as they occur.

### Implementation Approach

1. **WebSocket Server Setup**
   - Add WebSocket support to Next.js API routes
   - Create `/api/wiki/realtime` endpoint for connections
   - Implement room-based broadcasting (per wiki page)

2. **Client-Side Integration**
   - Create `useRealtimeAnalytics` hook for subscribing to updates
   - Update `WikiViewTracker` to broadcast presence
   - Add live view counter badge to wiki pages

3. **Event Broadcasting**
   - VIEW events → broadcast to page room
   - FEEDBACK events → update helpful ratio live
   - Active readers count (5-minute window)

### Dependencies

- `ws` or `socket.io` library
- Redis (optional, for scaling across multiple Next.js instances)
- WebSocket connection management utilities

### Technical Considerations

- Connection pooling and cleanup (prevent memory leaks)
- Fallback to polling for browsers without WebSocket support
- Rate limiting to prevent abuse
- State synchronization on reconnect

### Acceptance Criteria

- [ ] Live view count updates within 2 seconds
- [ ] Active readers indicator shows users viewing in last 5 minutes
- [ ] Feedback ratio updates immediately on vote
- [ ] Graceful degradation to periodic refresh if WebSocket fails
- [ ] Connection cleanup on page navigation

---

## Enhancement 2: Diff Visualization with Side-by-Side Syntax Highlighting

**Priority:** High
**Complexity:** 13 story points
**User Value:** Essential for reviewers to understand content changes

### Description

Current `RevisionDiffViewer` shows a basic revert button. A full diff visualization would show side-by-side comparison of versions with syntax highlighting for markdown and inline changes highlighted.

### Implementation Approach

1. **Diff Generation**
   - Use `diff` library (or `diff-match-patch`) to compute line-level and character-level diffs
   - Store diff metadata in `WikiRevision.diffSummary` as structured JSON
   - Generate diffs on-demand for selected revision pairs

2. **UI Components**
   - Create `WikiDiffViewer` component with split-pane layout
   - Left pane: Previous version (deletions highlighted in red)
   - Right pane: New version (additions highlighted in green)
   - Markdown syntax highlighting with `react-markdown` + `rehype-highlight`

3. **Navigation**
   - "Compare versions" dropdown in timeline
   - Jump to next/previous change buttons
   - Collapsible unchanged sections

4. **Performance Optimization**
   - Virtualize long diffs with `react-window`
   - Lazy-load diff computation (only when requested)
   - Cache computed diffs in session storage

### Dependencies

- `diff` or `diff-match-patch` library
- `react-markdown` with `rehype-highlight` plugin
- `react-window` for virtualization
- `prismjs` or `highlight.js` for syntax highlighting

### Technical Considerations

- Large content diffs (>10K lines) may require streaming or pagination
- Markdown parsing performance for real-time preview
- Mobile responsiveness (side-by-side may need stacked layout)
- Accessibility (keyboard navigation between changes)

### Acceptance Criteria

- [ ] Side-by-side view shows additions/deletions clearly
- [ ] Syntax highlighting works for markdown code blocks
- [ ] Can compare any two versions (not just adjacent)
- [ ] Performance <500ms for 1000-line diffs
- [ ] Mobile view switches to unified diff format
- [ ] Keyboard shortcuts for navigating changes

---

## Enhancement 3: Advanced Search Filters

**Priority:** Medium
**Complexity:** 5 story points
**User Value:** Power users and researchers need precise search

### Description

Current search uses basic full-text query. Advanced filters would allow refinement by date range, author, category, tags, and content type.

### Implementation Approach

1. **Filter UI**
   - Add filter sidebar to `/wiki` page
   - Chips for active filters
   - Date range picker (react-day-picker)
   - Multi-select for categories and tags
   - Author autocomplete

2. **API Enhancement**
   - Extend `/api/wiki` to accept filter parameters
   - Modify tsvector query with additional WHERE clauses
   - Combine filters with AND logic

3. **Search Parameters**
   - `dateFrom`, `dateTo` → filter by createdAt/updatedAt
   - `author` → filter by lastEditedBy
   - `category` → exact match
   - `tags` → array contains (Prisma `hasSome`)
   - `minViews`, `maxViews` → popularity filter

4. **URL State Management**
   - Serialize filters to URL query params
   - Shareable filtered search URLs
   - Browser back/forward support

### Dependencies

- `react-day-picker` for date range selection
- `@headlessui/react` for filter dropdowns
- URL state management utility (or `nuqs`)

### Technical Considerations

- Filter combination performance (ensure indexes support common combinations)
- Empty state when filters return no results
- Reset filters UX
- Mobile filter drawer vs desktop sidebar

### Acceptance Criteria

- [ ] Can filter by date range with calendar picker
- [ ] Multi-select categories and tags
- [ ] Author autocomplete from lastEditedBy values
- [ ] Filters combine with AND logic
- [ ] URL updates with filter state (shareable)
- [ ] Clear all filters button
- [ ] Filter count badges show active filters

---

## Enhancement 4: Export Features for Analytics Dashboard

**Priority:** Low
**Complexity:** 3 story points
**User Value:** Reporting and external analysis

### Description

Analytics dashboard currently displays data in UI only. Export functionality would allow downloading data as CSV or JSON for further analysis in Excel, Tableau, or custom scripts.

### Implementation Approach

1. **Export API Endpoints**
   - `GET /api/wiki/analytics/export?format=csv` → CSV file download
   - `GET /api/wiki/analytics/export?format=json` → JSON file download
   - Optional: `?range=7d|30d|90d` for date range selection

2. **CSV Generation**
   - Use `papaparse` or native CSV formatting
   - Include headers: Page Title, Path, Views, Unique Visitors, Avg Read Time, Helpful Ratio, Popularity, Trend
   - Timestamp in filename: `wiki-analytics-2025-11-11.csv`

3. **UI Integration**
   - Add "Export" button to analytics page header
   - Dropdown for format selection (CSV/JSON)
   - Download progress indicator for large exports

4. **Data Scope**
   - Top pages export (with all metrics)
   - Trending tags export (tag, count)
   - Feedback funnel export (positive, negative, ratio)
   - View timeline export (date, count)

### Dependencies

- `papaparse` (CSV generation)
- Browser download utilities (or file-saver)

### Technical Considerations

- Large datasets may require streaming or pagination (batch downloads)
- Rate limiting to prevent abuse
- Data privacy (ensure no PII in analytics exports)
- Filename sanitization

### Acceptance Criteria

- [ ] Export button on analytics dashboard
- [ ] CSV format with proper headers and encoding (UTF-8)
- [ ] JSON format with structured data
- [ ] Filename includes timestamp
- [ ] Downloads trigger browser save dialog
- [ ] All 4 analytics sections exportable separately or combined

---

## Prioritization Recommendation

Based on user value and implementation complexity:

1. **High Priority:** Enhancement 2 (Diff Visualization) - Critical for content review workflows
2. **Medium Priority:** Enhancement 3 (Advanced Search Filters) - Improves discoverability
3. **Medium Priority:** Enhancement 1 (Real-Time Analytics) - Nice-to-have engagement feature
4. **Low Priority:** Enhancement 4 (Export Features) - Limited use case (primarily admin/reporting)

### Suggested Implementation Order

**Sprint 3:**
- Enhancement 2 (Diff Visualization) - High user value, builds on existing versioning

**Sprint 4:**
- Enhancement 3 (Advanced Search Filters) - Complements existing search, moderate complexity

**Sprint 5 or Later:**
- Enhancement 1 (Real-Time Analytics) - Requires infrastructure (WebSocket/Redis)
- Enhancement 4 (Export Features) - Low complexity, can be quick win

---

## Migration Notes

**Note:** All database migrations for US-023, US-024, and US-025 have already been applied to the Mac mini production database (`postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev`). No additional migration steps are required for these enhancements until implementation begins.

### Applied Migrations (Sprint 2 Week 3)

- ✅ `202511111540_baseline_schema` - Baseline existing tables
- ✅ `202511111600_wiki_versioning_foundation` - WikiRevision, WikiPageEvent, WikiPageAnalytics models
- ✅ `20251111170322_wiki_full_text_search` - content_tsv tsvector column + GIN index

### Future Migration Requirements

When implementing these enhancements:

1. **Enhancement 1 (Real-Time Analytics):** No schema changes required (uses existing WikiPageEvent)
2. **Enhancement 2 (Diff Visualization):** Modify `WikiRevision.diffSummary` from `String?` to `Json?` for structured diff metadata
3. **Enhancement 3 (Advanced Search):** Add indexes for common filter combinations (e.g., category + createdAt)
4. **Enhancement 4 (Export Features):** No schema changes required (read-only feature)

---

## References

- [US-023: Wiki Versioning and History](../../docs/12-Backlog.md#us-023)
- [US-024: Full-Text Search](../../docs/12-Backlog.md#us-024)
- [US-025: Analytics Dashboard](../../docs/12-Backlog.md#us-025)
- [Sprint 2 Week 3 Session](../task/current-session-20251111-1459.md)
- [Database Schema](.agent/system/database-schema.md)
- [API Catalog](.agent/system/api-catalog.md)

---

**Last Updated:** 2025-11-11
**Approved By:** Pending review
**Target Sprint:** TBD (Sprint 3-5 recommendations above)
