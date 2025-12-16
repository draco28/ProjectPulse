# Day 11 — Knowledge graph traversal (1–2 hop traversal, weights, relationship types)

## Goals (what you should understand today)

By the end of Day 11, you should be able to explain:

1. What the “knowledge graph” is in ProjectPulse:
   - nodes = knowledge items
   - edges = relationships
2. How traversal works (1 hop vs 2 hops) and why it is bounded.
3. How edge weights and depth affect ranking.
4. How multi-tenancy is enforced (project-scoped traversal).
5. The main failure modes (missing edges, item not found, SQL risks, performance).

---

## Mental model: graph traversal adds “connected context”

Retrieval (Day 10) answers:

- “What is relevant to this query?”

Graph traversal answers:

- “What is connected to this node?”

In interviews:

- “RAG gets top matches; the graph gets related prerequisites/dependencies/refs. We cap traversal to keep latency and token usage bounded.”

---

## Where graph traversal is implemented (authoritative)

### Service layer

- `apps/web/lib/knowledge/graph.ts`

Key exports:

- `findRelatedKnowledgeItems(itemId, options)`
- `getRelationshipStats(itemId)`

### API entrypoint

- `GET /api/knowledge/related`
- `apps/web/app/api/knowledge/related/route.ts`

---

## API: GET /api/knowledge/related

File:

- `apps/web/app/api/knowledge/related/route.ts`

Parameters:

- `projectId` (scoping)
- `itemId` (source node)
- `maxDepth` (1 or 2)
- `limit` (1..50)
- `minStrength` (0..1)

Auth + scoping:

- `getAuthorizedProjectId(request, requestedProjectId)`
- `apps/web/lib/auth/validateRequest.ts`

---

## Traversal algorithm (step-by-step)

File:

- `apps/web/lib/knowledge/graph.ts`

### Inputs (options)

- `projectId` (required)
- `maxDepth` default 2 (must be 1 or 2)
- `limit` default 10
- `minStrength` default 0.5
- `relationshipTypes` optional filter
- `includePath` optional

### Step 0: validate source item

The service first verifies the node exists and belongs to the project:

- `prisma.knowledgeItem.findFirst({ where: { id: itemId, projectId } })`

If missing:

- `GraphError(code='ITEM_NOT_FOUND', statusCode=404)`

### Step 1: 1-hop neighborhood

It finds direct relationships in *both directions*:

- outgoing edges: `fromId = itemId` → `toId`
- incoming edges: `toId = itemId` → `fromId`

It filters by:

- `weight >= minStrength`
- optional `relationType` filter

Implementation note:

- Uses raw SQL with Prisma column names: `fromId`, `toId`, `relationType`, `weight`.

### Step 2: 2-hop neighborhood (bounded expansion)

Only runs if:

- `maxDepth === 2`
- there are any 1-hop results

Key rules in the SQL:

- Expand from the 1-hop IDs (`oneHopIds`).
- Exclude:
  - returning to the source (`!= itemId`)
  - returning to any 1-hop node (`!= ALL(oneHopIds)`)
- Relax threshold slightly:
  - uses `minStrength * 0.8` for 2-hop edge selection.

### Step 3: combine, dedupe, and down-weight 2-hop

Combining rules:

- 1-hop nodes are inserted first (priority).
- 2-hop nodes are added only if not already present.
- 2-hop results have strength down-weighted:
  - `strength = strength * 0.8`

Then it sorts by `strength desc` and slices to `limit`.

### Optional: include path

If `includePath === true`:

- it fetches intermediate node titles via Prisma to render paths like:
  - `[sourceTitle, intermediateTitle, targetTitle]`

---

## Relationship types (what they mean)

The code treats relationship types as string values (examples listed in interface docs):

- `prerequisite`
- `related`
- `extends`
- `depends-on`
- `implements`
- `references`

The traversal function can filter to a subset using `relationshipTypes`.

---

## Diagram-in-words: traversal lifecycle

```
Client
  → GET /api/knowledge/related?itemId=123&maxDepth=2&minStrength=0.5
    → getAuthorizedProjectId()  (auth + scoping)
    → findRelatedKnowledgeItems(123)
      → verify item exists in project
      → 1-hop SQL (incoming + outgoing)
      → if maxDepth=2:
           2-hop SQL (expand from 1-hop, exclude loops)
      → merge + dedupe + down-weight 2-hop
    ← JSON { relatedItems[], meta }
```

---

## Failure modes

- **No edges**
  - result is empty array (not an error)

- **Source item not found**
  - 404 (`ITEM_NOT_FOUND`)

- **Invalid depth/strength/limit**
  - 400 via input validation in `graph.ts` or API route

- **SQL risks**
  - Implementation uses `$queryRawUnsafe` + string interpolation.
  - Same interview framing as retrieval:
    - “We use raw SQL where Prisma is limiting; we should keep it parameterized to reduce injection risk.”

---

## Exercises (do later)

### Exercise A: Explain why maxDepth is capped at 2

Your answer must mention:

- token budget control
- latency control
- signal-to-noise

### Exercise B: Explain how 2-hop results are penalized

Use the exact rule:

- `strength * 0.8`

---

## Completion checklist

- [ ] I can describe 1-hop vs 2-hop traversal.
- [ ] I can explain minStrength and 2-hop relaxation (`minStrength * 0.8`).
- [ ] I can explain the 2-hop penalty (`strength * 0.8`).
- [ ] I can name the API endpoint and service file that implement traversal.
