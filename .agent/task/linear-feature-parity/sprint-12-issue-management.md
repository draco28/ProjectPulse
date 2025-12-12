# Sprint 12: Issue Management Feature Parity

**Duration**: 2 weeks
**Focus**: Match Linear's core issue tracking capabilities
**Status**: Planned

---

## Overview

Sprint 12 addresses the three most impactful issue management gaps:
1. **Issue Relations** - Enable blocking, duplicates, and related issue linking
2. **Similar Issue Detection** - Prevent duplicate work with AI-powered suggestions
3. **Custom Views** - Save and share filtered ticket lists

---

## Feature 1: Issue Relations System

**Estimated Effort**: 4 days
**Linear Equivalent**: Issue Relations (blocking, related, duplicate)

### Requirements

1. Support relation types:
   - `BLOCKS` / `BLOCKED_BY` (bidirectional)
   - `RELATES_TO` (bidirectional)
   - `DUPLICATES` / `DUPLICATED_BY` (bidirectional)

2. Prevent circular blocking (A blocks B blocks A)

3. Show relations in ticket detail view

4. Create relations during ticket creation or editing

### Database Schema

```prisma
model TicketRelation {
  id            String   @id @default(cuid())

  // Source ticket
  sourceTicketId Int
  sourceTicket   Ticket   @relation("RelationSource", fields: [sourceTicketId], references: [id], onDelete: Cascade)

  // Target ticket
  targetTicketId Int
  targetTicket   Ticket   @relation("RelationTarget", fields: [targetTicketId], references: [id], onDelete: Cascade)

  // Relation type
  relationType   RelationType

  // Metadata
  createdAt     DateTime @default(now())
  createdBy     String?  // User or agent who created

  @@unique([sourceTicketId, targetTicketId, relationType])
  @@index([sourceTicketId])
  @@index([targetTicketId])
}

enum RelationType {
  BLOCKS
  BLOCKED_BY
  RELATES_TO
  DUPLICATES
  DUPLICATED_BY
}
```

### API Endpoints

```
POST   /api/tickets/[id]/relations     - Create relation
GET    /api/tickets/[id]/relations     - List relations
DELETE /api/tickets/[id]/relations/[relationId] - Remove relation
```

### Files to Create/Modify

- `apps/web/prisma/schema.prisma` - Add TicketRelation model
- `apps/web/app/api/tickets/[id]/relations/route.ts` (new) - CRUD endpoints
- `apps/web/components/tickets/RelationsPanel.tsx` (new) - UI component
- `apps/web/components/tickets/AddRelationModal.tsx` (new) - Modal for creating
- `apps/mcp-server/src/tools/ticket/relations.ts` (new) - MCP tools

### MCP Tools

```typescript
// ticket.addRelation
{
  sourceTicketId: number,
  targetTicketId: number,
  relationType: "BLOCKS" | "RELATES_TO" | "DUPLICATES"
}

// ticket.getRelations
{
  ticketId: number
}

// ticket.removeRelation
{
  relationId: string
}
```

### Validation Rules

1. Cannot create relation to self
2. Cannot create duplicate relations
3. Circular blocking detection:
   - If A blocks B, and B blocks C, then C cannot block A
   - Use graph traversal to detect cycles

### UI Design

```
┌─────────────────────────────────────┐
│ Related Issues                       │
├─────────────────────────────────────┤
│ 🚫 Blocked by                        │
│   • PROJ-123: Fix auth bug          │
│                                      │
│ ⏸️ Blocks                            │
│   • PROJ-456: Deploy to prod        │
│                                      │
│ 🔗 Related                           │
│   • PROJ-789: Update docs           │
│                                      │
│ [+ Add Relation]                     │
└─────────────────────────────────────┘
```

---

## Feature 2: Similar Issue Detection

**Estimated Effort**: 3 days
**Linear Equivalent**: Similar issue detection using LLMs

### Requirements

1. During ticket creation, query for similar existing tickets
2. Use existing pgvector embeddings for semantic search
3. Show suggestions with similarity score
4. Allow user to link as duplicate or dismiss

### Implementation

```typescript
// apps/web/app/api/tickets/similar/route.ts
export async function POST(request: Request) {
  const { title, description, projectId } = await request.json();

  // Generate embedding for input text
  const embedding = await generateEmbedding(`${title} ${description}`);

  // Query pgvector for similar tickets
  const similarTickets = await prisma.$queryRaw`
    SELECT
      t.id, t.title, t.status,
      1 - (t.embedding <=> ${embedding}::vector) as similarity
    FROM "Ticket" t
    WHERE t."projectId" = ${projectId}
      AND t.status NOT IN ('completed', 'cancelled')
      AND 1 - (t.embedding <=> ${embedding}::vector) > 0.7
    ORDER BY similarity DESC
    LIMIT 5
  `;

  return NextResponse.json({ similarTickets });
}
```

### Files to Create/Modify

- `apps/web/app/api/tickets/similar/route.ts` (new) - Similarity API
- `apps/web/components/tickets/SimilarIssuesAlert.tsx` (new) - Warning component
- `apps/web/components/tickets/CreateTicketForm.tsx` - Integrate detection
- `apps/web/hooks/useSimilarTickets.ts` (new) - Debounced query hook

### UI Flow

1. User types title in Create Ticket form
2. After 500ms debounce, query similar tickets API
3. If matches found (>70% similarity), show alert:

```
┌─────────────────────────────────────────────┐
│ ⚠️ Similar issues found                      │
├─────────────────────────────────────────────┤
│ These existing issues may be duplicates:    │
│                                             │
│ • PROJ-123: Fix login timeout (92% match)   │
│   [View] [Mark as Duplicate]                │
│                                             │
│ • PROJ-456: Auth session bug (78% match)    │
│   [View] [Mark as Duplicate]                │
│                                             │
│ [Dismiss - Create New Issue]                │
└─────────────────────────────────────────────┘
```

---

## Feature 3: Custom Views (Saved Filters)

**Estimated Effort**: 3 days
**Linear Equivalent**: Custom Views

### Requirements

1. Save current filter configuration as a named view
2. Load saved views from dropdown
3. Default views: "My Issues", "Blocked", "This Sprint"
4. Share views with project (optional)

### Database Schema

```prisma
model SavedView {
  id          String   @id @default(cuid())

  name        String
  projectId   Int
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Owner (null = shared/default view)
  userId      Int?
  user        User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Filter configuration (JSON)
  filters     Json     // { status: [], priority: [], assignee: [], labels: [], search: "" }

  // Sort configuration
  sortBy      String?  // "createdAt", "updatedAt", "priority"
  sortDir     String?  // "asc", "desc"

  // View settings
  isDefault   Boolean  @default(false)
  isShared    Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([projectId, name, userId])
  @@index([projectId])
  @@index([userId])
}
```

### API Endpoints

```
POST   /api/views           - Create saved view
GET    /api/views           - List views for project
GET    /api/views/[id]      - Get view details
PUT    /api/views/[id]      - Update view
DELETE /api/views/[id]      - Delete view
```

### Files to Create/Modify

- `apps/web/prisma/schema.prisma` - Add SavedView model
- `apps/web/app/api/views/route.ts` (new) - CRUD endpoints
- `apps/web/components/tickets/ViewSelector.tsx` (new) - Dropdown component
- `apps/web/components/tickets/SaveViewModal.tsx` (new) - Save dialog
- `apps/web/app/(authenticated)/tickets/page.tsx` - Integrate view selector

### Default Views (Seeded)

```typescript
const defaultViews = [
  {
    name: "My Issues",
    filters: { assignee: ["{{currentUser}}"] },
    isDefault: true,
    isShared: true
  },
  {
    name: "Blocked",
    filters: { status: ["blocked"] },
    isShared: true
  },
  {
    name: "This Sprint",
    filters: { linkedTaskId: "{{currentSprintTasks}}" },
    isShared: true
  },
  {
    name: "High Priority",
    filters: { priority: ["critical", "high"] },
    isShared: true
  }
];
```

### UI Design

```
┌─────────────────────────────────────────────┐
│ Views: [All Issues ▼]  [+ Save Current View]│
├─────────────────────────────────────────────┤
│ ▼ Default Views                             │
│   • All Issues                              │
│   • My Issues                               │
│   • Blocked                                 │
│   • This Sprint                             │
│   • High Priority                           │
│ ▼ My Views                                  │
│   • Frontend Bugs                           │
│   • API Tasks                               │
└─────────────────────────────────────────────┘
```

---

## Success Criteria

- [ ] Issue relations working (BLOCKS, BLOCKED_BY, RELATES_TO, DUPLICATES)
- [ ] Circular blocking prevention validated
- [ ] Similar issue detection showing during ticket creation
- [ ] Link-or-dismiss flow working for duplicates
- [ ] Custom views saveable and loadable
- [ ] Default views created ("My Issues", "Blocked", "This Sprint")
- [ ] All features have MCP tool equivalents
- [ ] E2E tests passing for all new features

---

## Dependencies

- Existing `Ticket` model
- Existing pgvector embedding infrastructure
- Existing ticket filtering UI

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Circular blocking detection performance | Use recursive CTE with depth limit |
| Similar detection false positives | Tune similarity threshold (start at 0.7) |
| View filter complexity | Start simple, add advanced filters later |
