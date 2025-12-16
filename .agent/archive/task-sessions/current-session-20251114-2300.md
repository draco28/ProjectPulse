# Sprint 7 Day 13: Health Dashboard UI Implementation Session

**Session Started**: 2025-11-14 23:00
**Phase**: Sprint 7 Week 2 - Health Monitoring System
**User Story**: US-119 (Health Dashboard UI) - REQUIRED EXIT CRITERIA
**Story Points**: 0 assigned (but required for Sprint 7 completion)
**Status**: Planning phase

---

## Session Context

### What's Already Complete ✅

**Backend Infrastructure (Days 8-12 - 19 points)**:
- Database schema: HealthScanner, HealthFinding, HealthScore (3 models, 4 enums, 8 indexes)
- 4 Scanners: SEMGREP (security), ESLINT (quality), AXECORE (accessibility), LIGHTHOUSE (performance)
- Score calculator: Weighted formula (40% security, 30% quality, 20% a11y, 10% debt)
- 3 MCP tools: health.runScan, health.getScore, health.getHistory
- Total: 2,108 lines of production-ready backend code
- All tests passing: 37 unit tests + 6 integration tests

### What Needs Building (Day 13 - REQUIRED)

**Health Dashboard UI** - Transform Security page → Project Health page:
1. **API Route**: `GET /api/projects/[id]/health` endpoint
2. **Page**: `app/(dashboard)/health/page.tsx`
3. **Components** (4 required):
   - HealthOverviewCard: Overall score, grade badge, trend, last scan timestamp
   - CategoryBreakdown: 4 horizontal bars (Security 40%, Quality 30%, A11y 20%, Debt 10%)
   - TrendGraph: Line chart showing 30-day historical scores
   - FindingsTable: Scanner findings with filters (category, severity, scanner) + pagination
4. **Navigation**: Update Sidebar.tsx (Security → Health, /security → /health, Shield → Activity icon)

### Research Findings from Plan Agent

**Existing Patterns to Follow**:
- Issues page structure: Server Component + async data fetching
- Security page components: SecurityScoreMeter (reusable), VulnerabilityCard pattern
- Dashboard cards: neu-raised neumorphic design, rounded-3xl, coral-gradient buttons
- Available components: Card, Badge, Button (from shadcn/ui)

**Dependencies Needed**:
- recharts library (for TrendGraph component) - install on Mac mini

**Key Technical Decisions**:
- Project ID: Hardcode to 1 for now (future: from context/params)
- Data fetching: Server Component with parallel Prisma queries
- Filters: Client Component for interactivity
- Pagination: 50 findings per page

---

## Implementation Plan

### Phase 1: Dependencies (Mac mini)
- Install recharts: `pnpm add recharts`

### Phase 2: API Route (1 file)
- Create `app/api/projects/[id]/health/route.ts`
- Query latest HealthScore
- Query historical scores (last 30 days with date filter)
- Query HealthFindings with scanner join
- Calculate trend (improving/declining/stable based on oldest vs newest)

### Phase 3: UI Components (6 files)
1. **HealthOverviewCard.tsx** - Score meter + grade badge + trend indicator
2. **CategoryBreakdown.tsx** - 4 horizontal bars with scores and color coding
3. **TrendGraph.tsx** - Recharts LineChart with 30-day data
4. **FindingRow.tsx** - Individual finding display card
5. **FindingsTable.tsx** - Main table with filters and pagination
6. **HealthFilter.tsx** - Filter controls (category, severity, scanner dropdowns)

### Phase 4: Main Page (1 file)
- Create `app/(dashboard)/health/page.tsx`
- Fetch data from API route
- Layout all components with neumorphic design
- Header with title + "Run New Scan" button

### Phase 5: Navigation (1 file modified)
- Update `components/Sidebar.tsx`
- Change "Security" → "Health"
- Update route: `/security` → `/health`
- Update icon: Shield → Activity

### Phase 6: Testing & Verification
- TypeScript compilation check
- Manual testing at http://192.168.1.15:3000/health
- Verify all data displays correctly
- Test filters and pagination
- Verify neumorphic design consistency

---

## Success Criteria

**Functional**:
- [ ] Page accessible at `/health`
- [ ] Latest health score displays with correct grade (A-F)
- [ ] Category breakdown shows 4 bars with correct percentages
- [ ] Trend graph renders historical data (last 30 days)
- [ ] Findings table displays all scanner results
- [ ] Filters work (category, severity, scanner type)
- [ ] Pagination works (50 per page)
- [ ] "Run New Scan" button integrated
- [ ] Sidebar navigation updated

**Quality**:
- [ ] TypeScript: 0 errors
- [ ] Neumorphic coral theme maintained
- [ ] Components follow existing patterns
- [ ] Responsive design
- [ ] Performance: <200ms page load

---

## Estimated Effort

- **Dependencies**: 5 minutes
- **API Route**: 45 minutes (241 lines)
- **Components**: 3 hours (6 components, ~1,200 lines total)
- **Main Page**: 45 minutes (250 lines)
- **Navigation**: 15 minutes (small modification)
- **Testing**: 1 hour (manual testing + TypeScript check)

**Total**: 4-6 hours (800-1000 LOC as estimated in resume file)

---

## Files Summary

**To Create** (8 files, ~1,700 lines):
1. `app/api/projects/[id]/health/route.ts` (~240 lines)
2. `app/(dashboard)/health/page.tsx` (~250 lines)
3. `components/health/HealthOverviewCard.tsx` (~200 lines)
4. `components/health/CategoryBreakdown.tsx` (~180 lines)
5. `components/health/TrendGraph.tsx` (~220 lines)
6. `components/health/FindingRow.tsx` (~150 lines)
7. `components/health/FindingsTable.tsx` (~300 lines)
8. `components/health/HealthFilter.tsx` (~180 lines)

**To Modify** (1 file):
1. `components/Sidebar.tsx` (change link: Security → Health)

---

## Blockers & Dependencies

**Blockers**: None - all backend infrastructure complete ✅

**Dependencies**:
- recharts library (to be installed)
- Mac mini services running at 192.168.1.15:3000

---

**This session will complete Sprint 7 (100%) when Day 13 is done!** 🎯
