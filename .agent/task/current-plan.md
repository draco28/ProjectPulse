# Sprint 8.5 Phase 1: Development Cycle UI + Roadmap Materialization

**Phase**: Sprint 8.5 Phase 1 of 4
**Story Points**: 9 points
**Duration**: 2.5 days
**Status**: READY TO START
**Created**: 2025-11-17
**Dependencies**: None (Session 3 infrastructure exists)

---

## Executive Summary

### Goal
Create `/roadmap` page to visualize 5-level hierarchy (Phase → Week → Day → Task → Session) with progress tracking, PLUS add materialization tool to populate hierarchy from Session 3.

### Why Critical
- Sprint 9 Memory Banks need visual roadmap reference
- Sprint 11 Auto-Docs need queryable roadmap structure
- Humans need to monitor agent progress
- **NEW**: Session 3 creates Roadmap (JSON) but NOT Phase/Week/Day records
- **BLOCKER**: Without materialization, Development Cycle UI shows empty tree

### Key Challenge
Two parallel roadmap systems:
1. **Roadmap table** (JSON) - Created by Session 3, used by Blueprint View
2. **Phase/Week/Day/Task tables** (normalized) - Used by Development Cycle UI

**Solution**: Add `projectpulse.roadmap.materialize()` MCP tool in Session 3 to bridge the gap.

---

## Implementation Plan

### Part A: Roadmap Materialization (NEW - 1 point, 3-4 hours)

#### Step 1: Database Schema Migration

**File**: `apps/web/prisma/migrations/YYYYMMDD_add_dev_session_fk/migration.sql`

**Purpose**: Add foreign key relationships to DevelopmentSession for linking to hierarchy

**Migration SQL**:
```sql
-- Add FK columns
ALTER TABLE "DevelopmentSession" ADD COLUMN "phaseId" TEXT;
ALTER TABLE "DevelopmentSession" ADD COLUMN "weekId" TEXT;
ALTER TABLE "DevelopmentSession" ADD COLUMN "dayId" TEXT;
ALTER TABLE "DevelopmentSession" ADD COLUMN "taskId" TEXT;

-- Add foreign key constraints
ALTER TABLE "DevelopmentSession" ADD CONSTRAINT "DevelopmentSession_phaseId_fkey"
  FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DevelopmentSession" ADD CONSTRAINT "DevelopmentSession_weekId_fkey"
  FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DevelopmentSession" ADD CONSTRAINT "DevelopmentSession_dayId_fkey"
  FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DevelopmentSession" ADD CONSTRAINT "DevelopmentSession_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes for query performance
CREATE INDEX "DevelopmentSession_phaseId_idx" ON "DevelopmentSession"("phaseId");
CREATE INDEX "DevelopmentSession_weekId_idx" ON "DevelopmentSession"("weekId");
CREATE INDEX "DevelopmentSession_dayId_idx" ON "DevelopmentSession"("dayId");
CREATE INDEX "DevelopmentSession_taskId_idx" ON "DevelopmentSession"("taskId");
```

**Prisma Schema Update**:
```prisma
model DevelopmentSession {
  // ... existing fields ...

  // NEW: Foreign key relationships
  phaseId String?
  phase   Phase?  @relation(fields: [phaseId], references: [id], onDelete: SetNull)

  weekId  String?
  week    Week?   @relation(fields: [weekId], references: [id], onDelete: SetNull)

  dayId   String?
  day     Day?    @relation(fields: [dayId], references: [id], onDelete: SetNull)

  taskId  String?
  task    Task?   @relation(fields: [taskId], references: [id], onDelete: SetNull)
}
```

**Acceptance**:
- [ ] Migration file created
- [ ] Schema updated with FK columns
- [ ] Foreign key constraints enforced
- [ ] Indexes created for performance
- [ ] `npx prisma migrate dev` runs successfully
- [ ] DevelopmentSession can link to Phase/Week/Day/Task

---

#### Step 2: Materialization MCP Tool

**File**: `apps/mcp-server/src/tools/roadmap/materializeTool.ts` (~150 lines)

**Purpose**: Convert Roadmap.phases JSON → Phase/Week/Day records

**Algorithm**:
```typescript
export const materializeRoadmapTool = {
  name: 'projectpulse.roadmap.materialize',
  description: 'Convert Roadmap JSON phases to normalized Phase/Week/Day records',
  inputSchema: z.object({
    roadmapId: z.string(),
  }),

  async handler({ roadmapId }) {
    // 1. Fetch Roadmap record
    const roadmap = await prisma.roadmap.findUnique({
      where: { id: roadmapId },
    });

    if (!roadmap) throw new Error('Roadmap not found');

    const phases = roadmap.phases as Array<{
      id: number;
      name: string;
      duration: string; // "2 weeks"
      goals: string[];
      deliverables: string[];
      status: string;
    }>;

    const createdIds = { phaseIds: [], weekIds: [], dayIds: [] };

    // 2. Create Phase records
    for (const phaseJson of phases) {
      const startDate = new Date(); // Or calculate from timeline
      const weekCount = parseInt(phaseJson.duration.match(/(\d+)\s*week/)?.[1] || '2');
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (weekCount * 7));

      const phase = await prisma.phase.create({
        data: {
          title: phaseJson.name,
          description: phaseJson.goals.join('\n'),
          status: 'NOT_STARTED',
          progress: 0,
          startDate,
          endDate,
        },
      });

      createdIds.phaseIds.push(phase.id);

      // 3. Create Week records
      for (let w = 1; w <= weekCount; w++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + ((w - 1) * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const week = await prisma.week.create({
          data: {
            title: `Week ${w}`,
            status: 'NOT_STARTED',
            progress: 0,
            startDate: weekStart,
            endDate: weekEnd,
            phaseId: phase.id,
          },
        });

        createdIds.weekIds.push(week.id);

        // 4. Create Day records (5 days per week, Mon-Fri)
        for (let d = 1; d <= 5; d++) {
          const dayStart = new Date(weekStart);
          dayStart.setDate(dayStart.getDate() + (d - 1));

          const day = await prisma.day.create({
            data: {
              title: `Day ${d}`,
              status: 'NOT_STARTED',
              progress: 0,
              startDate: dayStart,
              weekId: week.id,
            },
          });

          createdIds.dayIds.push(day.id);
        }
      }
    }

    return {
      success: true,
      ...createdIds,
      message: `Created ${createdIds.phaseIds.length} phases, ${createdIds.weekIds.length} weeks, ${createdIds.dayIds.length} days`,
    };
  },
};
```

**Error Handling**:
- Roadmap not found → throw error
- Invalid duration format → default to 2 weeks
- Database constraint violation → rollback transaction

**Acceptance**:
- [ ] Tool implemented and tested
- [ ] Creates Phase/Week/Day records from JSON
- [ ] Returns created IDs
- [ ] Handles errors gracefully
- [ ] Transaction-safe (rollback on error)
- [ ] Unit tests passing (3-4 tests)

---

#### Step 3: Register Tool + Update Session 3

**File 1**: `apps/mcp-server/src/index.ts`
```typescript
import { materializeRoadmapTool } from './tools/roadmap/materializeTool.js';

// In tools array:
const tools = [
  // ... existing tools ...
  materializeRoadmapTool,
];
```

**File 2**: `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts`
```typescript
// After creating Roadmap
const roadmap = await prisma.roadmap.create({ /* ... */ });

// NEW: Materialize hierarchy
const materialized = await materializeRoadmapTool.handler({
  roadmapId: roadmap.id
});

// Store IDs in Session 3 response
await prisma.onboardingSession.update({
  where: { id: sessionId },
  data: {
    response: {
      ...existingResponse,
      roadmapMaterialized: true,
      createdPhaseIds: materialized.phaseIds,
      createdWeekIds: materialized.weekIds,
      createdDayIds: materialized.dayIds,
    },
  },
});
```

**Acceptance**:
- [ ] Tool registered in MCP server
- [ ] Session 3 calls materialize automatically
- [ ] Phase/Week/Day records exist after Session 3
- [ ] IDs stored in Session 3 response

---

### Part B: Development Cycle UI (8 points, ~16 hours)

#### Step 4: Page + Empty State (2 hours)

**File 1**: `apps/web/app/roadmap/page.tsx` (Server Component, ~150 lines)

```typescript
import { prisma } from '@/lib/db';
import { RoadmapTree } from '@/components/roadmap/RoadmapTree';
import { CurrentPositionBanner } from '@/components/roadmap/CurrentPositionBanner';
import { RoadmapFilters } from '@/components/roadmap/RoadmapFilters';
import { EmptyRoadmapState } from '@/components/roadmap/EmptyRoadmapState';

export default async function RoadmapPage() {
  // Fetch all phases with nested includes
  const phases = await prisma.phase.findMany({
    include: {
      weeks: {
        include: {
          days: {
            include: {
              tasks: {
                include: {
                  sessions: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { startDate: 'asc' },
  });

  // Get current position (latest IN_PROGRESS task)
  const currentTask = await prisma.task.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      day: {
        include: {
          week: {
            include: {
              phase: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Handle empty state
  if (phases.length === 0) {
    return <EmptyRoadmapState />;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Development Cycle</h1>

      {currentTask && (
        <CurrentPositionBanner currentTask={currentTask} />
      )}

      <RoadmapFilters />

      <RoadmapTree phases={phases} />
    </div>
  );
}
```

**File 2**: `apps/web/components/roadmap/EmptyRoadmapState.tsx` (~40 lines)

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function EmptyRoadmapState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <h2 className="text-2xl font-bold mb-4">No Roadmap Yet</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        Complete onboarding Session 3 to generate your project roadmap with phases, weeks, and days.
      </p>
      <Button asChild>
        <Link href="/onboarding">Start Onboarding</Link>
      </Button>
    </div>
  );
}
```

**Acceptance**:
- [ ] Page accessible at `/roadmap`
- [ ] Empty state shows when no phases
- [ ] Data fetches correctly with nested includes
- [ ] Loading states implemented
- [ ] Error boundaries in place

---

#### Step 5: Tree Component (2 hours)

**File**: `apps/web/components/roadmap/RoadmapTree.tsx` (Client, ~100 lines)

```typescript
'use client';

import { useState } from 'react';
import { PhaseCard } from './PhaseCard';

interface RoadmapTreeProps {
  phases: PhaseWithNested[];
}

export function RoadmapTree({ phases }: RoadmapTreeProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {phases.map((phase) => (
        <PhaseCard
          key={phase.id}
          phase={phase}
          isExpanded={expandedPhases.has(phase.id)}
          onToggle={() => togglePhase(phase.id)}
        />
      ))}
    </div>
  );
}
```

**Acceptance**:
- [ ] Tree renders hierarchy
- [ ] Expand/collapse works
- [ ] State management correct
- [ ] Keyboard navigation (optional)

---

#### Step 6: Hierarchy Card Components (3-4 hours)

**Pattern**: All cards follow same structure:
- Card header with title + status badge
- Progress bar (0-100%)
- Meta info (child count, dates)
- Click to expand children

**File 1**: `apps/web/components/roadmap/PhaseCard.tsx` (~80 lines)
**File 2**: `apps/web/components/roadmap/WeekCard.tsx` (~70 lines)
**File 3**: `apps/web/components/roadmap/DayCard.tsx` (~70 lines)
**File 4**: `apps/web/components/roadmap/TaskCard.tsx` (~60 lines)

**Example (PhaseCard.tsx)**:
```typescript
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { WeekCard } from './WeekCard';

interface PhaseCardProps {
  phase: PhaseWithWeeks;
  isExpanded: boolean;
  onToggle: () => void;
}

export function PhaseCard({ phase, isExpanded, onToggle }: PhaseCardProps) {
  const statusColors = {
    NOT_STARTED: 'bg-gray-500',
    IN_PROGRESS: 'bg-blue-500',
    COMPLETE: 'bg-green-500',
    BLOCKED: 'bg-red-500',
  };

  return (
    <Card className="p-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronDown /> : <ChevronRight />}
          <h3 className="text-lg font-semibold">{phase.title}</h3>
          <Badge className={statusColors[phase.status]}>
            {phase.status}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {phase.weeks.length} weeks
          </span>
          <span className="text-sm font-medium">{phase.progress}%</span>
        </div>
      </div>

      <Progress value={phase.progress} className="mt-3" />

      {isExpanded && (
        <div className="mt-4 space-y-2">
          {phase.weeks.map((week) => (
            <WeekCard key={week.id} week={week} />
          ))}
        </div>
      )}
    </Card>
  );
}
```

**Acceptance**:
- [ ] All 4 cards implemented
- [ ] Consistent styling
- [ ] Progress visualization works
- [ ] Click to expand works
- [ ] Status badges display correctly

---

#### Step 7: Current Position Banner (1.5 hours)

**File**: `apps/web/components/roadmap/CurrentPositionBanner.tsx` (~60 lines)

```typescript
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface CurrentPositionBannerProps {
  currentTask: TaskWithHierarchy;
}

export function CurrentPositionBanner({ currentTask }: CurrentPositionBannerProps) {
  const { day, week, phase } = currentTask;

  return (
    <Card className="p-4 mb-6 bg-accent-primary/10">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-5 w-5 text-accent-primary" />
        <h2 className="text-lg font-semibold">You Are Here</h2>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{phase.title}</span>
        <span>→</span>
        <span>{week.title}</span>
        <span>→</span>
        <span>{day.title}</span>
        <span>→</span>
        <span className="font-medium text-foreground">{currentTask.title}</span>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-4">
        <div>
          <p className="text-xs text-muted-foreground">Phase Progress</p>
          <p className="text-lg font-semibold">{phase.progress}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Week Progress</p>
          <p className="text-lg font-semibold">{week.progress}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Day Progress</p>
          <p className="text-lg font-semibold">{day.progress}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Task Progress</p>
          <p className="text-lg font-semibold">{currentTask.progress}%</p>
        </div>
      </div>
    </Card>
  );
}
```

**Acceptance**:
- [ ] Banner shows current position
- [ ] Breadcrumb navigates correctly
- [ ] Progress indicators display
- [ ] Handles null case (no active task)

---

#### Step 8: Roadmap Filters (2 hours)

**File**: `apps/web/components/roadmap/RoadmapFilters.tsx` (~50 lines)

```typescript
'use client';

import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

export function RoadmapFilters() {
  const [status, setStatus] = useState<string[]>([]);
  const [progressRange, setProgressRange] = useState([0, 100]);

  return (
    <div className="flex gap-4 mb-6">
      <Select
        multiple
        value={status}
        onChange={setStatus}
        placeholder="Filter by status"
      >
        <option value="IN_PROGRESS">In Progress</option>
        <option value="COMPLETE">Complete</option>
        <option value="BLOCKED">Blocked</option>
        <option value="PENDING">Pending</option>
      </Select>

      <div className="flex-1">
        <label className="text-sm mb-2 block">Progress Range</label>
        <Slider
          min={0}
          max={100}
          step={5}
          value={progressRange}
          onValueChange={setProgressRange}
        />
      </div>

      <Button variant="outline" onClick={() => {
        setStatus([]);
        setProgressRange([0, 100]);
      }}>
        Reset
      </Button>
    </div>
  );
}
```

**Acceptance**:
- [ ] Filters work correctly
- [ ] Tree updates on filter change
- [ ] Multiple filters combinable
- [ ] Reset button clears filters

---

#### Step 9: Navigation Integration (30 min)

**File**: `apps/web/components/Sidebar.tsx` (~5 lines added)

```typescript
import { Map } from 'lucide-react';

// Add to navigation items:
{
  href: '/roadmap',
  icon: Map,
  label: 'Development Cycle',
  badge: null,
}
```

**Acceptance**:
- [ ] Link visible in sidebar
- [ ] Navigates to `/roadmap`
- [ ] Active state works
- [ ] Icon displays correctly

---

### Part C: Testing (3-4 hours)

#### Step 10: E2E Tests

**File**: `apps/web/tests/e2e/roadmap.spec.ts` (5-7 tests)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Development Cycle Roadmap', () => {
  test('should display page layout', async ({ page }) => {
    await page.goto('/roadmap');
    await expect(page.locator('h1')).toContainText('Development Cycle');
  });

  test('should show empty state when no roadmap', async ({ page }) => {
    // Assuming no phases exist
    await page.goto('/roadmap');
    await expect(page.getByText('No Roadmap Yet')).toBeVisible();
    await expect(page.getByText('Start Onboarding')).toBeVisible();
  });

  test('should display phase cards', async ({ page }) => {
    // Assuming phases exist
    await page.goto('/roadmap');
    await expect(page.getByText(/Phase \d+/)).toBeVisible();
    await expect(page.getByText(/\d+%/)).toBeVisible();
  });

  test('should expand/collapse phases', async ({ page }) => {
    await page.goto('/roadmap');
    const phaseCard = page.locator('[data-testid="phase-card"]').first();
    await phaseCard.click();
    await expect(page.getByText('Week 1')).toBeVisible();
    await phaseCard.click();
    await expect(page.getByText('Week 1')).not.toBeVisible();
  });

  test('should show current position banner', async ({ page }) => {
    await page.goto('/roadmap');
    await expect(page.getByText('You Are Here')).toBeVisible();
  });

  test('should filter by status', async ({ page }) => {
    await page.goto('/roadmap');
    await page.selectOption('select[name="status"]', 'IN_PROGRESS');
    await expect(page.getByText('COMPLETE')).not.toBeVisible();
  });
});
```

**Acceptance**:
- [ ] 5-7 tests created
- [ ] All tests passing
- [ ] Coverage >80%

---

#### Step 11: Integration Testing (1 hour)

**Manual Tests**:
1. Complete Session 3 → verify Phase/Week/Day records created
2. Navigate to `/roadmap` → verify tree displays
3. Agent calls `sprint.checkpoint` → verify UI updates
4. Expand all levels → verify nested data loads

**Checklist**:
- [ ] Session 3 → roadmap flow works
- [ ] Phase/Week/Day records exist
- [ ] Agent updates reflected in UI
- [ ] No console errors
- [ ] Performance <3s page load

---

## Success Criteria

### Functional Requirements
- ✅ `/roadmap` page accessible from sidebar
- ✅ Phase/Week/Day/Task/Session hierarchy displayed
- ✅ Progress bars show completion percentage
- ✅ Status badges show current state
- ✅ Tree expands/collapses correctly
- ✅ "You are here" banner shows current position
- ✅ Filters work (status, progress)
- ✅ Empty state handles no-roadmap case

### Technical Requirements
- ✅ Session 3 creates Phase/Week/Day records automatically
- ✅ Materialization tool tested
- ✅ Server Components for data fetching
- ✅ Client Components for interactivity
- ✅ Proper error handling
- ✅ Database queries optimized (nested includes)
- ✅ FK relationships enable session-to-hierarchy linking

### Testing Requirements
- ✅ 5-7 E2E tests passing
- ✅ Manual integration tests passed
- ✅ No regression in existing tests
- ✅ Performance targets met (<3s page load)

---

## Dependencies

**External**:
- ✅ Phase/Week/Day/Task/Session models exist (Sprint 1)
- ✅ API endpoint `/api/hierarchy/query` functional (Sprint 1)
- ✅ MCP tools exist (`sprint.checkpoint`, `sprint.updateProgress`)
- ✅ OnboardingSession stores Session 3 data (Sprint 2)
- ✅ Roadmap model with phases JSON (Sprint 2)

**Internal**:
- Part A must complete before Part B (materialization enables UI)
- Part B components build on each other (Page → Tree → Cards → Banner → Filters)
- Part C tests require Parts A+B complete

---

## File Inventory

### New Files (15 total)

**MCP/Backend** (3 files):
1. `apps/web/prisma/migrations/*/migration.sql`
2. `apps/mcp-server/src/tools/roadmap/materializeTool.ts`
3. `apps/mcp-server/src/tools/roadmap/__tests__/materializeTool.test.ts`

**Frontend** (9 files):
4. `apps/web/app/roadmap/page.tsx`
5. `apps/web/components/roadmap/EmptyRoadmapState.tsx`
6. `apps/web/components/roadmap/RoadmapTree.tsx`
7. `apps/web/components/roadmap/PhaseCard.tsx`
8. `apps/web/components/roadmap/WeekCard.tsx`
9. `apps/web/components/roadmap/DayCard.tsx`
10. `apps/web/components/roadmap/TaskCard.tsx`
11. `apps/web/components/roadmap/CurrentPositionBanner.tsx`
12. `apps/web/components/roadmap/RoadmapFilters.tsx`

**Tests** (3 files):
13. `apps/web/tests/e2e/roadmap.spec.ts`
14. `apps/mcp-server/src/tools/__tests__/materializeTool.test.ts`
15. `apps/mcp-server/src/tools/__tests__/getBlueprintTool.test.ts`

### Modified Files (3 total)
1. `apps/mcp-server/src/index.ts` - Register materializeTool
2. `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts` - Call materialize
3. `apps/web/components/Sidebar.tsx` - Add Development Cycle link

---

## Risks & Mitigations

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| Session 3 data structure changes | HIGH | Well-defined in 3-session-onboarding-REFERENCE.md | ✅ Mitigated |
| Materialization fails during Session 3 | HIGH | Transaction rollback, clear error messages | ⚠️ Need testing |
| UI complexity exceeds estimate | MEDIUM | Reuse existing components (StatCard patterns) | ✅ Mitigated |
| Performance issues with large hierarchies | MEDIUM | Implement pagination/lazy loading if needed | ⚠️ Monitor |
| Empty state not handled | LOW | Implemented in Step 4 | ✅ Mitigated |

---

## Next Steps After Phase 1

- **Phase 2**: Blueprint MCP Tool (agents query Session 3 data)
- **Phase 3**: Agent AI Hub Tabs (skills, workflows, config management)
- **Phase 4**: MCP Read Tools (efficient hierarchy queries)

---

**Plan Created**: 2025-11-17
**Source**: sprint8.5-plan.md + 3-session-onboarding-REFERENCE.md analysis
**Review Cycle**: Daily checkpoints at 15K tokens
