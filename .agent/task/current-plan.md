# Sprint 1 Day 2 Implementation Plan: Prisma Schema Design

**Date**: 2025-11-06
**Phase**: Sprint 1 (Week 1-2) - Foundation & Core Infrastructure
**Day**: Day 2 of 10
**Goal**: Design and implement 5-level hierarchy schema (Phase → Week → Day → Task → Session)

---

## Overview

Create Prisma schema for ProjectPulse's unique 5-level task hierarchy with:

- Efficient parent-child relationships
- Progress roll-up calculations
- Time-window filtering
- Proper indexes for performance

---

## Implementation Steps

### 1. Environment Validation (5 min)

- [ ] Verify PostgreSQL container is running (`docker ps`)
- [ ] Check Prisma CLI available (`pnpm --filter @projectpulse/database prisma --version`)
- [ ] Test database connection (`pnpm --filter @projectpulse/database prisma db pull --force`)

### 2. Consult prisma-expert Agent (REQUIRED - Protocol Step 3)

- [ ] Invoke `prisma-expert` agent
- [ ] Questions:
  - Optimal index strategy for parent-child hierarchy queries
  - Best approach for progress roll-up calculations
  - Materialized path vs adjacency list for tree structure?
  - Recommendations for startDate/endDate filtering performance
  - Enum strategy for status field
- [ ] Review expert recommendations
- [ ] Incorporate guidance into schema design

### 3. Design Core Models (1 hour)

**Model Design Pattern** (apply to all 5 levels):

```prisma
model [Level] {
  // Identity
  id          String   @id @default(cuid())

  // Hierarchy
  [parent]Id  String?  // FK to parent (nullable for root)
  [parent]    [Parent]? @relation(fields: [parentId], references: [id], onDelete: Cascade)
  [children]  [Child][]

  // Core fields
  name        String
  description String?  @db.Text
  goal        String?  @db.Text

  // Time window
  startDate   DateTime
  endDate     DateTime?

  // Progress tracking
  status      Status   @default(NOT_STARTED)
  progress    Int      @default(0) // 0-100

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Indexes (based on expert recommendations)
  @@index([parentId])
  @@index([status])
  @@index([startDate, endDate])
}
```

**Models to Create**:

- [ ] Phase (root level, no parent)
- [ ] Week (parent: Phase)
- [ ] Day (parent: Week)
- [ ] Task (parent: Day)
- [ ] Session (parent: Task, leaf level)

**Status Enum**:

```prisma
enum Status {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  BLOCKED
  CANCELLED
}
```

### 4. Define Relationships (30 min)

- [ ] One-to-many cascading relations (delete parent → delete children)
- [ ] Proper foreign key constraints
- [ ] Composite indexes based on expert recommendation
- [ ] Ensure circular reference prevention

### 5. Create Initial Migration (15 min)

```bash
cd packages/database
pnpm prisma migrate dev --name init_sprint_hierarchy
```

- [ ] Review generated SQL
- [ ] Apply migration to development database
- [ ] Verify tables created successfully
- [ ] Check indexes are in place

### 6. Validate Prisma Client Generation (10 min)

```bash
pnpm --filter @projectpulse/database prisma generate
pnpm type-check
```

- [ ] Prisma Client generates without errors
- [ ] TypeScript types available for all models
- [ ] No type errors in codebase

### 7. Create Seed Script (30 min)

**Sample Data Structure**:

```
Phase A: Foundation & Core Infrastructure
├── Week 1: Setup & Database
│   ├── Day 1: Environment Setup ✅
│   ├── Day 2: Prisma Schema (IN PROGRESS)
│   ├── Day 3: Schema Validation
│   └── Day 4-5: MCP Server Scaffold
└── Week 2: MCP Tools Implementation
    └── Day 6-10: Core tools
```

Seed script should create:

- [ ] 1 Phase ("Phase A - Foundation")
- [ ] 2 Weeks (Week 1: Setup, Week 2: Implementation)
- [ ] 5 Days under Week 1
- [ ] 10 Tasks under Day 1-2
- [ ] 3 Sessions under Task 1

**Seed Script Path**: `packages/database/prisma/seed.ts`

### 8. Test Data Integrity (20 min)

- [ ] Open Prisma Studio: `pnpm --filter @projectpulse/database prisma studio`
- [ ] Verify all 5 levels visible
- [ ] Test parent-child relationships
- [ ] Verify cascade delete works
- [ ] Check progress calculations
- [ ] Test date filtering queries

### 9. Create Basic CRUD Tests (optional, time permitting)

```typescript
// packages/database/src/__tests__/hierarchy.test.ts
describe('Sprint Hierarchy', () => {
  test('creates Phase with nested Week', ...)
  test('calculates progress roll-up correctly', ...)
  test('cascade delete removes children', ...)
  test('filters by date range', ...)
})
```

---

## Success Criteria

✅ **Must Achieve**:

- Schema defines all 5 models with correct relationships
- Migration successfully creates tables in PostgreSQL
- Prisma Client generates without TypeScript errors
- Seed data populates successfully
- Can query full hierarchy (Phase → Week → Day → Task → Session)
- Progress calculations are accurate (roll-up logic)

✅ **Quality Gates**:

- `pnpm type-check` passes
- No Prisma schema validation errors
- Cascade delete works correctly
- Indexes are in place for performance

---

## Technical Decisions Needed

**Decision 1**: Progress Roll-up Strategy

- Option A: Calculated field (compute on read)
- Option B: Stored field with update trigger
- Option C: Hybrid (store + periodic recalc)
- **Consult prisma-expert for recommendation**

**Decision 2**: Date Filtering Performance

- Option A: Simple DateTime fields with index
- Option B: Date range columns (tsrange in PostgreSQL)
- Option C: Materialized view for date queries
- **Consult prisma-expert for recommendation**

**Decision 3**: Tree Query Strategy

- Option A: Adjacency list (current parent-child FK)
- Option B: Materialized path (store full path)
- Option C: Nested sets (left/right boundaries)
- **Consult prisma-expert for recommendation**

---

## Risks & Mitigations

| Risk                         | Impact             | Likelihood | Mitigation                           |
| ---------------------------- | ------------------ | ---------- | ------------------------------------ |
| Progress roll-up too complex | Performance issues | Medium     | Consult expert, benchmark approaches |
| Deep hierarchy queries slow  | UX degraded        | Medium     | Proper indexes, query optimization   |
| Migration conflicts          | Dev blocked        | Low        | Fresh DB for Sprint 1                |
| Circular references possible | Data corruption    | Low        | Add validation constraints           |

---

## Dependencies

**Requires**:

- PostgreSQL container running (Docker)
- Prisma CLI installed
- Database connection configured in `.env`

**Blocks**:

- Day 4-5: MCP Server Scaffold (needs schema types)
- Day 6-9: MCP Tools Implementation (needs CRUD operations)

---

## Token Budget

**Estimated**: 20-30K tokens (10-15% of session budget)

**Breakdown**:

- Expert consultation: 8-10K
- Schema design & migration: 5-8K
- Seed script creation: 3-5K
- Testing & validation: 4-7K

**Checkpoint at**: 15K tokens (before seed script)

---

## Protocol Compliance

- [x] Step 1: Session initialized ✅
- [x] Step 2: Plan created and saved ✅
- [ ] Step 3: Consult prisma-expert (NEXT)
- [ ] Step 4: Checkpoint at 15K tokens
- [ ] Step 5: Post-completion updates

---

## Next Steps After Day 2

1. Update `.agent/progress.md` - Sprint progress to ~25%
2. Update `.agent/active-context.md` - Schema completion
3. Update session log with Day 2 summary
4. Update todos file (mark 6 more tasks complete)
5. Commit: "feat(database): add Sprint hierarchy schema and migrations"
6. Begin Day 4-5: MCP Server Scaffold

---

**Plan Created**: 2025-11-06
**Estimated Completion**: 2-3 hours
**Status**: Ready for expert consultation
