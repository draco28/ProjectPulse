# Sprint 8.5 Phase 1: Development Roadmap Materialization + UI

**Phase**: Sprint 8.5 Phase 1 of 4
**Story Points**: 12 points
**Duration**: 3.75 days (~30 hours)
**Status**: READY TO START
**Created**: 2025-11-17 (Updated with full alignment + gap fixes)
**Dependencies**: Session 2 creates 13-Project-Plan.md content in Document table, Session 3 infrastructure exists

---

## Executive Summary

### Goal
Create complete Development Roadmap system with 5-level hierarchy (Phase → Sprint → Week → Day → Task) that:
1. Parses `13-Project-Plan.md` (created in Session 2) to extract roadmap structure
2. Creates Roadmap record with nested JSON phases in Session 3
3. Materializes JSON to normalized Phase/Sprint/Week/Day database tables
4. Displays hierarchical tree UI at `/roadmap` with current position tracking
5. Shows current work (plan/todos) from DevelopmentSession in modal

### Why Critical
- **Sprint 9 Memory Banks** need visual roadmap reference
- **Sprint 11 Auto-Docs** need queryable roadmap structure
- **Humans** need to monitor agent progress in real-time
- **Agents** need to track current position in development cycle
- **BLOCKER**: Without complete flow, Session 3 → Roadmap → UI chain breaks

### Architecture Overview

```
Session 2 (Document Generation):
  ↓
13-Project-Plan.md stored in Document table
  ↓
Session 3 (Roadmap Creation):
  ↓
Parse markdown → Extract Phase/Sprint/Week structure
  ↓
Create Roadmap record with phases JSON:
{
  "phases": [
    {
      "name": "Phase A",
      "sprints": [
        { "name": "Sprint 1", "weeks": [...] }
      ]
    }
  ]
}
  ↓
Materialize JSON → Normalized tables:
Phase records
  ↓
Sprint records (NEW - 5th level)
  ↓
Week records
  ↓
Day records (5 per week, Mon-Fri)
  ↓
UI displays 5-level hierarchy tree:
📦 Phase → 📅 Sprint → 📆 Week → 📆 Day → 📋 Task
  ↓
Current Position Banner shows: "Phase A → Sprint 2 → Week 4 → Tuesday"
  ↓
Click "View Current Plan" → Modal shows DevelopmentSession.plan + .todos
```

---

## Implementation Plan

### Part 0: Database Schema (NEW - 4 hours, 1 point)

#### Step 0.0: Add Document Model

**File**: `apps/web/prisma/schema.prisma`

**Purpose**: Store Session 2 generated documents (15 industry docs including 13-Project-Plan.md)

**Why This Model**: Agent generates content → calls MCP → saves to Document table (NOT files in repo)

**Schema Addition** (from 3-session-onboarding-REFERENCE.md):
```prisma
model Document {
  id                  String            @id @default(cuid())
  onboardingSessionId String
  onboardingSession   OnboardingSession @relation(fields: [onboardingSessionId], references: [id], onDelete: Cascade)

  // Document details
  filename    String  // "01-PRD.md", "13-Project-Plan.md"
  content     String  @db.Text // Full markdown content (Session 2 generates this)
  wordCount   Int
  generatedAt DateTime @default(now())

  // For wiki integration and categorization
  category String? // "planning" | "architecture" | "implementation" | "operations"
  tags     String[] @default([])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([onboardingSessionId])
  @@index([filename])
  @@unique([onboardingSessionId, filename])
  @@map("documents")
}

// Update OnboardingSession model
model OnboardingSession {
  // ... existing fields ...
  documents Document[] // NEW relationship
}
```

**Migration**:
```bash
npx prisma migrate dev --name add_document_model
```

**Acceptance**:
- [ ] Document model created
- [ ] Foreign key to OnboardingSession
- [ ] content field supports large text (@db.Text)
- [ ] Migration runs successfully
- [ ] Session 2 can save documents via MCP

**Files**:
- `apps/web/prisma/schema.prisma` (UPDATE)
- `apps/web/prisma/migrations/*/add_document_model/migration.sql` (CREATE)

---

#### Step 0.1: Add Roadmap Model

**File**: `apps/web/prisma/schema.prisma`

**Purpose**: Store parsed roadmap structure as JSON before materialization

**Schema Addition**:
```prisma
model Roadmap {
  id            String   @id @default(cuid())
  projectId     Int      @unique  // ✅ FIXED: Int to match Project.id (was String)
  project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Nested JSON structure with phases → sprints → weeks
  phases        Json     @db.JsonB

  // Current position tracking (string references)
  currentPhase  String?  // "Phase A: Foundation"
  currentSprint String?  // "Sprint 2: Wiki System"
  currentWeek   String?  // "Week 4"
  currentDay    String?  // "Tuesday"

  // Relationships
  phases_rel    Phase[]  // After materialization

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("roadmaps")
}

// Update Project model
model Project {
  // ... existing fields ...
  roadmap       Roadmap?
}
```

**Migration**:
```bash
npx prisma migrate dev --name add_roadmap_model
```

**Acceptance**:
- [ ] Roadmap model created with projectId Int (not String)
- [ ] Foreign key to Project works correctly
- [ ] phases JSON field supports nested structure (@db.JsonB)
- [ ] Migration runs successfully
- [ ] Can create Roadmap linked to existing Project

**Files**:
- `apps/web/prisma/schema.prisma` (UPDATE)
- `apps/web/prisma/migrations/*/add_roadmap_model/migration.sql` (CREATE)

---

#### Step 0.2: Add Sprint Model

**File**: `apps/web/prisma/schema.prisma`

**Purpose**: Enable 5-level hierarchy (Phase → **Sprint** → Week → Day → Task)

**Schema Addition**:
```prisma
model Sprint {
  id          String   @id @default(cuid())
  name        String   // "Sprint 1: Foundation Setup"
  description String?
  duration    String   // "2 weeks"
  goals       String[] // ["Establish database", "MCP infrastructure"]
  deliverables String[] // ["Prisma schema", "MCP server"]
  storyPoints Int?     // 52

  status      Status   @default(NOT_STARTED)
  progress    Float    @default(0)  // 0-100%

  startDate   DateTime
  endDate     DateTime

  // Relationships
  phaseId     String
  phase       Phase    @relation(fields: [phaseId], references: [id], onDelete: Cascade)

  weeks       Week[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([phaseId])
  @@map("sprints")
}

// Update Phase model
model Phase {
  // ... existing fields ...
  sprints     Sprint[]  // NEW relationship

  roadmapId   String?
  roadmap     Roadmap?  @relation(fields: [roadmapId], references: [id], onDelete: SetNull)

  @@index([roadmapId])
}

// Update Week model
model Week {
  // ... existing fields ...

  // CHANGE: Link to Sprint instead of Phase
  sprintId    String
  sprint      Sprint   @relation(fields: [sprintId], references: [id], onDelete: Cascade)

  @@index([sprintId])
}
```

**Migration**:
```bash
npx prisma migrate dev --name add_sprint_layer
```

**Acceptance**:
- [ ] Sprint model created with all fields
- [ ] Phase → Sprint relationship works
- [ ] Sprint → Week relationship works
- [ ] Week.phaseId removed, Week.sprintId added
- [ ] Migration runs successfully
- [ ] Database hierarchy: Phase → Sprint → Week → Day → Task

**Files**:
- `apps/web/prisma/schema.prisma` (UPDATE)
- `apps/web/prisma/migrations/*/add_sprint_layer/migration.sql` (CREATE)

---

#### Step 0.3: Update Existing Hierarchy API for Sprint Layer

**File**: `apps/web/app/api/hierarchy/query/route.ts` (and related routes)

**Purpose**: Fix Sprint 8 code that breaks when Week.phaseId → Week.sprintId

**Problem**: Current code queries `week.phase` which will be undefined after Sprint layer added

**Changes Required**:

**1. Update Prisma Includes**:
```typescript
// BEFORE (Sprint 8 - BREAKS after Step 0.2)
const weeks = await prisma.week.findMany({
  include: {
    phase: { select: { id, title } }  // ❌ week.phase doesn't exist anymore
  }
});

// AFTER (Sprint 8.5 - Compatible with Sprint layer)
const weeks = await prisma.week.findMany({
  include: {
    sprint: {
      select: {
        id,
        name,
        phase: { select: { id, title } }  // ✅ Access phase via sprint
      }
    }
  }
});
```

**2. Data Migration Script**:
```typescript
// Create one Sprint per existing Phase for backward compatibility
// Backfill Week.sprintId from Week.phaseId

async function migrateToSprintLayer() {
  const phases = await prisma.phase.findMany({
    include: { weeks: true }
  });

  for (const phase of phases) {
    // Create Sprint for this Phase
    const sprint = await prisma.sprint.create({
      data: {
        name: `${phase.title} - Default Sprint`,
        description: 'Auto-generated for Sprint layer migration',
        duration: '2 weeks',
        goals: [],
        deliverables: [],
        status: phase.status,
        progress: phase.progress,
        startDate: phase.startDate,
        endDate: phase.endDate || new Date(),
        phaseId: phase.id,
      },
    });

    // Update all Weeks in this Phase
    await prisma.week.updateMany({
      where: { phaseId: phase.id },
      data: { sprintId: sprint.id },
    });
  }
}
```

**3. Update Related Routes**:
- `app/api/hierarchy/query/route.ts` - Main hierarchy query
- `app/api/days/[id]/route.ts` - Day detail (if uses week.phase)
- `app/api/tasks/[id]/route.ts` - Task detail (if uses week.phase)
- `app/api/sessions/[id]/route.ts` - Session detail (if uses week.phase)

**Acceptance**:
- [ ] /api/hierarchy/query returns data after migration
- [ ] All queries using week.phase updated to week.sprint.phase
- [ ] Data migration script runs successfully
- [ ] Existing Week records have sprintId populated
- [ ] No 500 errors in Sprint 8 routes

**Files**:
- `apps/web/app/api/hierarchy/query/route.ts` (UPDATE)
- `apps/web/scripts/migrate-sprint-layer.ts` (CREATE - migration script)
- Other API routes using week.phase (UPDATE if needed)

---

#### Step 0.4: Add DevelopmentSession Model

**File**: `apps/web/prisma/schema.prisma`

**Purpose**: Store agent's current work (plan + todos) for CurrentWorkModal display

**Why This Model**: Agent creates session → saves plan/todos → modal displays them

**Schema Addition** (from 3-session-onboarding-REFERENCE.md):
```prisma
model DevelopmentSession {
  id          String   @id @default(cuid())
  projectId   Int
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Session context
  phase       String   // "Sprint 2 - Week 4", "Phase 1: Foundation"
  goals       String[] @default([])

  // Agent work tracking
  plan        String?  @db.Text // Implementation plan (markdown)
  todos       Json?    @db.JsonB // Array: [{ content, status, priority }]
  progress    String?  @db.Text // Progress log

  // Status
  status      String   @default("IN_PROGRESS") // "IN_PROGRESS" | "COMPLETED"

  // Timestamps
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  completedAt DateTime?

  @@index([projectId, status])
  @@index([projectId, createdAt])
  @@map("development_sessions")
}

// Update Project model
model Project {
  // ... existing fields ...
  developmentSessions DevelopmentSession[] // NEW relationship
}
```

**Migration**:
```bash
npx prisma migrate dev --name add_development_session_model
```

**Acceptance**:
- [ ] DevelopmentSession model created
- [ ] Foreign key to Project
- [ ] plan field supports markdown (@db.Text)
- [ ] todos field supports JSON array (@db.JsonB)
- [ ] Migration runs successfully
- [ ] CurrentWorkModal can query active sessions

**Files**:
- `apps/web/prisma/schema.prisma` (UPDATE)
- `apps/web/prisma/migrations/*/add_development_session_model/migration.sql` (CREATE)

---

### Part A: Roadmap Parsing + Materialization (5-6 hours, 2 points)

#### Task A.1: Markdown Parser (NEW)

**File**: `apps/mcp-server/src/tools/roadmap/parseProjectPlan.ts` (~200 lines)

**Purpose**: Parse 13-Project-Plan.md CONTENT (from Document table) to extract Phase/Sprint/Week hierarchy

**Data Source**: Document table (Session 2 stores markdown content here, NOT as file)

**Algorithm**:
```typescript
interface ParsedRoadmap {
  phases: Array<{
    name: string;       // "Phase A: Foundation & Core Infrastructure"
    duration: string;   // "6 weeks"
    sprints: Array<{
      name: string;     // "Sprint 1: Foundation Setup"
      duration: string; // "2 weeks"
      weeks: string;    // "Weeks 1-2"
      goals: string[];
      deliverables: string[];
      storyPoints: number;
    }>;
  }>;
}

export async function parseProjectPlan(documentId: string): Promise<ParsedRoadmap> {
  // 1. Fetch 13-Project-Plan.md CONTENT from Document table
  // Note: This is markdown string stored by Session 2, NOT a file
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!doc) throw new Error('13-Project-Plan.md not found in Document table');

  const markdown = doc.content;
  const phases: ParsedRoadmap['phases'] = [];

  // 2. Parse markdown structure
  // Pattern: ## Phase A: Name (Weeks X-Y, Sprints X-Y)
  const phaseRegex = /^## (Phase [A-Z]: .+?) \(Weeks (\d+)-(\d+), Sprints (\d+)-(\d+)\)/gm;

  let phaseMatch;
  while ((phaseMatch = phaseRegex.exec(markdown)) !== null) {
    const phaseName = phaseMatch[1];
    const weekStart = parseInt(phaseMatch[2]);
    const weekEnd = parseInt(phaseMatch[3]);
    const sprintStart = parseInt(phaseMatch[4]);
    const sprintEnd = parseInt(phaseMatch[5]);

    const duration = `${weekEnd - weekStart + 1} weeks`;
    const sprints: ParsedRoadmap['phases'][0]['sprints'] = [];

    // 3. Parse sprints within this phase
    // Pattern: ### Sprint N (Weeks X-Y): Name - XX points
    const sprintRegex = new RegExp(
      `### Sprint (${sprintStart}-${sprintEnd}) \\(Weeks ([\\d-]+)\\): (.+?) - (\\d+) points`,
      'g'
    );

    let sprintMatch;
    while ((sprintMatch = sprintRegex.exec(markdown)) !== null) {
      const sprintNum = sprintMatch[1];
      const weeks = sprintMatch[2];
      const sprintName = sprintMatch[3];
      const storyPoints = parseInt(sprintMatch[4]);

      // Calculate sprint duration from weeks range
      const [wStart, wEnd] = weeks.split('-').map(Number);
      const sprintDuration = `${wEnd - wStart + 1} weeks`;

      // 4. Extract goals and deliverables
      const goals = extractListItems(markdown, `Sprint ${sprintNum}`, '**Goal:**');
      const deliverables = extractListItems(markdown, `Sprint ${sprintNum}`, '**Deliverables:**');

      sprints.push({
        name: `Sprint ${sprintNum}: ${sprintName}`,
        duration: sprintDuration,
        weeks,
        goals,
        deliverables,
        storyPoints,
      });
    }

    phases.push({
      name: phaseName,
      duration,
      sprints,
    });
  }

  return { phases };
}

function extractListItems(markdown: string, section: string, marker: string): string[] {
  // Extract bullet points after marker within section
  const sectionStart = markdown.indexOf(section);
  const sectionEnd = markdown.indexOf('###', sectionStart + 1);
  const sectionText = markdown.substring(sectionStart, sectionEnd);

  const markerIndex = sectionText.indexOf(marker);
  if (markerIndex === -1) return [];

  const listStart = markerIndex + marker.length;
  const listEnd = sectionText.indexOf('\n\n', listStart);
  const listText = sectionText.substring(listStart, listEnd);

  return listText
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.replace(/^-\s*/, '').trim());
}
```

**Error Handling**:
- Document not found → throw error
- Invalid markdown structure → return empty phases array
- Missing goals/deliverables → default to empty arrays

**Acceptance**:
- [ ] Parses Phase headers correctly
- [ ] Parses Sprint headers with weeks range
- [ ] Extracts goals and deliverables
- [ ] Returns ParsedRoadmap structure
- [ ] Unit tests passing (4-5 tests)

**Files**:
- `apps/mcp-server/src/tools/roadmap/parseProjectPlan.ts` (CREATE)
- `apps/mcp-server/src/tools/roadmap/__tests__/parseProjectPlan.test.ts` (CREATE)

---

#### Task A.2: Roadmap Creation in Session 3

**File**: `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts` (~50 lines added)

**Purpose**: Parse 13-Project-Plan.md and create Roadmap record in Session 3

**Implementation**:
```typescript
import { parseProjectPlan } from '../roadmap/parseProjectPlan.js';

// In bootstrapTool handler (Session 3):

// After creating 15 documents (including 13-Project-Plan.md):
const projectPlanDoc = documents.find(d => d.title === '13-Project-Plan.md');

if (!projectPlanDoc) {
  throw new Error('13-Project-Plan.md not created in Session 2');
}

// Parse markdown to extract roadmap structure
const parsedRoadmap = await parseProjectPlan(projectPlanDoc.id);

// Create Roadmap record with phases JSON
const roadmap = await prisma.roadmap.create({
  data: {
    projectId: project.id,
    phases: parsedRoadmap.phases,  // Store as JSON
    currentPhase: parsedRoadmap.phases[0]?.name,
    currentSprint: parsedRoadmap.phases[0]?.sprints[0]?.name,
  },
});

// Store roadmap ID in session response
await prisma.onboardingSession.update({
  where: { id: sessionId },
  data: {
    response: {
      ...existingResponse,
      roadmapId: roadmap.id,
      roadmapCreated: true,
    },
  },
});
```

**Acceptance**:
- [ ] Session 3 parses 13-Project-Plan.md
- [ ] Roadmap record created with phases JSON
- [ ] roadmapId stored in OnboardingSession.response
- [ ] No errors during Session 3 execution

**Files**:
- `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts` (UPDATE)

---

#### Task A.3: Materialization Algorithm

**File**: `apps/mcp-server/src/tools/roadmap/materializeTool.ts` (~250 lines)

**Purpose**: Convert Roadmap.phases JSON → normalized Phase/Sprint/Week/Day records

**Algorithm**:
```typescript
export const materializeRoadmapTool = {
  name: 'projectpulse.roadmap.materialize',
  description: 'Convert Roadmap JSON phases to normalized Phase/Sprint/Week/Day records',
  inputSchema: z.object({
    roadmapId: z.string(),
  }),

  async handler({ roadmapId }) {
    const roadmap = await prisma.roadmap.findUnique({
      where: { id: roadmapId },
    });

    if (!roadmap) throw new Error('Roadmap not found');

    const phases = roadmap.phases as ParsedRoadmap['phases'];
    const createdIds = {
      phaseIds: [],
      sprintIds: [],  // NEW
      weekIds: [],
      dayIds: []
    };

    let currentDate = new Date(); // Or parse from timeline field

    // 1. Create Phase records
    for (const phaseJson of phases) {
      const phase = await prisma.phase.create({
        data: {
          title: phaseJson.name,
          description: '', // Extract from markdown if available
          status: 'NOT_STARTED',
          progress: 0,
          startDate: currentDate,
          endDate: calculateEndDate(currentDate, phaseJson.duration),
          roadmapId: roadmap.id,
        },
      });

      createdIds.phaseIds.push(phase.id);

      // 2. Create Sprint records (NEW - 5-level hierarchy)
      for (const sprintJson of phaseJson.sprints) {
        const sprint = await prisma.sprint.create({
          data: {
            name: sprintJson.name,
            duration: sprintJson.duration,
            goals: sprintJson.goals,
            deliverables: sprintJson.deliverables,
            storyPoints: sprintJson.storyPoints,
            status: 'NOT_STARTED',
            progress: 0,
            startDate: currentDate,
            endDate: calculateEndDate(currentDate, sprintJson.duration),
            phaseId: phase.id,
          },
        });

        createdIds.sprintIds.push(sprint.id);

        // 3. Create Week records (linked to Sprint, not Phase)
        const weekCount = parseInt(sprintJson.duration.match(/(\d+)\s*week/)?.[1] || '2');

        for (let w = 1; w <= weekCount; w++) {
          const weekStart = new Date(currentDate);
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
              sprintId: sprint.id,  // Link to Sprint, not Phase
            },
          });

          createdIds.weekIds.push(week.id);

          // 4. Create Day records (5 days per week, Mon-Fri)
          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
          for (let d = 0; d < 5; d++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + d);

            const day = await prisma.day.create({
              data: {
                title: dayNames[d],
                status: 'NOT_STARTED',
                progress: 0,
                startDate: dayDate,
                weekId: week.id,
              },
            });

            createdIds.dayIds.push(day.id);
          }
        }

        // Advance currentDate for next sprint
        currentDate = calculateEndDate(currentDate, sprintJson.duration);
        currentDate.setDate(currentDate.getDate() + 1); // Start next sprint on Monday
      }
    }

    return {
      success: true,
      ...createdIds,
      message: `Created ${createdIds.phaseIds.length} phases, ${createdIds.sprintIds.length} sprints, ${createdIds.weekIds.length} weeks, ${createdIds.dayIds.length} days`,
    };
  },
};

function calculateEndDate(startDate: Date, duration: string): Date {
  const weeks = parseInt(duration.match(/(\d+)\s*week/)?.[1] || '2');
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (weeks * 7) - 1);
  return endDate;
}
```

**Error Handling**:
- Roadmap not found → throw error
- Invalid duration format → default to 2 weeks
- Database constraint violation → rollback transaction

**Acceptance**:
- [ ] Tool creates Phase/Sprint/Week/Day records from JSON
- [ ] 5-level hierarchy: Phase → Sprint → Week → Day
- [ ] Returns created IDs
- [ ] Transaction-safe (rollback on error)
- [ ] Unit tests passing (4-5 tests)

**Files**:
- `apps/mcp-server/src/tools/roadmap/materializeTool.ts` (CREATE)
- `apps/mcp-server/src/tools/roadmap/__tests__/materializeTool.test.ts` (CREATE)

---

#### Task A.4: MCP Tools Registration + Session 3 Integration

**File 1**: `apps/mcp-server/src/index.ts`
```typescript
import { materializeRoadmapTool } from './tools/roadmap/materializeTool.js';

const tools = [
  // ... existing tools ...
  materializeRoadmapTool,
];
```

**File 2**: `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts`
```typescript
// After creating Roadmap
const roadmap = await prisma.roadmap.create({ /* ... */ });

// Materialize JSON → normalized tables
const materialized = await materializeRoadmapTool.handler({
  roadmapId: roadmap.id
});

// Store IDs in Session 3 response
await prisma.onboardingSession.update({
  where: { id: sessionId },
  data: {
    response: {
      ...existingResponse,
      roadmapId: roadmap.id,
      roadmapMaterialized: true,
      createdPhaseIds: materialized.phaseIds,
      createdSprintIds: materialized.sprintIds,  // NEW
      createdWeekIds: materialized.weekIds,
      createdDayIds: materialized.dayIds,
    },
  },
});
```

**File 3**: `apps/mcp-server/src/tools/roadmap/getCurrentPositionTool.ts` (NEW)
```typescript
export const getCurrentPositionTool = {
  name: 'projectpulse.roadmap.getCurrentPosition',
  description: 'Get current position in roadmap (latest IN_PROGRESS day/task)',
  inputSchema: z.object({
    projectId: z.string(),
  }),

  async handler({ projectId }) {
    // Find latest IN_PROGRESS task
    const currentTask = await prisma.task.findFirst({
      where: { status: 'IN_PROGRESS' },
      include: {
        day: {
          include: {
            week: {
              include: {
                sprint: {
                  include: {
                    phase: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!currentTask) {
      return { currentPosition: null };
    }

    return {
      currentPosition: {
        phase: currentTask.day.week.sprint.phase.title,
        sprint: currentTask.day.week.sprint.name,
        week: currentTask.day.week.title,
        day: currentTask.day.title,
        task: currentTask.title,
      },
    };
  },
};
```

**Acceptance**:
- [ ] materializeRoadmapTool registered in MCP server
- [ ] Session 3 calls materialize automatically after Roadmap creation
- [ ] Phase/Sprint/Week/Day records exist after Session 3
- [ ] IDs stored in OnboardingSession.response
- [ ] getCurrentPosition tool returns breadcrumb path

**Files**:
- `apps/mcp-server/src/index.ts` (UPDATE)
- `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts` (UPDATE)
- `apps/mcp-server/src/tools/roadmap/getCurrentPositionTool.ts` (CREATE)

---

### Part B: Roadmap UI (18-20 hours, 8 points)

#### Step B.1: Page + Empty State (2 hours)

**File 1**: `apps/web/app/roadmap/page.tsx` (Server Component, ~150 lines)

```typescript
import { prisma } from '@/lib/db';
import { RoadmapTree } from '@/components/roadmap/RoadmapTree';
import { CurrentPositionBanner } from '@/components/roadmap/CurrentPositionBanner';
import { RoadmapFilters } from '@/components/roadmap/RoadmapFilters';
import { EmptyRoadmapState } from '@/components/roadmap/EmptyRoadmapState';

export default async function RoadmapPage() {
  // Fetch all phases with 5-level nested includes
  const phases = await prisma.phase.findMany({
    include: {
      sprints: {          // NEW: Sprint layer
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
      },
    },
    orderBy: { startDate: 'asc' },
  });

  // Get current position (latest IN_PROGRESS task with full hierarchy)
  const currentTask = await prisma.task.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      day: {
        include: {
          week: {
            include: {
              sprint: {        // NEW: Sprint in hierarchy
                include: {
                  phase: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Get active DevelopmentSession for "View Current Plan" modal
  const activeSessions = await prisma.developmentSession.findMany({
    where: {
      status: 'IN_PROGRESS',
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });

  // Handle empty state
  if (phases.length === 0) {
    return <EmptyRoadmapState />;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Development Roadmap</h1>

      {currentTask && (
        <CurrentPositionBanner
          currentTask={currentTask}
          activeSession={activeSessions[0]}
        />
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
        Complete onboarding Session 3 to generate your project roadmap with phases, sprints, weeks, and days.
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
- [ ] 5-level nested data fetches correctly
- [ ] DevelopmentSession data fetched for modal
- [ ] Loading/error states implemented

**Files**:
- `apps/web/app/roadmap/page.tsx` (CREATE)
- `apps/web/components/roadmap/EmptyRoadmapState.tsx` (CREATE)

---

#### Step B.2: Tree Component (2 hours)

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
- [ ] Tree renders 5-level hierarchy
- [ ] Expand/collapse state management works
- [ ] Phases can be expanded independently

**Files**:
- `apps/web/components/roadmap/RoadmapTree.tsx` (CREATE)

---

#### Step B.3: 5-Level Hierarchy Card Components (4-5 hours)

**NEW: Add SprintCard component for 5-level hierarchy**

**File 1**: `apps/web/components/roadmap/PhaseCard.tsx` (~80 lines)

```typescript
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SprintCard } from './SprintCard';  // NEW: Render sprints

export function PhaseCard({ phase, isExpanded, onToggle }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronDown /> : <ChevronRight />}
          <h3 className="text-lg font-semibold">📦 {phase.title}</h3>
          <Badge className={statusColors[phase.status]}>{phase.status}</Badge>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {phase.sprints.length} sprints
          </span>
          <span className="text-sm font-medium">{phase.progress}%</span>
        </div>
      </div>
      <Progress value={phase.progress} className="mt-3" />
      {isExpanded && (
        <div className="mt-4 space-y-2">
          {phase.sprints.map((sprint) => (
            <SprintCard key={sprint.id} sprint={sprint} />
          ))}
        </div>
      )}
    </Card>
  );
}
```

**File 2**: `apps/web/components/roadmap/SprintCard.tsx` (NEW - ~80 lines)

```typescript
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { WeekCard } from './WeekCard';

export function SprintCard({ sprint }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4 ml-6">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronDown /> : <ChevronRight />}
          <h4 className="text-md font-semibold">📅 {sprint.name}</h4>
          <Badge>{sprint.status}</Badge>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {sprint.weeks.length} weeks
          </span>
          <span className="text-sm font-medium">{sprint.progress}%</span>
        </div>
      </div>
      <Progress value={sprint.progress} className="mt-3" />
      {isExpanded && (
        <div className="mt-4 space-y-2">
          {sprint.weeks.map((week) => (
            <WeekCard key={week.id} week={week} />
          ))}
        </div>
      )}
    </Card>
  );
}
```

**File 3**: `apps/web/components/roadmap/WeekCard.tsx` (~70 lines) - Similar pattern
**File 4**: `apps/web/components/roadmap/DayCard.tsx` (~70 lines) - Similar pattern
**File 5**: `apps/web/components/roadmap/TaskCard.tsx` (~60 lines) - Similar pattern

**Acceptance**:
- [ ] All 5 cards implemented (Phase, Sprint, Week, Day, Task)
- [ ] Consistent styling with indentation showing hierarchy
- [ ] Progress bars work
- [ ] Click to expand works
- [ ] Status badges display correctly

**Files**:
- `apps/web/components/roadmap/PhaseCard.tsx` (CREATE)
- `apps/web/components/roadmap/SprintCard.tsx` (CREATE - NEW)
- `apps/web/components/roadmap/WeekCard.tsx` (CREATE)
- `apps/web/components/roadmap/DayCard.tsx` (CREATE)
- `apps/web/components/roadmap/TaskCard.tsx` (CREATE)

---

#### Step B.4: Current Position Banner + Current Work Modal (3 hours)

**File 1**: `apps/web/components/roadmap/CurrentPositionBanner.tsx` (~80 lines)

```typescript
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { CurrentWorkModal } from './CurrentWorkModal';

interface CurrentPositionBannerProps {
  currentTask: TaskWithHierarchy;
  activeSession?: DevelopmentSession;
}

export function CurrentPositionBanner({ currentTask, activeSession }: CurrentPositionBannerProps) {
  const { day, week, sprint, phase } = currentTask;  // NEW: sprint in hierarchy

  return (
    <Card className="p-4 mb-6 bg-accent-primary/10">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-5 w-5 text-accent-primary" />
        <h2 className="text-lg font-semibold">Currently: {phase.title} → {sprint.name} → {week.title} → {day.title}</h2>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Progress: {phase.progress}% Phase | {sprint.progress}% Sprint | {week.progress}% Week</span>
      </div>

      {activeSession && (
        <div className="mt-4">
          <CurrentWorkModal session={activeSession} />
        </div>
      )}
    </Card>
  );
}
```

**File 2**: `apps/web/components/roadmap/CurrentWorkModal.tsx` (NEW - ~120 lines)

```typescript
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

interface CurrentWorkModalProps {
  session: DevelopmentSession;
}

export function CurrentWorkModal({ session }: CurrentWorkModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">📋 View Current Plan/Todos</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Current Plan: {session.phase}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Section */}
          <div>
            <h3 className="text-lg font-semibold mb-2">📝 Implementation Plan</h3>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{session.plan}</ReactMarkdown>
            </div>
          </div>

          {/* Todos Section */}
          <div>
            <h3 className="text-lg font-semibold mb-2">
              ✅ Todos ({completedCount}/{totalCount} complete)
            </h3>
            <div className="space-y-2">
              {session.todos.map((todo, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {todo.status === 'completed' && <span>✅</span>}
                  {todo.status === 'in_progress' && <span>🔄</span>}
                  {todo.status === 'pending' && <span>⏸️</span>}
                  <span className={todo.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                    {todo.content}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Acceptance**:
- [ ] Banner shows current position breadcrumb (Phase → Sprint → Week → Day)
- [ ] Progress indicators display for Phase/Sprint/Week
- [ ] "View Current Plan" button opens modal
- [ ] Modal displays DevelopmentSession.plan (markdown rendered)
- [ ] Modal displays DevelopmentSession.todos (checklist)
- [ ] Handles null activeSession (button hidden)

**Files**:
- `apps/web/components/roadmap/CurrentPositionBanner.tsx` (CREATE)
- `apps/web/components/roadmap/CurrentWorkModal.tsx` (CREATE - NEW)

---

#### Step B.5: Roadmap Filters (2 hours)

Same as original plan - filter by status and progress range.

**Files**:
- `apps/web/components/roadmap/RoadmapFilters.tsx` (CREATE)

---

#### Step B.6: Navigation Integration (30 min)

Same as original plan - add link to sidebar.

**Files**:
- `apps/web/components/Sidebar.tsx` (UPDATE)

---

### Part C: Testing (4-5 hours, 1 point)

#### Step C.1: E2E Tests (3 hours)

**File**: `apps/web/tests/e2e/roadmap.spec.ts` (7-9 tests)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Development Roadmap', () => {
  test('should display 5-level hierarchy', async ({ page }) => {
    await page.goto('/roadmap');

    // Expand Phase
    await page.click('[data-testid="phase-card"]');
    await expect(page.getByText(/Sprint \d+/)).toBeVisible();

    // Expand Sprint (NEW)
    await page.click('[data-testid="sprint-card"]');
    await expect(page.getByText(/Week \d+/)).toBeVisible();

    // Expand Week
    await page.click('[data-testid="week-card"]');
    await expect(page.getByText(/Day \d+/)).toBeVisible();
  });

  test('should show current work modal', async ({ page }) => {
    await page.goto('/roadmap');

    // Click "View Current Plan" button
    await page.click('text=View Current Plan');

    // Verify modal opens
    await expect(page.getByText('Implementation Plan')).toBeVisible();
    await expect(page.getByText(/Todos \(\d+\/\d+ complete\)/)).toBeVisible();
  });

  // ... other tests
});
```

**Acceptance**:
- [ ] 7-9 tests created
- [ ] All tests passing
- [ ] Coverage >80%
- [ ] Tests Sprint layer
- [ ] Tests CurrentWorkModal

**Files**:
- `apps/web/tests/e2e/roadmap.spec.ts` (CREATE)

---

#### Step C.2: Integration Testing (2 hours)

**Manual Test Flow**:
1. Complete Session 2 → verify 13-Project-Plan.md created
2. Complete Session 3 → verify Roadmap created with phases JSON
3. Verify Phase/Sprint/Week/Day records created (materialization)
4. Navigate to `/roadmap` → verify 5-level tree displays
5. Agent creates DevelopmentSession → verify "View Current Plan" button appears
6. Click button → verify modal shows plan and todos

**Acceptance**:
- [ ] Session 2 → 13-Project-Plan.md created
- [ ] Session 3 → Roadmap JSON created
- [ ] Materialization → Phase/Sprint/Week/Day tables populated
- [ ] UI → 5-level hierarchy displays
- [ ] Modal → plan/todos visible
- [ ] Performance <3s page load

---

## Success Criteria

### Functional Requirements
- ✅ Session 2 creates 13-Project-Plan.md in Document table
- ✅ Session 3 parses markdown → creates Roadmap record with phases JSON
- ✅ Materialization creates Phase/Sprint/Week/Day records (5 levels)
- ✅ `/roadmap` page displays 5-level hierarchical tree
- ✅ Current position banner shows breadcrumb: Phase → Sprint → Week → Day
- ✅ "View Current Plan" modal shows DevelopmentSession.plan + .todos
- ✅ Progress bars show completion percentage at all levels
- ✅ Status badges show current state
- ✅ Tree expands/collapses correctly
- ✅ Filters work (status, progress)
- ✅ Empty state handles no-roadmap case

### Technical Requirements
- ✅ Roadmap model stores phases JSON
- ✅ Sprint model enables 5-level hierarchy
- ✅ Markdown parser extracts Phase/Sprint/Week structure
- ✅ Materialization tool tested and transaction-safe
- ✅ Server Components for data fetching
- ✅ Client Components for interactivity
- ✅ Database queries optimized (5-level nested includes)
- ✅ CurrentWorkModal renders markdown plan + todo checklist

### Testing Requirements
- ✅ 7-9 E2E tests passing (including Sprint layer and modal)
- ✅ Manual integration tests passed
- ✅ No regression in existing tests
- ✅ Performance targets met (<3s page load)

---

## Dependencies

**External**:
- ✅ Session 2 creates 13-Project-Plan.md (Sprint 2 onboarding)
- ✅ Session 3 infrastructure exists (Sprint 2 onboarding)
- ✅ Document table stores markdown files (Sprint 2)
- ✅ DevelopmentSession model exists (verify or create)

**Internal**:
- Part 0 (schema) must complete before Part A
- Part A must complete before Part B (materialization enables UI)
- Part B components build sequentially (Page → Tree → Cards → Banner → Modal)
- Part C tests require Parts A+B complete

---

## File Inventory

### New Files (22 total)

**Database** (2 files):
1. `apps/web/prisma/migrations/*/add_roadmap_model.sql`
2. `apps/web/prisma/migrations/*/add_sprint_layer.sql`

**MCP/Backend** (7 files):
3. `apps/mcp-server/src/tools/roadmap/parseProjectPlan.ts`
4. `apps/mcp-server/src/tools/roadmap/__tests__/parseProjectPlan.test.ts`
5. `apps/mcp-server/src/tools/roadmap/materializeTool.ts`
6. `apps/mcp-server/src/tools/roadmap/__tests__/materializeTool.test.ts`
7. `apps/mcp-server/src/tools/roadmap/getCurrentPositionTool.ts`
8. `apps/mcp-server/src/tools/roadmap/__tests__/getCurrentPositionTool.test.ts`
9. `apps/mcp-server/src/tools/roadmap/types.ts` (shared types)

**Frontend** (11 files):
10. `apps/web/app/roadmap/page.tsx`
11. `apps/web/components/roadmap/EmptyRoadmapState.tsx`
12. `apps/web/components/roadmap/RoadmapTree.tsx`
13. `apps/web/components/roadmap/PhaseCard.tsx`
14. `apps/web/components/roadmap/SprintCard.tsx` (NEW - 5th level)
15. `apps/web/components/roadmap/WeekCard.tsx`
16. `apps/web/components/roadmap/DayCard.tsx`
17. `apps/web/components/roadmap/TaskCard.tsx`
18. `apps/web/components/roadmap/CurrentPositionBanner.tsx`
19. `apps/web/components/roadmap/CurrentWorkModal.tsx` (NEW)
20. `apps/web/components/roadmap/RoadmapFilters.tsx`

**Tests** (2 files):
21. `apps/web/tests/e2e/roadmap.spec.ts`
22. `apps/mcp-server/src/tools/__tests__/integration.test.ts` (Session 3 flow)

### Modified Files (4 total)
1. `apps/web/prisma/schema.prisma` - Add Roadmap, Sprint models
2. `apps/mcp-server/src/index.ts` - Register new tools
3. `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts` - Parse + materialize
4. `apps/web/components/Sidebar.tsx` - Add Development Roadmap link

---

## Risks & Mitigations

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| Markdown parsing fails | HIGH | Robust regex + error handling + unit tests | ⚠️ Need testing |
| Session 3 data structure changes | HIGH | Well-defined in 3-session-onboarding-REFERENCE.md | ✅ Mitigated |
| Materialization fails during Session 3 | HIGH | Transaction rollback, clear error messages | ⚠️ Need testing |
| Sprint layer adds UI complexity | MEDIUM | Reuse card pattern, consistent styling | ✅ Mitigated |
| 5-level nested includes slow | MEDIUM | Monitor performance, add pagination if needed | ⚠️ Monitor |
| CurrentWorkModal state sync | MEDIUM | Server-side data fetching, no client state | ✅ Mitigated |

---

## Timeline Breakdown

**Part 0: Database Schema** - 3 hours (Day 1 morning)
- 1.5 hours: Roadmap model + migration
- 1.5 hours: Sprint model + migration

**Part A: Roadmap Parsing + Materialization** - 5-6 hours (Day 1 afternoon)
- 2 hours: Markdown parser + tests
- 1 hour: Session 3 integration
- 2-2.5 hours: Materialization tool + tests
- 30 min: MCP tools registration

**Part B: Roadmap UI** - 18-20 hours (Days 2-3)
- 2 hours: Page + empty state
- 2 hours: Tree component
- 4-5 hours: 5 card components
- 3 hours: Banner + modal
- 2 hours: Filters
- 30 min: Navigation

**Part C: Testing** - 4-5 hours (Day 3.5)
- 3 hours: E2E tests
- 2 hours: Integration testing

**Total**: 31-35 hours → **3.75 days with buffer**

---

## Next Steps After Phase 1

- **Phase 2**: Blueprint MCP Tool (agents query Session 3 data)
- **Phase 3**: Agent AI Hub Tabs (skills, workflows, config management)
- **Phase 4**: MCP Read Tools (efficient hierarchy queries)

---

**Plan Created**: 2025-11-17
**Last Updated**: 2025-11-17 (Full alignment with Sprint8.5_alignment_plan)
**Source**: Sprint8.5_alignment_plan + 3-session-onboarding-REFERENCE.md + docs/13-Project-Plan.md
**Review Cycle**: Daily checkpoints at 15K tokens
