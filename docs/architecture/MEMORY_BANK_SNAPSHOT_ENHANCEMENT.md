# Memory Bank Snapshot Enhancement - Migration Strategy

**Document ID:** ARCH-ENH-001
**Version:** 1.0.0
**Status:** Planning (Sprint 10+ Phase 2)
**Created:** 2025-11-13
**Related**: Sprint 10 in Project Plan, PRD Section 4.2.12, SRS Section 1.11

---

## Executive Summary

This document describes the non-breaking enhancement to the existing Task model that adds optional memory bank snapshot capabilities for improved agent context resumption.

**Key Points**:
- ✅ **Non-Breaking**: Existing Task/Session system continues working without modifications
- ✅ **Backward Compatible**: All current MCP tools (`task.create`, `session.start`, etc.) remain functional
- ✅ **Optional Feature**: Memory bank snapshots are opt-in via new parameter
- ✅ **Graceful Degradation**: Tasks without snapshots work exactly as before

---

## Current Architecture (MVP - Sprints 1-9)

### Existing Task/Session Model

The current 5-level hierarchy is proven and working:

```
Phase (1-N weeks)
└── Week (1-N days)
    └── Day (1-N tasks)
        └── Task (1-N sessions)
            └── Session (15K token checkpoints)
```

**Database Schema (Current)**:

```prisma
model Task {
  id          Int      @id @default(autoincrement())
  dayId       Int
  title       String   @db.VarChar(200)
  description String?  @db.Text
  status      TrackingStatus @default(NOT_STARTED)
  priority    IssuePriority @default(P2)
  progress    Decimal  @default(0.0) @db.Decimal(4, 3)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  day         Day      @relation(fields: [dayId], references: [id], onDelete: Cascade)
  sessions    Session[]

  @@index([dayId])
  @@index([status])
  @@index([priority])
  @@map("tasks")
}

model Session {
  id          Int      @id @default(autoincrement())
  taskId      Int
  timestamp   String   @db.VarChar(15) // Format: "YYYYMMDD-HHMM"
  notes       String?  @db.Text
  tokenUsage  Int      @default(0)
  progress    Decimal  @default(0.0) @db.Decimal(4, 3)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  task        Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@unique([taskId, timestamp])
  @@index([taskId, createdAt])
  @@map("sessions")
}
```

**Current MCP API**:
- `task.create(dayId, title, description, priority)` - Create task under a day
- `task.update(taskId, updates)` - Update task properties
- `task.complete(taskId)` - Mark task complete (triggers progress rollup)
- `session.start(taskId, timestamp)` - Create session under task
- `session.checkpoint(sessionId, notes, tokenUsage, progress)` - Save checkpoint

**What Works**:
- ✅ 243 story points successfully tracked across 5 sprints
- ✅ Progress rollup from Session → Task → Day → Week → Phase
- ✅ Session checkpoints at 15K token intervals
- ✅ Status tracking (NOT_STARTED, IN_PROGRESS, COMPLETED)

---

## Phase 2 Enhancement (Sprint 10+)

### Problem Statement

**Current Limitation**: When an agent's context is compacted (200K token limit exceeded), resuming work on a task requires:
1. Reading current Task and Session records (100-200 tokens)
2. Manually re-reading 5 memory bank files (15-25K tokens total)
3. Reconstructing context from session notes

**Issue**: Memory banks may have changed since task creation (new patterns added, tech context updated), causing confusion.

### Proposed Solution

**Add optional memory bank snapshot at task creation**:
- Capture frozen state of 5 memory bank files when task begins
- Store snapshot in new `MemoryBankSnapshot` table
- Provide resumption API to load frozen context
- Compare snapshot vs current memory banks (detect drift)

### Enhanced Schema

**New Table: MemoryBankSnapshot**

```prisma
model MemoryBankSnapshot {
  id              Int      @id @default(autoincrement())
  taskId          Int      @unique // Each task has one optional snapshot

  // Frozen memory bank content (captured at task creation)
  projectBrief    String   @db.Text
  systemPatterns  String   @db.Text
  techContext     String   @db.Text
  activeContext   String   @db.Text
  progress        String   @db.Text

  createdAt       DateTime @default(now())

  // Relationships
  task            Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@map("memory_bank_snapshots")
}
```

**Enhanced Task Model** (non-breaking change):

```prisma
model Task {
  id          Int      @id @default(autoincrement())
  dayId       Int
  title       String   @db.VarChar(200)
  description String?  @db.Text
  status      TrackingStatus @default(NOT_STARTED)
  priority    IssuePriority @default(P2)
  progress    Decimal  @default(0.0) @db.Decimal(4, 3)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  day         Day      @relation(fields: [dayId], references: [id], onDelete: Cascade)
  sessions    Session[]
  snapshot    MemoryBankSnapshot?  // ← NEW: Optional snapshot (Phase 2)

  @@index([dayId])
  @@index([status])
  @@index([priority])
  @@map("tasks")
}
```

### Enhanced MCP API

**Existing APIs (Unchanged)**:
- ✅ `task.create(dayId, title, description, priority)` - Works exactly as before
- ✅ `task.update(taskId, updates)` - No changes
- ✅ `task.complete(taskId)` - No changes
- ✅ `session.*` - All session APIs unchanged

**New APIs (Opt-In)**:
- 🆕 `task.captureSnapshot(taskId)` - Capture memory bank snapshot for existing task
- 🆕 `task.getSnapshot(taskId)` - Retrieve frozen memory bank snapshot
- 🆕 `task.compareSnapshot(taskId)` - Diff snapshot vs current memory banks

**Enhanced API (Backward Compatible)**:
- 🔄 `task.create(dayId, title, description, priority, captureSnapshot?)` - New optional parameter

**Usage Example**:

```typescript
// Option 1: Create task WITHOUT snapshot (current behavior, backward compatible)
const task1 = await task.create(dayId, "Implement SearchBar", "Add search component", "P1");
// Works exactly as before

// Option 2: Create task WITH snapshot (Phase 2 opt-in)
const task2 = await task.create(dayId, "Implement AuthMiddleware", "JWT validation", "P0", true);
// Automatically captures memory bank snapshot

// Option 3: Add snapshot to existing task
await task.captureSnapshot(taskId);

// Resumption workflow
const snapshot = await task.getSnapshot(taskId);
// Returns: { projectBrief, systemPatterns, techContext, activeContext, progress, createdAt }

const diff = await task.compareSnapshot(taskId);
// Returns: { added: [...], removed: [...], modified: [...] }
```

---

## Migration Strategy

### Phase 1: Database Migration (Non-Breaking)

**Week 1, Day 1**: Create `memory_bank_snapshots` table

```sql
-- Migration: Add memory_bank_snapshots table
CREATE TABLE memory_bank_snapshots (
  id              SERIAL PRIMARY KEY,
  task_id         INT UNIQUE NOT NULL,
  project_brief   TEXT NOT NULL,
  system_patterns TEXT NOT NULL,
  tech_context    TEXT NOT NULL,
  active_context  TEXT NOT NULL,
  progress        TEXT NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_memory_bank_snapshots_task_id ON memory_bank_snapshots(task_id);
```

**Impact**: Zero - Existing tasks continue working, no foreign key on tasks table yet

### Phase 2: Add Optional Relation (Non-Breaking)

**Week 1, Day 2**: Add optional snapshot relation to Task model

```sql
-- Migration: Task model already has relation via Prisma (no schema change needed)
-- The relation is defined in Prisma but doesn't require ALTER TABLE
```

**Impact**: Zero - Prisma relation is virtual, no database schema change

### Phase 3: Implement Snapshot Capture Logic

**Week 1, Days 3-5**: Implement snapshot service

```typescript
// services/memory-bank-snapshot.ts
export class MemoryBankSnapshotService {
  async capture(taskId: number): Promise<MemoryBankSnapshot> {
    // 1. Read 5 memory bank files from .agent/
    const projectBrief = await fs.readFile('.agent/project-brief.md', 'utf-8');
    const systemPatterns = await fs.readFile('.agent/system-patterns.md', 'utf-8');
    const techContext = await fs.readFile('.agent/tech-context.md', 'utf-8');
    const activeContext = await fs.readFile('.agent/active-context.md', 'utf-8');
    const progress = await fs.readFile('.agent/progress.md', 'utf-8');

    // 2. Store in database
    return await prisma.memoryBankSnapshot.create({
      data: { taskId, projectBrief, systemPatterns, techContext, activeContext, progress }
    });
  }

  async retrieve(taskId: number): Promise<MemoryBankSnapshot | null> {
    return await prisma.memoryBankSnapshot.findUnique({ where: { taskId } });
  }

  async compare(taskId: number): Promise<MemoryBankDiff> {
    // Compare snapshot vs current files, return diff
  }
}
```

**Impact**: Zero - New service, no changes to existing code

### Phase 4: Enhance MCP Tools (Backward Compatible)

**Week 2, Days 1-2**: Update MCP tools

```typescript
// mcp-tools/task.create.ts (Enhanced, backward compatible)
export async function taskCreate(params: {
  dayId: number;
  title: string;
  description?: string;
  priority?: string;
  captureSnapshot?: boolean;  // ← NEW: Optional parameter (default: false)
}) {
  // 1. Create task (existing logic, unchanged)
  const task = await prisma.task.create({ data: { ... } });

  // 2. Optionally capture snapshot (NEW logic)
  if (params.captureSnapshot) {
    await MemoryBankSnapshotService.capture(task.id);
  }

  return task;
}

// NEW: mcp-tools/task.captureSnapshot.ts
export async function taskCaptureSnapshot(taskId: number) {
  return await MemoryBankSnapshotService.capture(taskId);
}

// NEW: mcp-tools/task.getSnapshot.ts
export async function taskGetSnapshot(taskId: number) {
  return await MemoryBankSnapshotService.retrieve(taskId);
}
```

**Impact**: Zero breaking changes - Existing calls work, new parameter ignored if not provided

### Phase 5: Testing & Validation

**Week 2, Days 3-5**: Comprehensive testing

1. **Backward Compatibility Tests**:
   - ✅ Existing `task.create` calls without snapshot parameter
   - ✅ All existing Task/Session workflows
   - ✅ Progress rollup still works
   - ✅ Session checkpoints unaffected

2. **New Feature Tests**:
   - ✅ Snapshot capture on task creation
   - ✅ Snapshot retrieval
   - ✅ Snapshot diff comparison
   - ✅ Resume workflow with snapshot

3. **Performance Tests**:
   - ✅ Snapshot capture <500ms (target)
   - ✅ Snapshot retrieval <200ms (target)
   - ✅ Storage size reasonable (~25KB per snapshot)

---

## Backward Compatibility Guarantees

### Existing Code Continues Working

**Guarantee 1**: All existing MCP tool calls work without modification
```typescript
// Before Phase 2:
await task.create(dayId, "Implement API", "Add POST endpoint", "P1");

// After Phase 2 (SAME CALL, still works):
await task.create(dayId, "Implement API", "Add POST endpoint", "P1");
// → No snapshot captured, task works exactly as before
```

**Guarantee 2**: Tasks without snapshots function identically
- Progress rollup: ✅ Works
- Session checkpoints: ✅ Works
- Status transitions: ✅ Works
- All existing features: ✅ Unaffected

**Guarantee 3**: Database queries remain fast
- Snapshot relation is optional (nullable foreign key on snapshots table, not tasks table)
- No additional JOINs required for existing queries
- Indexes unchanged

### Opt-In Adoption

Phase 2 is **100% opt-in**:
- Teams can continue using current Task/Session system indefinitely
- Snapshots only created when explicitly requested
- No performance penalty for teams not using snapshots
- Can add snapshots to selective tasks (e.g., only long-running tasks)

---

## Rollback Strategy

**If issues arise**, rollback is trivial:

1. **Remove MCP tools**: Delete `task.captureSnapshot`, `task.getSnapshot`, `task.compareSnapshot`
2. **Remove snapshot logic**: Remove optional parameter from `task.create`
3. **Keep database table**: Leave `memory_bank_snapshots` table (doesn't affect existing functionality)
4. **No data loss**: Tasks and Sessions unaffected

**Rollback time**: <10 minutes (just deploy previous MCP server version)

---

## Success Criteria

### Technical Metrics

- ✅ Zero breaking changes (all existing tests pass)
- ✅ Snapshot capture latency P95 <500ms
- ✅ Snapshot retrieval latency P95 <200ms
- ✅ Storage overhead <25KB per task (reasonable)
- ✅ 100% backward compatibility verified

### User Experience Metrics

- ✅ Context resumption success rate >95% (agents don't repeat questions)
- ✅ No complaints about performance degradation
- ✅ Opt-in adoption rate measured (track `captureSnapshot=true` usage)

### Business Metrics

- ✅ No increase in support tickets
- ✅ No regression in existing Task/Session workflows
- ✅ Positive feedback from teams using snapshots (qualitative)

---

## Frequently Asked Questions

### Q: Why not just replace Task with Ticket?

**A**: The current Task/Session system is proven and working (243 points tracked successfully). Replacing it would:
- Break all existing MCP tool integrations
- Require data migration (risky)
- Invalidate 5 sprints of work
- Delay Sprint 5.5 MCP server (critical blocker)

The enhancement approach is safer, faster, and maintains continuity.

### Q: What about the "Ticket" terminology in docs?

**A**: "Ticket" was originally conceived as a separate entity, but investigation revealed it's actually describing Tasks with memory bank snapshots. The terminology has been clarified across all documentation to avoid confusion.

### Q: Can I mix tasks with and without snapshots?

**A**: Yes! Snapshots are per-task optional. You can create some tasks with snapshots (long-running, complex work) and others without (simple, quick tasks).

### Q: What if memory bank files are large?

**A**: Current memory bank files are ~5KB each = ~25KB total per snapshot. This is reasonable for PostgreSQL TEXT columns. If size becomes an issue, we can compress snapshots or implement pruning for completed tasks.

### Q: How does this affect Sprint 5.5 MCP server?

**A**: Zero impact. Sprint 5.5 MCP server will implement existing Task/Session APIs (`task.create`, `session.start`, etc.). Phase 2 enhancement comes later (Sprint 10+) and is fully backward compatible.

---

## Timeline

- **Sprint 10 Week 1**: Database migration + snapshot capture logic (5 days)
- **Sprint 10 Week 2**: MCP tool enhancement + testing (5 days)
- **Sprint 11+**: Monitor adoption, gather feedback, iterate

**Total effort**: 42 story points (2 weeks)

---

## Conclusion

This migration strategy ensures:
- ✅ **Zero Risk**: Existing Task/Session system untouched
- ✅ **Backward Compatible**: All current code continues working
- ✅ **Opt-In**: Teams adopt when ready
- ✅ **Easy Rollback**: Can revert in minutes if needed
- ✅ **Clear Value**: Improved context resumption for agents

The Phase 2 enhancement builds on the proven MVP foundation rather than replacing it, ensuring continuity and minimizing risk.

---

**Document Status**: Ready for Sprint 10 implementation
**Next Steps**: Await Sprint 9 completion, then begin Phase 1 database migration
