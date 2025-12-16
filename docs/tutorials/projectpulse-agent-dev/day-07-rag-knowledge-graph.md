# Day 07 — RAG & Knowledge Graph deep dive (schema + embeddings + search + traversal)

## Goals (what you should understand today)

By the end of Day 07, you should be able to explain:

1. What “RAG” means in ProjectPulse (retrieval on the server, generation in the agent).
2. The storage schema for:
   - knowledge items
   - vector embeddings + full-text index
   - graph relationships
   - query performance metrics
3. The full lifecycle of:
   - create knowledge item → embed → store → index
   - search knowledge item (semantic / full-text / hybrid)
   - traverse related items (1–2 hops)
4. Where “the real work” lives (API routes + services) and what the MCP tools are doing.

---

## Mental model: RAG in ProjectPulse

ProjectPulse implements the **Retrieval** part of RAG. The **Generation** happens in the agent/LLM (Claude/Windsurf/etc.).

- Retrieval inputs:
  - a query (text)
  - a project scope (`projectId`)
- Retrieval outputs:
  - a small set of relevant knowledge items (with scores + excerpts)
  - optionally “nearby” graph nodes

**Key idea:** Knowledge is stored in PostgreSQL in a form that supports:

- full-text search (tsvector)
- semantic search (pgvector embeddings)
- graph traversal (relationship edges)

---

## The schema (authoritative)

Open:

- `apps/web/prisma/schema.prisma`

### KnowledgeItem (RAG document store)

Model:

- `KnowledgeItem` (mapped to table `knowledge_items`)

Important fields:

- `projectId` (multi-tenancy scope)
- `title`, `content`, `category`, `tags[]`
- `embedding Unsupported("vector(768)")`
- `contentTsvector Unsupported("tsvector")`
- `archivedAt` (soft delete)

Important indexes:

- `@@index([tags], type: Gin)`
- `@@index([contentTsvector], type: Gin)`
- comment notes: *“HNSW vector index created via raw SQL migration”*

### KnowledgeRelationship (graph edges)

Model:

- `KnowledgeRelationship` (mapped to table `knowledge_relationships`)

Fields:

- `fromId`, `toId` (edge endpoints)
- `relationType` (string enum-ish)
- `weight Decimal(3,2)` (edge strength)

Constraints:

- `@@unique([fromId, toId, relationType])`

### KnowledgeQueryMetric (observability)

Model:

- `KnowledgeQueryMetric` (mapped to `knowledge_query_metrics`)

Fields:

- `query`, `queryMode`
- `latencyMs`, `resultCount`, `tokenUsage`
- optional `category`, `userAgent`

This powers the “are we fast enough?” narrative.

---

## Embeddings pipeline (where vectors come from)

Open:

- `apps/web/lib/embeddings/index.ts`

Facts:

- Embedding vector dimension is consistently **768**.
- Provider selection:
  - primary: Ollama (local) — `nomic-embed-text`
  - fallback: OpenAI — `text-embedding-3-large`

Key entrypoints:

- `generateEmbedding(text, options?)`
- `generateBatchEmbeddings(texts, options?)`
- `checkEmbeddingProviders()`

Failure modes you should expect:

- Ollama not running/reachable → fallback to OpenAI (if configured)
- No OpenAI key configured → both providers fail → `EmbeddingServiceError`

Interview wording:

- “We prefer local embeddings via Ollama for cost/privacy, and fall back to OpenAI if configured. Either way we normalize to 768 dims so the database schema stays stable.”

---

## Create flow: knowledge item creation (write path)

### Agent → MCP tool → API

- MCP tool:
  - `projectpulse_knowledge_create`
  - `apps/mcp-server/src/tools/knowledge/createTool.ts`

- Next.js API route:
  - `POST /api/knowledge`
  - `apps/web/app/api/knowledge/route.ts`

### API → service

- Service:
  - `apps/web/lib/knowledge/create.ts`

Pipeline inside `createKnowledgeItem()`:

1. Generate embedding from:
   - `embeddingText = title + "\n\n" + content`
2. Deduplication (US-089), unless `allowDuplicates=true`:
   - exact title match (case-insensitive)
   - semantic similarity >= 0.95
   - implemented in `apps/web/lib/knowledge/deduplication.ts`
3. Insert into DB using raw SQL because Prisma doesn’t natively support pgvector:
   - uses `prisma.$queryRaw` template literal
4. Writes full-text vector:
   - `setweight(to_tsvector('english', title), 'A') || setweight(to_tsvector('english', content), 'B')`

Why this is interview-relevant:

- “The write path creates *both* retrieval indexes: embedding vector + tsvector.”

---

## Search flow: semantic vs full-text vs hybrid (read path)

### API entrypoint

- `GET /api/knowledge/search`
- `apps/web/app/api/knowledge/search/route.ts`

Auth + multi-tenancy:

- uses `getAuthorizedProjectId(request, requestedProjectId)`
  - `apps/web/lib/auth/validateRequest.ts`

### Core search service

- `apps/web/lib/knowledge/search.ts`

There are three implementations:

#### 1) Semantic search (pgvector)

- function: `semanticSearch(query, { projectId, limit, threshold, category })`

Key detail:

- generates a query embedding (`generateEmbedding(query)`) and compares it with stored `KnowledgeItem.embedding` using cosine distance:
  - `embedding <=> '...'::vector(768)`

Scoring:

- converts distance → similarity:
  - `score = 1 - (distance / 2)`

#### 2) Full-text search (tsvector)

- function: `fullTextSearch(query, { projectId, limit, threshold, category })`

Key detail:

- queries `contentTsvector` with `plainto_tsquery('english', query)`
- ranks with `ts_rank_cd(...)` and normalizes scores

#### 3) Hybrid search (merge)

- function: `hybridSearch(query, { projectId, limit, category })`

Key detail:

- runs both searches in parallel with relaxed thresholds
- merges by ID with weighted scoring:
  - `0.7 * semantic + 0.3 * fulltext`

Important nuance:

- `hybridSearch()` supports `includeRelated` (graph augmentation for top result), but the current API route does not pass it through in the `hybrid` call.

### Metrics

The search API records metrics asynchronously:

- `apps/web/lib/knowledge/metrics.ts` (`recordQueryMetric`, `estimateTokenUsage`)
- stored in `KnowledgeQueryMetric` table

This is how you justify performance/observability in interviews.

---

## Knowledge graph traversal (related items)

### API entrypoint

- `GET /api/knowledge/related`
- `apps/web/app/api/knowledge/related/route.ts`

### Core graph service

- `apps/web/lib/knowledge/graph.ts`

The traversal algorithm:

- 1-hop:
  - fetch neighbors where `fromId=itemId OR toId=itemId`
  - filter by `weight >= minStrength`
  - join back to `knowledge_items` with project + archived filters
- 2-hop:
  - uses the 1-hop IDs as intermediate nodes
  - filters out returning to source or already-in-1-hop nodes
  - reduces strength for 2-hop results (`* 0.8`) to prefer direct neighbors
- deduplicates results by ID, sorts by strength, returns top `limit`

This is intentionally bounded:

- maxDepth is constrained to **1 or 2** (prevents runaway traversal + keeps responses small)

---

## Import/export (operational workflows)

### Export

- API:
  - `GET /api/knowledge/export`
  - `apps/web/app/api/knowledge/export/route.ts`

Capabilities:

- filter by `category`, `tags`, `since`, `limit`
- optionally include embeddings (large)
- optionally include relationships

### Import

- API:
  - `POST /api/knowledge/import`
  - `apps/web/app/api/knowledge/import/route.ts`

How it works:

- parses Markdown + YAML frontmatter via `gray-matter`
- calls `createKnowledgeItem(...)` for each file (so embeddings + dedup still apply)

---

## Archiving (soft delete)

- API:
  - `PATCH /api/knowledge/[id]/archive` and `DELETE /api/knowledge/[id]/archive`
  - `apps/web/app/api/knowledge/[id]/archive/route.ts`

Key behavior:

- archived items are excluded by default in listing/search (`archivedAt = null` filters)

---

## Security + multi-tenancy recap

Every knowledge operation is project-scoped:

- `KnowledgeItem.projectId` is required
- APIs validate project access via:
  - `getAuthorizedProjectId` or `requireProjectAccess`
  - `apps/web/lib/auth/validateRequest.ts`

Interview wording:

- “All retrieval and graph traversal is scoped by `projectId`, and agent tokens can’t cross project boundaries.”

---

## Failure modes (and how to explain them)

- **Embedding provider unavailable**
  - semantic/hybrid searches can fail with 503 (`SearchError` / `EmbeddingServiceError`)
- **Vector mismatch**
  - embeddings must be 768-dim; schema requires `vector(768)`
- **Index missing / slow queries**
  - without the intended HNSW index, semantic search can degrade
- **Raw SQL risks**
  - search + dedup contain raw SQL construction (`$queryRawUnsafe` in some paths)
  - in interviews you can say:
    - “We use raw SQL where Prisma lacks pgvector support. We should be careful about SQL injection and prefer parameterization patterns wherever possible.”

---

## Exercises (do later)

### Exercise A: Trace the write path

Trace one `projectpulse_knowledge_create` call end-to-end:

- MCP tool: `apps/mcp-server/src/tools/knowledge/createTool.ts`
- API route: `apps/web/app/api/knowledge/route.ts`
- Service: `apps/web/lib/knowledge/create.ts`
- Embeddings: `apps/web/lib/embeddings/index.ts`

Write down:

- where embedding is generated
- where dedup happens
- where the `tsvector` is created

### Exercise B: Explain hybrid ranking in 3 lines

Use the exact weights and describe why it’s done.

### Exercise C: Explain the graph traversal guardrails

Explain why maxDepth is limited to 2 and why 2-hop edges are down-weighted.

---

## Completion checklist

- [ ] I can explain the schema fields that enable full-text + semantic search.
- [ ] I can explain how embeddings are generated and why they’re 768-dim.
- [ ] I can explain hybrid search scoring and graph traversal.

Next: Day 08 — End-to-end architecture walkthrough (agent→MCP→API→DB and UI→API→DB) with “diagrams in words”
