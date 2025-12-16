# Day 01 — System Map (How everything fits together)

## Goals (what you should understand today)

By the end of Day 01, you should be able to explain:

1. The **two primary entrypoints** into ProjectPulse:
   - Human → Web UI
   - Agent → MCP server
2. The **core architecture contract**:
   - PostgreSQL is the **single source of truth**
   - Web UI and MCP tools are **two interfaces over the same backend**
3. Where **RAG** and the **knowledge graph** live in this repo, and how they’re used.

---

## The big picture (components + boundaries)

### Runtime components

- **Web App (Next.js)**: `apps/web/`
  - UI pages and server components
  - API routes (backend endpoints)
  - Prisma + PostgreSQL

- **MCP Server (agent interface)**: `apps/mcp-server/`
  - Exposes “tools” to LLM agents using MCP Streamable HTTP
  - Forwards requests to the Web App APIs

---

## Visual architecture diagram (stick this in your head)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ProjectPulse Architecture                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   HUMAN PATH                           AGENT PATH                           │
│   ──────────                           ──────────                           │
│                                                                             │
│   ┌────────┐                           ┌─────────────┐                      │
│   │ Browser│                           │ LLM Agent   │                      │
│   └───┬────┘                           │(Claude/GPT) │                      │
│       │ HTTP                           └──────┬──────┘                      │
│       ▼                                       │ MCP (Streamable HTTP)       │
│   ┌────────────────┐                   ┌──────▼──────┐                      │
│   │   Next.js UI   │                   │ MCP Server  │                      │
│   │ apps/web/app/* │                   │ /mcp        │                      │
│   └───────┬────────┘                   └──────┬──────┘                      │
│           │                                   │ HTTP                         │
│           ▼                                   ▼                             │
│   ┌───────────────────────────────────────────────────┐                     │
│   │              Next.js API Routes                   │◄── Defense-in-depth │
│   │           apps/web/app/api/**                     │    auth validated   │
│   └───────────────────────┬───────────────────────────┘    at both layers   │
│                           │                                                 │
│           ┌───────────────┴───────────────┐                                 │
│           ▼                               ▼                                 │
│   ┌───────────────┐               ┌───────────────┐                         │
│   │ RAG Retrieval  │               │ Graph Layer   │                         │
│   │ lib/knowledge/ │               │ lib/knowledge/│                         │
│   │   search.ts    │               │   graph.ts    │                         │
│   └───────┬───────┘               └───────┬───────┘                         │
│           │                               │                                 │
│           └───────────────┬───────────────┘                                 │
│                           ▼                                                 │
│   ┌───────────────────────────────────────────────────┐                     │
│   │                   PostgreSQL                      │◄── Single Source    │
│   │   • knowledge_items (pgvector + tsvector)         │    of Truth         │
│   │   • knowledge_relationships (graph edges)         │                     │
│   └───────────────────────────────────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Code boundaries (what is responsible for what)

- **UI layer** (human-facing):
  - `apps/web/app/**`
  - `apps/web/components/**`

- **API layer** (product backend contract):
  - `apps/web/app/api/**`

- **Agent tool layer** (agent-facing contract):
  - `apps/mcp-server/src/tools/**`

- **Persistence layer** (source of truth):
  - `apps/web/prisma/schema.prisma`

---

## Data flow: Human (UI) path

### “Human searches Knowledge Base”

1. Human uses `/knowledge` page (UI)
2. UI calls Next.js API:
   - `GET /api/knowledge` (list)
   - `GET /api/knowledge/search` (search)
3. API route authenticates the request (cookie session)
4. API reads from PostgreSQL via Prisma / SQL
5. API returns JSON → UI renders cards

Concrete files:

- `apps/web/app/api/knowledge/route.ts`
- `apps/web/app/api/knowledge/search/route.ts`
- `apps/web/lib/auth/validateRequest.ts`
- `apps/web/lib/knowledge/search.ts`

---

## Data flow: Agent (MCP) path

### “Agent queries knowledge with an MCP tool”

1. Agent calls MCP tool (example): `projectpulse_knowledge_search`
2. MCP server receives the request at:
   - `POST /mcp` (MCP Streamable HTTP)
3. MCP server validates agent token by calling the Web App:
   - `POST /api/agent-auth/validate`
4. MCP server stores auth context per request (AsyncLocalStorage)
5. MCP tool handler calls Web App API:
   - `GET /api/knowledge/search?...`
6. Web App API re-validates token (defense-in-depth) and enforces project scoping
7. API performs retrieval (semantic/fulltext/hybrid) → returns results
8. MCP server returns tool result back to agent

Concrete files:

- MCP entrypoint (HTTP streaming):
  - `apps/mcp-server/src/index-http.ts`
- Tool registry (where tool list is defined and registered):
  - `apps/mcp-server/src/tools/index.ts`
- Tool example:
  - `apps/mcp-server/src/tools/knowledge/searchTool.ts`
- MCP → API HTTP client (forwards Bearer token):
  - `apps/mcp-server/src/httpClient.ts`
  - `apps/mcp-server/src/authContext.ts`
- API auth & scoping (re-validates token):
  - `apps/web/lib/auth/validateRequest.ts`

Interview wording (simple but correct):

- “Agents don’t hit the database directly. They call MCP tools. MCP tools call the same validated Web APIs the UI uses. Postgres remains the single source of truth.”

---

## Why these design decisions? (interview-ready rationale)

This section is about explaining **tradeoffs** in a way that matches the code.

### Why do MCP tools call Web APIs (instead of DB directly)?

- **Single backend contract**: human UI and agents reuse the same API surface.
  - Evidence: MCP tools proxy to Next.js routes via `apps/mcp-server/src/httpClient.ts`
  - Evidence: knowledge search API route at `apps/web/app/api/knowledge/search/route.ts`
- **Defense-in-depth**: token is forwarded by MCP → validated again by the API.
  - Evidence: MCP forwards `Authorization: Bearer ...` in `apps/mcp-server/src/httpClient.ts`
  - Evidence: API validates token + enforces project access in `apps/web/lib/auth/validateRequest.ts`
- **Consistency**: business rules live once (in API/services), not duplicated per client.

### Why hybrid search is 0.7 semantic + 0.3 full-text?

- **Current implementation** uses weighted scoring in `apps/web/lib/knowledge/search.ts`:
  - `SEMANTIC_WEIGHT = 0.7`
  - `FULLTEXT_WEIGHT = 0.3`
- **Practical reasoning** (how to explain it):
  - semantic matches intent / meaning
  - full-text catches exact keywords
- **Tuning story** (how to sound senior): the weights are a default and can be tuned using query metrics.
  - Evidence: query metrics model exists (`KnowledgeQueryMetric`) in `apps/web/prisma/schema.prisma`

### Why cap knowledge graph traversal to 1–2 hops?

- The traversal service enforces `maxDepth` of 1 or 2 in `apps/web/lib/knowledge/graph.ts`.
- **Token control**: deeper hops can explode the amount of context returned.
- **Latency control**: more expansion means more candidate nodes and more sorting/merging.
- **Signal-to-noise**: far-away connections are more likely to be irrelevant.

---

## Where RAG exists in ProjectPulse (in your product)

Important: In your system, “RAG” is not a single file. It’s the combination of:

1. **Ingestion / storage**: saving knowledge items into DB with embeddings + fulltext index.
2. **Retrieval**: searching and returning the most relevant items.
3. **Generation**: performed by the agent/LLM using the retrieved context.

### 1) Ingestion / storage

- Create knowledge item endpoint:
  - `POST /api/knowledge`
  - File: `apps/web/app/api/knowledge/route.ts`

- Embeddings generated here:
  - `apps/web/lib/embeddings/index.ts`

- Knowledge item creation service (writes embedding + tsvector):
  - `apps/web/lib/knowledge/create.ts`

### 2) Retrieval

- Search endpoint:
  - `GET /api/knowledge/search`
  - File: `apps/web/app/api/knowledge/search/route.ts`

- Retrieval logic (semantic, full-text, hybrid):
  - `apps/web/lib/knowledge/search.ts`

### 3) Generation

- Generation is not in the server code.
- The **agent** calls `projectpulse_knowledge_search`, receives results, and uses them as context for LLM reasoning.

Interview wording:

- “ProjectPulse implements the retrieval part of RAG as a product feature (fast, scoped, structured). The LLM does generation. This split keeps retrieval deterministic and secure.”

---

## Where the Knowledge Graph exists (and how it connects to RAG)

In ProjectPulse:

- Nodes = `KnowledgeItem`
- Edges = `KnowledgeRelationship`

Schema locations:

- `apps/web/prisma/schema.prisma`
  - `model KnowledgeItem` → table `knowledge_items`
  - `model KnowledgeRelationship` → table `knowledge_relationships`

Graph traversal implementation:

- `apps/web/lib/knowledge/graph.ts`
  - Implements 1-hop and 2-hop traversal
  - Uses weighted edges (`weight`) and relationship types (`relationType`)

Graph traversal API:

- `GET /api/knowledge/related`
  - `apps/web/app/api/knowledge/related/route.ts`

MCP tool that exposes it:

- `projectpulse_knowledge_related`
  - `apps/mcp-server/src/tools/knowledge/relatedTool.ts`

How it integrates with RAG (the story you tell):

- RAG gives you “top matches by relevance”.
- Knowledge graph gives you “connected context”: prerequisites, dependencies, contradictions, extensions.
- You cap traversal to **maxDepth = 2** for latency + token control.

---

## Failure modes (what can break, and what it looks like)

| Layer | Failure | User/Agent impact | How to detect (evidence) |
|------:|---------|-------------------|--------------------------|
| MCP tool input | Invalid tool arguments (Zod rejects) | Tool call fails before API request | Tool schema validation in `apps/mcp-server/src/tools/knowledge/searchTool.ts` (`min(1)`, `max(1000)`, etc.) |
| MCP tool permissions | Tool blocked by token allowlist/blocklist | Tool request denied | Tool permission check in `apps/mcp-server/src/tools/index.ts` (`isToolAllowed`) |
| Global blocklist | Tool disabled by admin | Tool request denied | Global blocklist check in `apps/mcp-server/src/tools/index.ts` (`checkBlockedTool`) |
| MCP → API request | API returns non-2xx | Tool returns `isError: true` with message | HTTP client throws on non-OK in `apps/mcp-server/src/httpClient.ts` (`handleResponse`) |
| API auth | Missing/invalid Bearer token | 401/403 response | API auth logic in `apps/web/lib/auth/validateRequest.ts` (`requireAuth`, `requireProjectAccess`) |
| Embeddings | Embedding generation fails (provider unavailable) | semantic/hybrid search fails | `SearchError` code `EMBEDDING_FAILED` in `apps/web/lib/knowledge/search.ts` |
| Database | Prisma/SQL error | endpoint returns error | `SearchError` code `DATABASE_ERROR` in `apps/web/lib/knowledge/search.ts` |
| Knowledge graph | No relationships from item | empty `relatedItems` (not an error) | traversal returns empty array; see `apps/web/lib/knowledge/graph.ts` |

---

## System design terminology (what these parts are called)

- **Interface / Contract**:
  - Web APIs and MCP tools are contracts for different clients.
- **Single Source of Truth**:
  - PostgreSQL stores docs/issues/knowledge/relationships.
- **Defense-in-depth security**:
  - Token validated at MCP layer and again at API layer.
- **Multi-tenancy**:
  - Every knowledge operation is scoped by `projectId`.
- **Retrieval pipeline**:
  - semantic search + full-text search + hybrid ranking.
- **Graph traversal**:
  - bounded BFS-like expansion to 1–2 hops.

---

## Exercises (write answers in your own words)

### Exercise A: 1-minute explanation

Write 6–10 sentences answering:

- “How does an agent query the knowledge base in ProjectPulse?”

Constraints:

- Mention MCP tool name and API path.
- Mention the DB tables used.
- Mention how project isolation is enforced.

#### Exercise A: scoring rubric

Your answer must include these 8 items (1 point each):

1. [ ] MCP tool name: `projectpulse_knowledge_search`
2. [ ] MCP endpoint: `POST /mcp`
3. [ ] Web API called: `GET /api/knowledge/search`
4. [ ] DB table: `knowledge_items`
5. [ ] Auth mechanism: forwarded Bearer token in `Authorization` header
6. [ ] Multi-tenancy: requests scoped by `projectId`
7. [ ] Defense-in-depth: validated at MCP layer + API layer
8. [ ] Retrieval modes: `semantic`, `fulltext`, `hybrid` (and hybrid uses weights)

### Exercise B: Draw the flow (text diagram)

Create a simple diagram in text (you can copy/paste this and fill it):

Agent
  → MCP Server (`/mcp`)
    → Tool handler (`projectpulse_knowledge_search`)
      → Web API (`GET /api/knowledge/search`)
        → Retrieval service (`hybridSearch`)
          → Postgres (`knowledge_items` + `knowledge_relationships`)
        ← JSON results
      ← MCP tool result
  ← Agent uses results to generate answer

### Exercise C: Code tracing (15 minutes)

Open `apps/mcp-server/src/tools/knowledge/searchTool.ts` and answer:

1. What happens if `query` is an empty string?
2. What is the maximum allowed query length?
3. How is `projectId` passed to the Web API call?
4. What gets logged on success vs failure?

Then open `apps/web/lib/knowledge/search.ts` and answer:

5. What is the exact formula used to convert pgvector cosine distance to similarity?
6. Why do semantic search and hybrid search use `limit * 2` before slicing to `limit`?
7. What are the constants for hybrid weighting?
8. Why are the full-text thresholds lower than semantic thresholds?

---

## Completion checklist

- [ ] I can point to the exact files for MCP tool registration.
- [ ] I can explain “RAG = retrieval in server + generation in agent”.
- [ ] I can explain how project scoping is enforced for agents.

Next: Day 02 — Web App architecture (Next.js Server/Client, API route patterns)
