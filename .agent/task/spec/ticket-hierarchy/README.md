# Ticket Hierarchy Implementation Spec

**Date**: 2025-12-18
**Feature**: Two-Level Ticket Hierarchy (Feature → Task) with Traceability
**Status**: In Progress

---

## Executive Summary

Add a **two-level ticket hierarchy** (Feature → Task) with traceability fields to ProjectPulse. This enables agents to work in a structured manner: create feature tickets for sprint work, then break them into task tickets.

**Key Design Decisions:**
- Epic is a **soft reference** (`epicRef` string), NOT a parent-child relationship
- Sprint is a **field** on tickets (`sprintNumber`), NOT a separate entity
- Only `kind=feature` tickets can have children
- Only `kind=task|issue|bug|tech_debt` tickets can have a parent
- Progress propagation is **MANUAL** (user closes feature when done)

---

## 1. User Requirements Summary

From conversation with user:

| Concept | Is it a Ticket? | How to Track |
|---------|-----------------|--------------|
| **Epic** | No | Soft reference via `epicRef` field |
| **Sprint** | No | Field on ticket: `sprintNumber: 1` |
| **Feature** | Yes | `kind: "feature"`, can have children |
| **Task** | Yes | `kind: "task"`, `parentTicketId → feature` |

### Agent Workflow (Target)
```
Agent starts Sprint 1:
1. Query: "Get all feature tickets where sprintNumber = 1"
   → Returns: Feature A, Feature B

2. Agent picks Feature A to work on

3. Agent creates task tickets under Feature A:
   - Task 1 (parentTicketId: Feature A)
   - Task 2 (parentTicketId: Feature A)

4. Agent completes tasks, marks done
5. All tasks done → User manually closes Feature A
```

### Post-Onboarding: Traceability Matrix
- Generate matrix after Session 3 completes
- Store as Knowledge Item for agent retrieval
- Use graph relationships for navigation

---

## 2. Schema Changes

### File: `apps/web/prisma/schema.prisma`

Add to Ticket model (~line 359):

```prisma
model Ticket {
  // ... existing fields ...

  // NEW: Two-level hierarchy (Feature → Task/Issue/Bug)
  parentTicketId Int?
  parentTicket   Ticket?  @relation("TicketHierarchy", fields: [parentTicketId], references: [id], onDelete: SetNull)
  childTickets   Ticket[] @relation("TicketHierarchy")

  // NEW: Traceability fields
  epicRef      String?   @db.VarChar(200) // "Epic 1: User Management"
  backlogRefs  String[]  @default([])      // ["FR-001", "FR-002"]
  sprintNumber Int?                        // Sprint number for filtering

  // NEW: Indexes
  @@index([parentTicketId])
  @@index([projectId, parentTicketId])
  @@index([projectId, sprintNumber])
  @@index([projectId, epicRef])
}
```

### Migration SQL

```sql
ALTER TABLE "tickets" ADD COLUMN "parent_ticket_id" INTEGER;
ALTER TABLE "tickets" ADD COLUMN "epic_ref" VARCHAR(200);
ALTER TABLE "tickets" ADD COLUMN "backlog_refs" TEXT[] DEFAULT '{}';
ALTER TABLE "tickets" ADD COLUMN "sprint_number" INTEGER;

ALTER TABLE "tickets" ADD CONSTRAINT "tickets_parent_ticket_id_fkey"
  FOREIGN KEY ("parent_ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL;

CREATE INDEX "tickets_parent_ticket_id_idx" ON "tickets"("parent_ticket_id");
CREATE INDEX "tickets_project_parent_idx" ON "tickets"("project_id", "parent_ticket_id");
CREATE INDEX "tickets_project_sprint_idx" ON "tickets"("project_id", "sprint_number");
CREATE INDEX "tickets_project_epic_idx" ON "tickets"("project_id", "epic_ref");
```

---

## 3. Validation Rules

| Rule | Description | Error Code |
|------|-------------|------------|
| `PARENT_MUST_BE_FEATURE` | Only `kind=feature` tickets can have children | 400 |
| `CHILD_KIND_RESTRICTED` | Only `task`, `issue`, `bug`, `tech_debt` can have a parent | 400 |
| `EPIC_CANNOT_BE_PARENT` | `kind=epic` tickets cannot be parents (use epicRef) | 400 |
| `SAME_PROJECT_REQUIRED` | Parent must be in same project | 400 |
| `NO_CIRCULAR_REFERENCE` | Ticket cannot be its own ancestor | 400 |
| `NO_SELF_PARENT` | Ticket cannot be its own parent | 400 |

### Validation Helper: `apps/web/lib/tickets/hierarchy.ts`

```typescript
const PARENT_CAPABLE_KINDS = ['feature'] as const;
const CHILD_CAPABLE_KINDS = ['task', 'issue', 'bug', 'tech_debt'] as const;

export function canHaveChildren(kind: string): boolean;
export function canHaveParent(kind: string): boolean;
export async function validateParentTicket(prisma, parentId, childProjectId, childKind): Promise<void>;
export async function checkCircularReference(prisma, ticketId, newParentId): Promise<boolean>;
```

---

## 4. API Changes

### Updated Endpoints

| Endpoint | New Fields/Params |
|----------|-------------------|
| `POST /api/tickets` | `parentTicketId`, `epicRef`, `backlogRefs[]`, `sprintNumber` |
| `PATCH /api/tickets/[id]` | Same + circular reference validation |
| `GET /api/tickets` | Query: `parentTicketId`, `hasChildren`, `epicRef`, `sprintNumber`, `isTopLevel` |
| `GET /api/tickets/[id]` | Response: `parent`, `childrenCount`, `children[]` |

### New Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/tickets/[id]/children` | Get paginated children of a feature ticket |
| `GET /api/tickets/[id]/hierarchy` | Get complete tree: parent + ticket + all children |

---

## 5. MCP Tool Changes

### Updated Tools

| Tool | New Input Fields | New Filters |
|------|------------------|-------------|
| `ticket_create` | `parentTicketId`, `epicRef`, `backlogRefs[]`, `sprintNumber` | - |
| `ticket_update` | same as create | - |
| `ticket_search` | - | `parentTicketId`, `hasChildren`, `epicRef`, `sprintNumber`, `isTopLevel` |

### New Tools

| Tool | File | Purpose |
|------|------|---------|
| `projectpulse_ticket_getChildren` | `tickets/getChildren.ts` | Get children of feature |
| `projectpulse_ticket_getHierarchy` | `tickets/getHierarchy.ts` | Get full hierarchy |
| `projectpulse_traceability_generate` | `traceability/generate.ts` | Generate matrix from backlogRefs |

---

## 6. Post-Onboarding Traceability

### New Endpoint: `POST /api/traceability/generate`

**Request**: `{ projectId: number }`

**Response**:
```typescript
{
  matrix: {
    covered: [{ backlogRef: string, tickets: Ticket[] }],
    uncovered: string[],
    stats: { totalRefs: number, coveredRefs: number, coveragePercent: number }
  },
  knowledgeItemId: number
}
```

### Knowledge Item Storage
```typescript
{
  title: "Traceability Matrix - YYYY-MM-DD",
  category: "traceability",
  tags: ["matrix", "coverage", "backlog"],
  content: "<markdown table>"
}
```

---

## 7. Files to Create/Modify

### CREATE (New Files)
| File | Purpose |
|------|---------|
| `apps/web/lib/tickets/hierarchy.ts` | Validation helpers |
| `apps/web/app/api/tickets/[id]/children/route.ts` | Children endpoint |
| `apps/web/app/api/tickets/[id]/hierarchy/route.ts` | Hierarchy endpoint |
| `apps/web/app/api/traceability/generate/route.ts` | Traceability generation |
| `apps/mcp-server/src/tools/tickets/getChildren.ts` | MCP tool |
| `apps/mcp-server/src/tools/tickets/getHierarchy.ts` | MCP tool |
| `apps/mcp-server/src/tools/traceability/generate.ts` | MCP tool |

### MODIFY (Existing Files)
| File | Changes |
|------|---------|
| `apps/web/prisma/schema.prisma` | Add 4 fields + 4 indexes + self-relation |
| `apps/web/lib/validations/ticket.ts` | Add new field schemas |
| `apps/web/app/api/tickets/route.ts` | Add hierarchy fields to POST/GET |
| `apps/web/app/api/tickets/[id]/route.ts` | Add hierarchy to PATCH/GET detail |
| `apps/mcp-server/src/tools/tickets/create.ts` | Add 4 new fields |
| `apps/mcp-server/src/tools/tickets/update.ts` | Add 4 fields + circular check |
| `apps/mcp-server/src/tools/tickets/search.ts` | Add 5 new filters |
| `apps/mcp-server/src/tools/index.ts` | Register 3 new tools |

---

## 8. Implementation Order

### Phase 1: Database Layer
1. Update `schema.prisma` with new fields
2. Create migration
3. Run migration

### Phase 2: Validation Layer
1. Create `hierarchy.ts`
2. Update `ticket.ts` validation schemas

### Phase 3: API Layer
1. Update POST/PATCH/GET `/api/tickets`
2. Update GET `/api/tickets/[id]`
3. Create `/api/tickets/[id]/children`
4. Create `/api/tickets/[id]/hierarchy`

### Phase 4: MCP Tools
1. Update `create.ts`, `update.ts`, `search.ts`
2. Create `getChildren.ts`, `getHierarchy.ts`
3. Register in `index.ts`

### Phase 5: Traceability
1. Create `/api/traceability/generate`
2. Create MCP `traceability_generate`

### Phase 6: Documentation
1. Update API docs
2. Update MCP tools guide

---

## 9. Success Criteria

- [ ] Ticket model has `parentTicketId`, `epicRef`, `backlogRefs[]`, `sprintNumber`
- [ ] Feature tickets can have task/issue/bug children
- [ ] Epic/scanner_finding kinds cannot be parents
- [ ] Circular references prevented
- [ ] MCP tools support hierarchy operations
- [ ] Traceability matrix generates from backlogRefs
- [ ] Matrix stored as Knowledge Item
- [ ] All tests pass

---

## 10. Estimated Effort

**Total: 4-5 days**
- Schema + Migration: 0.5 day
- Validation + Unit Tests: 0.5 day
- API + Integration Tests: 1.5 days
- MCP Tools + E2E Tests: 1.5 days
- Traceability + Docs: 1 day
