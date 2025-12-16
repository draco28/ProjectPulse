# Sprint 7 Day 13: Health Dashboard UI - Resume Prompt

**Copy-paste this into your next Claude Code session:**

---

## Session Resume: Sprint 7 Day 13 - Health Dashboard UI (US-119)

**Context:** Sprint 7 Week 2 - Health Monitoring System
**Status:** Day 12 COMPLETE (backend done) → Day 13 NEXT (UI required)
**Story Points:** 0 assigned BUT **REQUIRED EXIT CRITERIA** for Sprint 7

---

### What's Already Built (Days 8-12) ✅

**Backend Infrastructure (100% complete):**
1. **Database Schema** (Day 8):
   - `HealthScanner` table (tracks scanner configurations)
   - `HealthFinding` table (stores scanner results)
   - `HealthScore` table (stores calculated scores)

2. **Scanners** (Days 8-10):
   - SEMGREP (security) - CLI-based
   - ESLINT (quality) - ESLint API
   - AXECORE (accessibility) - Playwright + AxeBuilder
   - LIGHTHOUSE (accessibility) - Node.js API

3. **Score Calculator** (Day 11):
   - Weighted formula: 40% security, 30% quality, 20% a11y, 10% debt
   - Grade assignment: A (90+), B (80-89), C (70-79), D (60-69), F (<60)
   - Location: `apps/web/lib/health/scoring/`

4. **MCP Tools** (Day 12):
   - `health.runScan` - Execute scanners + store findings + calculate score
   - `health.getScore` - Retrieve latest scores with trend analysis
   - `health.getHistory` - Historical trends with linear regression
   - Location: `apps/web/lib/mcp/handlers/health-handler.ts`

**What's Missing: Health Dashboard UI** ❌

---

### Day 13 Requirements

**Transform Security Page → Project Health Page**

**Required Components:**

1. **Page Location:**
   ```
   apps/web/app/(dashboard)/health/page.tsx
   ```
   (Transform from `security/page.tsx`)

2. **API Route:**
   ```
   apps/web/app/api/projects/[id]/health/route.ts
   ```
   - GET endpoint returning:
     - Latest health score
     - Category breakdowns (security, quality, a11y, debt)
     - Trend data (last 30 days)
     - Recent scanner findings

3. **UI Components:**

   **a) Health Overview Card:**
   - Overall score (0-100) with color gradient
   - Grade badge (A-F) with appropriate styling
   - Trend indicator (↑ improving / ↓ declining / → stable)
   - Last scan timestamp
   - "Run New Scan" button (calls MCP tool)

   **b) Category Breakdown Chart:**
   - Security (40% weight) - horizontal bar with score
   - Quality (30% weight) - horizontal bar with score
   - Accessibility (20% weight) - horizontal bar with score
   - Technical Debt (10% weight) - horizontal bar with score
   - Color coding: Green (90+), Yellow (70-89), Red (<70)

   **c) Historical Trend Graph:**
   - Line chart showing overall score over time
   - X-axis: Date (last 30 days)
   - Y-axis: Score (0-100)
   - Data source: `HealthScore` table, `calculatedAt` column
   - Use Recharts or similar charting library

   **d) Scanner Findings Table:**
   - Columns:
     - Category (Security/Quality/Accessibility/Debt)
     - Severity (CRITICAL/HIGH/MEDIUM/LOW)
     - Message (finding description)
     - File (file path)
     - Line (line number)
     - Scanner Type (SEMGREP/ESLINT/AXECORE/LIGHTHOUSE)
   - Filters:
     - Category dropdown
     - Severity dropdown
     - Scanner type dropdown
   - Pagination: 50 findings per page
   - Click row → expand to show code snippet

4. **Navigation Update:**
   - Update sidebar: Change "Security" link → "Health"
   - Route: `/health` (was `/security`)
   - Icon: Activity or Heart icon (was Shield)

---

### Technical Implementation Guide

**Step 1: Create API Route**

```typescript
// apps/web/app/api/projects/[id]/health/route.ts
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = parseInt(params.id);

  // Get latest score
  const latestScore = await prisma.healthScore.findFirst({
    where: { projectId },
    orderBy: { calculatedAt: 'desc' },
  });

  // Get historical scores (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const historicalScores = await prisma.healthScore.findMany({
    where: {
      projectId,
      calculatedAt: { gte: thirtyDaysAgo },
    },
    orderBy: { calculatedAt: 'asc' },
    select: {
      overallScore: true,
      calculatedAt: true,
    },
  });

  // Get recent findings
  const findings = await prisma.healthFinding.findMany({
    where: {
      scanner: { projectId },
      falsePositive: false,
    },
    orderBy: { scanDate: 'desc' },
    take: 100,
    include: {
      scanner: { select: { type: true } },
    },
  });

  // Calculate trend
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (historicalScores.length >= 2) {
    const oldest = historicalScores[0]!.overallScore;
    const newest = historicalScores[historicalScores.length - 1]!.overallScore;
    const change = newest - oldest;
    trend = change > 2 ? 'improving' : change < -2 ? 'declining' : 'stable';
  }

  return NextResponse.json({
    latestScore,
    historicalScores,
    findings,
    trend,
  });
}
```

**Step 2: Create Page Component**

```typescript
// apps/web/app/(dashboard)/health/page.tsx
import { HealthOverview } from '@/components/health/HealthOverview';
import { CategoryBreakdown } from '@/components/health/CategoryBreakdown';
import { TrendGraph } from '@/components/health/TrendGraph';
import { FindingsTable } from '@/components/health/FindingsTable';

export default async function HealthPage() {
  const projectId = 1; // Get from context/params

  const data = await fetch(`http://localhost:3000/api/projects/${projectId}/health`).then(r => r.json());

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Project Health</h1>

      <HealthOverview
        score={data.latestScore?.overallScore}
        grade={data.latestScore?.grade}
        trend={data.trend}
        lastScan={data.latestScore?.calculatedAt}
      />

      <CategoryBreakdown
        security={data.latestScore?.securityScore}
        quality={data.latestScore?.qualityScore}
        accessibility={data.latestScore?.accessibilityScore}
        debt={data.latestScore?.performanceScore}
      />

      <TrendGraph data={data.historicalScores} />

      <FindingsTable findings={data.findings} />
    </div>
  );
}
```

**Step 3: Create Components**

Create these in `apps/web/components/health/`:
- `HealthOverview.tsx`
- `CategoryBreakdown.tsx`
- `TrendGraph.tsx`
- `FindingsTable.tsx`

**Step 4: Update Sidebar**

Modify `apps/web/components/layout/Sidebar.tsx`:
- Change "Security" → "Health"
- Update route: `/security` → `/health`
- Update icon: Shield → Activity

---

### Success Criteria

- [ ] Page accessible at `http://192.168.1.15:3000/health`
- [ ] Shows latest health score with correct grade (A-F)
- [ ] Displays category breakdowns with correct percentages
- [ ] Trend graph shows historical data (last 30 days)
- [ ] Findings table displays all scanner results
- [ ] Filters work (category, severity, scanner type)
- [ ] Pagination works (50 per page)
- [ ] "Run New Scan" button calls MCP tool
- [ ] Sidebar updated (Security → Health)
- [ ] TypeScript 0 errors
- [ ] Component tests written

---

### Dependencies & References

**Database Tables:**
- `HealthScanner` (projectId, type, lastRun)
- `HealthFinding` (scannerId, category, severity, message, filePath, lineNumber)
- `HealthScore` (projectId, overallScore, securityScore, qualityScore, accessibilityScore, performanceScore, calculatedAt)

**Existing Backend:**
- Score calculation: `apps/web/lib/health/scoring/calculator.ts`
- MCP tools: `apps/web/lib/mcp/handlers/health-handler.ts`
- Scanners: `apps/web/lib/health/scanners/`

**UI Patterns to Follow:**
- Issues page: `apps/web/app/(dashboard)/issues/page.tsx`
- Dashboard cards: `apps/web/components/dashboard/`
- shadcn/ui components: Card, Table, Badge, Chart

**Charting Library:**
- Install: `pnpm add recharts`
- Or use: Chart.js, Victory, or similar

---

### Estimated Effort

**Time:** 4-6 hours
**Complexity:** Medium (UI integration with existing backend)
**Files to Create:** ~6-8 files
**Lines of Code:** ~800-1000 lines

---

### Notes

- Mac mini server running at `192.168.1.15:3000`
- Docker containers: `docker ps` to check status
- Health check: `curl http://192.168.1.15:3000/api/health`
- All backend code already tested and working ✅

---

**When complete, Sprint 7 will be 100% done! 🎉**
