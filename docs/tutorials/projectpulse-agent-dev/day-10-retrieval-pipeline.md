# Day 10 — Retrieval pipeline (semantic search, full-text search, hybrid ranking)

## Goals (what you should understand today)

By the end of Day 10, you should be able to explain:

1. The three retrieval modes in ProjectPulse:
   - semantic (pgvector)
   - full-text (tsvector)
   - hybrid (weighted merge)
2. The **exact scoring formulas** used.
3. The end-to-end read path:
   - API route → auth + project scoping → retrieval service → Postgres
4. Where performance/observability is measured (metrics + token estimation).
5. The main failure modes (embeddings down, SQL risk, slow queries) and what the system does.

---

## Mental model: retrieval is “deterministic backend work”

In ProjectPulse, retrieval is deterministic server logic.

- The server returns a small set of results (IDs, titles, excerpts, scores).
- The agent/LLM does generation.

Concrete boundaries:

- API route (HTTP contract):
  - `apps/web/app/api/knowledge/search/route.ts`
- Retrieval implementation (core logic):
  - `apps/web/lib/knowledge/search.ts`
- Embedding dependency:
  - `apps/web/lib/embeddings/index.ts`
- Observability:
  - `apps/web/lib/knowledge/metrics.ts`

---

## API entrypoint (what clients call)

### Endpoint

- `GET /api/knowledge/search`
- File: `apps/web/app/api/knowledge/search/route.ts`

### Inputs (query params)

- `query` (required, 1–1000 chars)
- `mode`: `semantic | fulltext | hybrid` (default: `hybrid`)
- `limit`: default 5, max 50
- `category` (optional)
- `projectId` (optional for user; required/forced for agent scoping)

Validation:

- Zod schema: `apps/web/lib/validations/knowledge.ts` → `searchKnowledgeSchema`

### Auth + project scoping

This route scopes requests using:

- `getAuthorizedProjectId(request, requestedProjectId)`
- File: `apps/web/lib/auth/validateRequest.ts`

This is important interview phrasing:

- “Even if the client passes `projectId`, the API re-validates access. Agents cannot cross project boundaries.”

---

## Retrieval service (where the real work lives)

Open:

- `apps/web/lib/knowledge/search.ts`

It defines:

- `semanticSearch(query, options)`
- `fullTextSearch(query, options)`
- `hybridSearch(query, options)`

And one shared error type:

- `SearchError` with:
  - `code` (e.g., `EMBEDDING_FAILED`, `DATABASE_ERROR`)
  - `statusCode` (e.g., 503)

---

## Mode 1: Semantic search (pgvector)

### What it does

- Generates a **query embedding** and compares it to stored embeddings using **cosine distance**.

### Where

- Function: `semanticSearch()`
- File: `apps/web/lib/knowledge/search.ts`

### Key scoring formula (exact)

The SQL returns cosine distance in range `[0, 2]` using:

- `embedding <=> query_vector::vector(768)`

Then it converts distance to similarity:

- `similarity = 1 - (distance / 2)`

### Default thresholds

- `threshold = 0.7` (default)
- `limit = 5` (default)

### Implementation details (important nuance)

- It fetches `limit * 2` candidates, then filters by threshold, then slices back to `limit`.

### Failure mode

- If embedding generation fails (Ollama/OpenAI), it throws:
  - `SearchError(code='EMBEDDING_FAILED', statusCode=503)`

---

## Mode 2: Full-text search (tsvector)

### What it does

- Uses PostgreSQL full-text search against `contentTsvector` and ranks with `ts_rank_cd`.

### Where

- Function: `fullTextSearch()`
- File: `apps/web/lib/knowledge/search.ts`

### Ranking + normalization

- It computes rank via:
  - `ts_rank_cd(contentTsvector, plainto_tsquery(...), 32)`
- It normalizes rank to 0–1 by dividing by maxRank in the result set:
  - `score = rank / maxRank`

### Default thresholds

- `threshold = 0.1` (default)

### Failure mode

- Full-text does **not** depend on embeddings, so it can keep working even if embedding providers are down.

---

## Mode 3: Hybrid search (merge semantic + full-text)

### What it does

Hybrid is a merge algorithm:

1. Run semantic + full-text in parallel.
2. Merge by ID.
3. Score with a weighted sum.

### Where

- Function: `hybridSearch()`
- File: `apps/web/lib/knowledge/search.ts`

### Exact weights (authoritative)

- `SEMANTIC_WEIGHT = 0.7`
- `FULLTEXT_WEIGHT = 0.3`

Final score:

- `score = semanticScore * 0.7 + fulltextScore * 0.3`

### Threshold tuning in hybrid

Hybrid intentionally uses lower thresholds to collect more candidates:

- semantic threshold: `0.5`
- full-text threshold: `0.05`
- both searches run with `limit * 2`

### Optional graph augmentation (important nuance)

- `hybridSearch()` supports `includeRelated`.
- It only fetches related items for the **top result** to avoid N+1 graph calls.
- It calls:
  - `findRelatedKnowledgeItems(topId, { maxDepth: 2, limit: 5, minStrength: 0.6 })`
  - from `apps/web/lib/knowledge/graph.ts`

Important nuance:

- The API route currently does **not** pass `includeRelated` into the `hybridSearch()` call.

---

## Observability: query metrics + token estimation

The API route records query performance asynchronously:

- `recordQueryMetric(...)`
- `estimateTokenUsage(results)`

Files:

- `apps/web/lib/knowledge/metrics.ts`

Token estimation rule (rough):

- `tokens ≈ total_chars / 4`

Why this is interview-relevant:

- “We treat retrieval as a performance-sensitive subsystem; we record latency and estimate token payload size.”

---

## Diagram-in-words: request lifecycle

```
Client (UI or MCP)
  → GET /api/knowledge/search?query=...&mode=hybrid
    → getAuthorizedProjectId()  (auth + scoping)
    → validate searchKnowledgeSchema
    → hybridSearch()
      → semanticSearch() → generateEmbedding() → pgvector distance
      → fullTextSearch() → tsvector rank
      → merge (0.7/0.3)
    → return JSON (results + meta)
    → recordQueryMetric() (async)
```

---

## Failure modes (and what to say)

- **Embeddings down**
  - semantic/hybrid can return 503 (`EMBEDDING_FAILED`)
  - mitigation: use `mode=fulltext`

- **SQL construction risk**
  - The retrieval code uses `$queryRawUnsafe` and manual string escaping.
  - In interviews you can say:
    - “We use raw SQL because pgvector isn’t fully supported by Prisma; we must be strict about parameterization to avoid SQL injection.”

- **Slow queries**
  - Without proper indexes (GIN/HNSW), semantic or full-text performance can degrade.
  - Metrics exist to detect this (`KnowledgeQueryMetric`).

---

## Exercises (do later)

### Exercise A: Explain the scoring in 5 lines

Your answer must include:

- cosine distance → similarity formula
- full-text normalization (rank/maxRank)
- hybrid weights (0.7/0.3)

### Exercise B: Trace an agent call

Trace the tool:

- `projectpulse_knowledge_search`

through:

- MCP tool → API route → service → Postgres

---

## Completion checklist

- [ ] I can explain semantic search with the exact similarity formula.
- [ ] I can explain full-text search ranking and normalization.
- [ ] I can explain hybrid merge + exact weights.
- [ ] I can name 3 realistic failure modes and mitigations.
