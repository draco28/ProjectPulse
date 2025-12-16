# Prisma Design Plan: Checkpoint Model for Sprint 1 Context Recovery

**Created**: 2025-11-09 14:30
**Type**: Schema Design + Migration Strategy
**Database**: PostgreSQL 16
**Token Budget Allocated**: ~5K tokens for design documentation

---

## Executive Summary

This design plan defines a **Checkpoint model** to track agent progress at 15K token intervals within agent sessions. The checkpoint system enables full context recovery if sessions are interrupted, supporting the mandatory STEP 4 protocol requirements for session context persistence.

**Key Decision**: Checkpoint is a **separate model** (not an extension of Session) to maintain clean separation of concerns:
- **Session**: Tracks overall session metadata and hierarchy (task → session relation)
- **Checkpoint**: Tracks progress snapshots within a session (for context recovery)

---

## Data Model Architecture

### Entity Relationship Diagram

```
Session (1) ──── (Many) Checkpoint
  ├─ id (PK)               ├─ id (PK)
  ├─ taskId (FK)          ├─ sessionId (FK) ← Session.id
  ├─ title                ├─ notes (text)
  ├─ progress             ├─ tokenUsage (integer)
  ├─ status               ├─ sessionContext (JSONB)
  ├─ startDate            ├─ createdAt (auto)
  ├─ endDate              └─ (no updatedAt - immutable)
  ├─ createdAt
  ├─ updatedAt
  └─ (deleted cascades to Checkpoints)
```

### Why Separate Model?

1. **Clean Separation of Concerns**: Session tracks overall state; Checkpoint tracks progress snapshots
2. **Immutable Records**: Checkpoints should never be edited (audit trail for context recovery)
3. **Flexible Queries**: Can query checkpoints independently without Session bloat
4. **Storage Efficiency**: No extra fields on every Session record
5. **Future Extensibility**: Can add checkpoint-specific features without affecting Session

### Relation Type

**Many-to-One with Cascade Delete**:
- Each Checkpoint belongs to exactly one Session
- Multiple Checkpoints per Session (typically 5-6 per session at 15K intervals)
- Deleting a Session cascades to all its Checkpoints (cleanup)

---

## Schema Design

### Prisma Model Definition

```prisma
model Checkpoint {
  // Primary key
  id          String   @id @default(cuid())

  // Foreign key relation
  sessionId   String
  session     Session  @relation("SessionCheckpoints", fields: [sessionId], references: [id], onDelete: Cascade)

  // Core checkpoint data
  notes       String   @db.Text // Checkpoint summary/notes
  tokenUsage  Int      // Tokens used since session start (cumulative)

  // Session context snapshot (immutable capture)
  // Stores: phase name, current task, progress %, files modified, etc.
  sessionContext Json  @db.JsonB

  // Metadata (immutable once created)
  createdAt   DateTime @default(now())

  // Indexes for performance (see Performance section)
  @@index([sessionId])
  @@index([createdAt(sort: Desc)])
  @@index([sessionId, createdAt(sort: Desc)])

  @@map("checkpoints")
}

// Update Session model to add relation
model Session {
  id          String    @id @default(cuid())
  // ... existing fields ...

  // Add this relation
  checkpoints Checkpoint[] @relation("SessionCheckpoints")

  // ... rest of model ...
}
```

### Field Specifications

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| **id** | String | @id, @default(cuid()) | - | Primary key (unique identifier) |
| **sessionId** | String | FK to Session.id | - | Parent session reference |
| **notes** | String | @db.Text | - | Checkpoint notes (what was done, where we are) |
| **tokenUsage** | Int | - | - | Cumulative tokens used since session start |
| **sessionContext** | Json | @db.JsonB | - | Snapshot of session state (see JSON schema below) |
| **createdAt** | DateTime | @default(now()), immutable | - | Checkpoint creation timestamp |

### JSONB Field Schema (sessionContext)

**Purpose**: Capture minimal context needed for recovery, not full state dump

```typescript
interface SessionContextSnapshot {
  // Hierarchy context
  phaseName: string              // e.g., "Sprint 1 Week 2 Days 10-12"
  currentTaskId: string          // Task being worked on
  currentTaskTitle: string       // Task title

  // Progress
  sessionProgress: number        // 0-100%
  completedCheckpoints: number   // How many checkpoints before this one

  // What was done
  filesModified: string[]        // Relative paths of modified files
  filesCreated: string[]         // Newly created files
  endpointsImplemented: string[] // API endpoints added

  // State for recovery
  lastFileSaved: string          // Last file saved timestamp
  uncommittedChanges: boolean    // Are there uncommitted changes?
  currentBranch: string          // Git branch

  // Optional context
  blockerFound?: string          // If blocked, what's the blocker?
  nextSteps?: string[]           // Recommended next steps

  // Metadata
  tokenBudgetRemaining: number   // Estimated tokens left in session
  checkpointReason: string       // Why checkpoint created (e.g., "15K tokens reached")
}
```

**JSON Example**:
```json
{
  "phaseName": "Sprint 1 Week 2 Days 10-12 MCP Tools",
  "currentTaskId": "task_xyz123",
  "currentTaskTitle": "Implement sprint.updateProgress MCP tool",
  "sessionProgress": 45,
  "completedCheckpoints": 3,
  "filesModified": [
    "apps/web/src/lib/mcp/tools/sprint.ts",
    "apps/web/src/app/api/tasks/progress/route.ts"
  ],
  "filesCreated": [
    "apps/web/src/lib/validations/progress.ts"
  ],
  "endpointsImplemented": [
    "PUT /api/:entity/:id/progress"
  ],
  "lastFileSaved": "2025-11-09T14:25:00Z",
  "uncommittedChanges": false,
  "currentBranch": "feature/sprint-1-foundation",
  "tokenBudgetRemaining": 114000,
  "checkpointReason": "15K token interval checkpoint"
}
```

---

## Migration Strategy

### Phase 1: Add Model (Non-Breaking)

**Step 1.1: Create Migration**
```bash
npx prisma migrate dev --name add_checkpoint_model
```

**Generated Files**:
- `prisma/migrations/[timestamp]_add_checkpoint_model/migration.sql`
- Creates `checkpoints` table with all fields and indexes
- Updates `Session` model relation

**Step 1.2: Key SQL Operations** (what Prisma generates):
```sql
-- Create checkpoints table
CREATE TABLE "checkpoints" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "notes" TEXT NOT NULL,
  "tokenUsage" INTEGER NOT NULL,
  "sessionContext" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "checkpoints_sessionId_fkey" FOREIGN KEY ("sessionId")
    REFERENCES "sessions" ("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "checkpoints_sessionId_idx" ON "checkpoints"("sessionId");
CREATE INDEX "checkpoints_createdAt_idx" ON "checkpoints"("createdAt" DESC);
CREATE INDEX "checkpoints_sessionId_createdAt_idx" ON "checkpoints"("sessionId", "createdAt" DESC);
```

**Step 1.3: Verify**
```bash
# Validate schema
npx prisma validate

# Generate updated Prisma Client
npx prisma generate

# Optional: Open Prisma Studio to inspect
pnpm prisma studio
```

**Data Impact**: None - new table, no existing data affected

---

## Query Patterns

### Pattern 1: Create Checkpoint (Every 15K tokens)

```typescript
import { prisma } from '@/lib/db';

async function createCheckpoint(
  sessionId: string,
  notes: string,
  tokenUsage: number,
  context: SessionContextSnapshot
): Promise<Checkpoint> {
  return await prisma.checkpoint.create({
    data: {
      sessionId,
      notes,
      tokenUsage,
      sessionContext: context,
    },
  });
}

// Usage: In session Step 4 handler
const checkpoint = await createCheckpoint(
  sessionId,
  'Implementing POST /api/issues - 45% complete',
  81000,  // Cumulative tokens
  {
    phaseName: 'Sprint 1 Week 2 Days 10-12',
    currentTaskId: 'task_xyz',
    currentTaskTitle: 'MCP Tools Implementation',
    sessionProgress: 45,
    completedCheckpoints: 3,
    filesModified: ['apps/web/src/lib/mcp/tools/sprint.ts'],
    // ... more context
  }
);
```

**Expected Performance**: <100ms (new record, no locks)

### Pattern 2: Get Latest Checkpoint for Session (For Recovery)

```typescript
async function getLatestCheckpoint(sessionId: string): Promise<Checkpoint | null> {
  return await prisma.checkpoint.findFirst({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });
}

// Usage: On session recovery
const lastCheckpoint = await getLatestCheckpoint(sessionId);
if (lastCheckpoint) {
  console.log('Resuming from checkpoint:', lastCheckpoint.notes);
  console.log('Token usage:', lastCheckpoint.tokenUsage);
  console.log('Last context:', lastCheckpoint.sessionContext);
}
```

**Expected Performance**: <50ms (index on sessionId, createdAt DESC)

### Pattern 3: Get All Checkpoints for Session

```typescript
async function getSessionCheckpoints(sessionId: string): Promise<Checkpoint[]> {
  return await prisma.checkpoint.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      notes: true,
      tokenUsage: true,
      createdAt: true,
      // Exclude large sessionContext to reduce payload
    },
  });
}

// Usage: Show checkpoint timeline in UI
const checkpoints = await getSessionCheckpoints(currentSession.id);
// Display: Checkpoint 1 (15K tokens), Checkpoint 2 (30K tokens), etc.
```

**Expected Performance**: <200ms (even with 10+ checkpoints)

### Pattern 4: Get Checkpoint with Full Context

```typescript
async function getCheckpointWithContext(checkpointId: string): Promise<Checkpoint> {
  return await prisma.checkpoint.findUniqueOrThrow({
    where: { id: checkpointId },
    include: {
      session: {
        select: {
          id: true,
          title: true,
          status: true,
          task: { select: { id: true, title: true } },
        },
      },
    },
  });
}

// Usage: View checkpoint details
const checkpoint = await getCheckpointWithContext(checkpointId);
console.log('Session:', checkpoint.session.title);
console.log('Task:', checkpoint.session.task.title);
console.log('Context:', checkpoint.sessionContext);
```

**Expected Performance**: <100ms (includes session join)

### Pattern 5: Query by Token Range

```typescript
async function checkpointsByTokenRange(
  sessionId: string,
  minTokens: number,
  maxTokens: number
): Promise<Checkpoint[]> {
  return await prisma.checkpoint.findMany({
    where: {
      sessionId,
      tokenUsage: {
        gte: minTokens,
        lte: maxTokens,
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

// Usage: Find checkpoints in a specific token range
const highTokenCheckpoints = await checkpointsByTokenRange(sessionId, 120000, 180000);
// Shows all checkpoints created when token usage was between 120K-180K
```

**Expected Performance**: <100ms (tokenUsage not indexed, but small result set)

---

## Performance Optimization

### Index Strategy

**Indexes Defined**:

1. **`@@index([sessionId])`**
   - **Purpose**: Fast lookup of all checkpoints for a session
   - **Queries**: Get all checkpoints for session, count checkpoints per session
   - **Selectivity**: Medium (many checkpoints per session)
   - **Size**: Small (string reference only)

2. **`@@index([createdAt(sort: Desc)])`**
   - **Purpose**: Fast lookup of recent checkpoints globally
   - **Queries**: Get newest checkpoints across all sessions
   - **Selectivity**: Good for sorting/ordering
   - **Size**: Small (timestamp only)

3. **`@@index([sessionId, createdAt(sort: Desc)])`** - Composite
   - **Purpose**: Fast "latest checkpoint for session" query
   - **Queries**: Single query with WHERE + ORDER BY
   - **Performance**: Critical for <50ms recovery target
   - **Size**: Medium (composite index)

### Why NOT Index tokenUsage?

- **Reason 1**: Rarely used alone (usually paired with sessionId)
- **Reason 2**: Query `tokenUsage BETWEEN x AND y` returns small result sets naturally
- **Reason 3**: Would waste storage (add ~5-10% DB size for 1% query benefit)
- **Decision**: Don't index tokenUsage unless profiling shows >30ms queries

### Why NOT Partial Index?

- **Reason 1**: All checkpoints are recent (sessions are short-lived)
- **Reason 2**: No "archived" checkpoints to exclude
- **Reason 3**: Keep schema simple until profiling shows need

### Performance Targets Met

| Operation | Target | Index Used | Expected Result |
|-----------|--------|-----------|-----------------|
| Create checkpoint | <100ms | (none - insert) | ✅ Automatic, fast insert |
| Get latest checkpoint | <50ms | (sessionId, createdAt) | ✅ Single index scan |
| Get all checkpoints | <200ms | sessionId | ✅ Index range scan |
| Get checkpoint by ID | <50ms | PK (automatic) | ✅ Primary key lookup |

---

## Data Integrity

### Foreign Key Constraints

```
Checkpoint.sessionId → Session.id
  - Type: NOT NULL, required
  - Cascade: ON DELETE CASCADE (delete session deletes checkpoints)
  - Action: Automatic cleanup when session deleted
```

### Immutability Design

**Why no `updatedAt`?**
- Checkpoints are immutable audit records
- Should never be edited after creation
- If checkpoint needs correction, create new one with corrected notes
- This prevents data integrity issues

**Application-Level Enforcement**:
```typescript
// Only allow create, never update
async function updateCheckpoint(...) {
  // FORBIDDEN - don't implement this
  throw new Error('Checkpoints are immutable. Create a new one instead.');
}
```

### Validation Rules

1. **sessionId**: Must exist in Session table
2. **tokenUsage**: Must be >= 0, typically increasing per checkpoint
3. **sessionContext**: Must be valid JSON, non-empty
4. **notes**: Must be 1-5000 characters (enforced by API)
5. **createdAt**: Auto-set, no manual override

---

## Data Migration (Existing Sessions)

### Pre-Checkpoint Sessions

**Situation**: Sessions created before Checkpoint model existed have no checkpoints

**Migration Options**:

**Option A: No Backfill** (Recommended for Sprint 1)
- Add Checkpoint model as-is
- Only NEW sessions get checkpoints going forward
- Old sessions remain as-is (no recovery from old sessions)
- **Pros**: Fast, non-invasive, zero risk
- **Cons**: Can't recover old sessions
- **Decision**: Use this for Sprint 1

**Option B: Backfill Synthetic Checkpoints** (Future)
```bash
# Only if needed in later sprints
npx prisma migrate dev --name backfill_checkpoints_for_old_sessions
```

Would create synthetic "session complete" checkpoints for old sessions (one per session).

**Option C: Lazy Migration** (Not needed)
- Create checkpoints on-demand when viewing old session
- Too complex, not worth it

### Migration Steps (Option A - Recommended)

**Step 1**: Create migration (generates schema change only)
```bash
npx prisma migrate dev --name add_checkpoint_model
```

**Step 2**: Verify schema in Prisma Studio
```bash
pnpm prisma studio
# Navigate to Checkpoints table - should be empty
```

**Step 3**: Deploy to Mac mini (when ready)
```bash
# On Mac mini
npx prisma migrate deploy
```

**Step 4**: Start checkpointing new sessions immediately
- No code changes to Session creation
- Checkpoints created automatically by Step 4 handler (existing code)

**Data Impact**:
- Existing sessions: Unchanged (no checkpoints)
- New sessions: Have checkpoints (starting immediately)
- Zero downtime, zero risk

---

## Implementation Checklist

### Schema Updates

- [ ] Add Checkpoint model to `apps/web/prisma/schema.prisma`
- [ ] Update Session model to add checkpoints relation
- [ ] Validate schema: `npx prisma validate`
- [ ] Format schema: `npx prisma format`

### Migration

- [ ] Create migration: `npx prisma migrate dev --name add_checkpoint_model`
- [ ] Review generated SQL for correctness
- [ ] Generate Prisma Client: `npx prisma generate`
- [ ] Verify database has checkpoints table: `pnpm prisma studio`

### TypeScript Integration

- [ ] Import Checkpoint type: `import { Checkpoint } from '@prisma/client'`
- [ ] Create query utilities in `lib/db/checkpoint.ts`:
  - [ ] `createCheckpoint()`
  - [ ] `getLatestCheckpoint()`
  - [ ] `getSessionCheckpoints()`
  - [ ] `getCheckpointWithContext()`

### API Routes (Optional for Sprint 1)

- [ ] `GET /api/sessions/:sessionId/checkpoints` - List all checkpoints
- [ ] `GET /api/checkpoints/:id` - Get single checkpoint details

### Testing

- [ ] Unit test: Create checkpoint with valid data
- [ ] Unit test: Get latest checkpoint query
- [ ] Integration test: Cascade delete (delete session deletes checkpoints)
- [ ] Performance test: <100ms checkpoint creation with 1000 existing checkpoints

### Documentation

- [ ] Update `database-schema.md` with Checkpoint entry
- [ ] Update `api-catalog.md` with checkpoint endpoints (if implemented)
- [ ] Update `system-patterns.md` with checkpoint usage pattern

---

## Next Steps for Parent Agent

1. **Review this design plan** - Verify meets requirements
2. **Create migration** - Run `npx prisma migrate dev --name add_checkpoint_model`
3. **Generate Prisma Client** - `npx prisma generate`
4. **Create lib/db/checkpoint.ts** - Implement query utilities from Pattern section
5. **Update Step 4 handler** - Call `createCheckpoint()` every 15K tokens
6. **Test creation** - Manually create checkpoints, verify <100ms performance
7. **Test recovery** - Verify `getLatestCheckpoint()` returns correct data for context recovery

---

## Questions & Design Decisions

### Q: Why use String ID (CUID) instead of Int autoincrement?

**A**: Consistency with existing schema
- Session model uses String @id @default(cuid())
- Checkpoint should match for consistency
- CUID provides URL-safe IDs, better for API routes
- No performance penalty vs Int

### Q: Why JSONB instead of separate table?

**A**: Flexibility + simplicity
- Checkpoint context is unstructured and evolving
- Different sessions might capture different context
- JSONB allows queries on nested fields if needed
- Separate table would require too many join columns
- JSONB is indexed and queryable in PostgreSQL

### Q: Should we version checkpoints?

**A**: No, not for Sprint 1
- Checkpoints are immutable (no updates)
- Version history not needed
- If correcting context, just create new checkpoint with better notes
- Keep schema simple

### Q: Should checkpoints be queryable by timestamp range?

**A**: Yes, via createdAt index
- Can query `WHERE createdAt BETWEEN X AND Y`
- Useful for timeline views: "Show checkpoints from last 2 hours"
- Already indexed for performance

---

## Reference

### Related Files
- Schema: `apps/web/prisma/schema.prisma`
- Session model: Lines 161-190
- Database schema docs: `.agent/system/database-schema.md`

### PostgreSQL Documentation
- JSONB: https://www.postgresql.org/docs/16/datatype-json.html
- Foreign Keys: https://www.postgresql.org/docs/16/ddl-constraints.html#DDL-CONSTRAINTS-FK
- Cascade Deletes: https://www.postgresql.org/docs/16/ddl-constraints.html#ddl-constraints-fk

### Prisma Documentation
- Relations: https://www.prisma.io/docs/concepts/components/prisma-schema/relations
- JSONB: https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#json
- Indexes: https://www.prisma.io/docs/concepts/components/prisma-schema/indexes
- Cascades: https://www.prisma.io/docs/concepts/components/prisma-schema/relations/relation-mode#cascading-deletes

---

**Design Plan Complete**
**Token Usage**: ~4.8K tokens
**Status**: Ready for parent agent implementation
**Next Phase**: Create migration and implement query utilities

