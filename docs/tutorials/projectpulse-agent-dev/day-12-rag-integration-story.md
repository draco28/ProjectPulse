# Day 12 — “RAG integration” story (what retrieval is used for; grounded vs generated)

## Goals (what you should understand today)

By the end of Day 12, you should be able to explain:

1. What “RAG” means in ProjectPulse:
   - retrieval happens server-side
   - generation happens in the agent/LLM
2. What is **grounded** vs **generated** in an agent response.
3. The concrete agent workflow:
   - search → (optional) related traversal → synthesize answer
4. How the system intentionally limits token usage (excerpts, bounded traversal, metrics).
5. The failure modes and safe fallbacks (full-text mode, smaller limits, no traversal).

---

## The honest definition of RAG in ProjectPulse

ProjectPulse provides the Retrieval part:

- search knowledge items (semantic / full-text / hybrid)
- optionally traverse the graph for related items

The LLM provides Generation:

- it writes the explanation/code/plan using retrieved snippets as grounding

Interview wording:

- “ProjectPulse implements retrieval as a secure backend feature. The agent does generation. That split keeps retrieval deterministic, scoped, and observable.”

---

## What is grounded vs generated?

### Grounded

Grounded content should be directly attributable to retrieved items.

In practice:

- statements that come from retrieved `title`/`excerpt`/`content`
- claims that reference specific IDs and are consistent with the retrieved text

### Generated

Generated content is synthesis:

- summarizing across multiple retrieved items
- proposing a plan or code changes
- connecting dots that are implied but not explicitly written

Key rule of thumb:

- If it’s not in retrieval output, treat it as a hypothesis, not a fact.

---

## The concrete agent workflow (what actually happens in this repo)

### Step 1: Agent calls an MCP tool

Example tool:

- `projectpulse_knowledge_search`
- Implementation: `apps/mcp-server/src/tools/knowledge/searchTool.ts`

What this tool does:

- validates inputs (Zod)
- calls the web API:
  - `GET /api/knowledge/search?...`
- returns JSON to the agent (stringified)

### Step 2: MCP forwards the request to the web app API

MCP → API forwarding:

- `apps/mcp-server/src/httpClient.ts`

It forwards:

- `Authorization: Bearer <token>`

So the API can enforce defense-in-depth auth.

### Step 3: Web API returns “retrieval payload”

API route:

- `apps/web/app/api/knowledge/search/route.ts`

Notable design choice:

- it returns an **excerpt** (first 200 chars), not full content

Why:

- keeps responses small and token-efficient

### Step 4 (optional): Agent fetches related items

API route:

- `GET /api/knowledge/related`
- `apps/web/app/api/knowledge/related/route.ts`

Service:

- `apps/web/lib/knowledge/graph.ts`

This is how you explain “knowledge graph augments RAG”:

- Search finds relevant nodes; traversal finds connected context.

### Step 5: Agent generates a response

At this point the agent uses:

- `title`
- `excerpt`
- `category`
- `tags`
- `score`

to produce an answer.

The answer should:

- cite IDs/titles (grounding)
- avoid claiming details that weren’t retrieved

---

## Token-efficiency guardrails (where they come from)

### Excerpts instead of full documents

- `apps/web/app/api/knowledge/search/route.ts`
  - `excerpt: result.content.slice(0, 200)`

### Bounded traversal

- `apps/web/lib/knowledge/graph.ts`
  - `maxDepth` is constrained to 1 or 2
  - 2-hop results are down-weighted (`strength * 0.8`)

### Metrics + token estimation

- `apps/web/lib/knowledge/metrics.ts`
  - estimates token usage as `total_chars / 4`
  - records `latencyMs` and `resultCount`

Interview phrasing:

- “We measure retrieval latency and approximate token payload size so we can tune the system. Token efficiency is an explicit constraint.”

---

## Practical “RAG integration” script you can say in interviews

- “When an agent needs context, it calls an MCP tool like `projectpulse_knowledge_search`. The MCP server validates the agent token and forwards the request to the Next.js API. The API enforces project scoping and runs retrieval (semantic/full-text/hybrid), returning a small, token-efficient payload (titles + excerpts + scores). The agent then synthesizes an answer. If needed, it can call `/api/knowledge/related` to pull 1–2 hop graph neighbors for connected context.”

---

## Failure modes and safe fallbacks

- **Embedding providers down**
  - semantic/hybrid can fail with 503 (`EMBEDDING_FAILED`)
  - fallback: use `mode=fulltext`

- **Too many results → big payload**
  - reduce `limit`

- **Graph expansion noise**
  - keep `maxDepth=1` and increase `minStrength`

- **No relevant results**
  - agent should say “I don’t have enough grounded context” and either broaden query or request more data.

---

## Exercises (do later)

### Exercise A: Write a 1-minute explanation of RAG in ProjectPulse

Constraints:

- You must mention:
  - retrieval server-side
  - generation in the agent
  - MCP tool → API route → service layer

### Exercise B: Grounded vs generated

Write two short paragraphs:

- one paragraph that is purely grounded (only restating retrieved excerpts)
- one paragraph that is generated (synthesis + plan)

---

## Completion checklist

- [ ] I can define grounded vs generated.
- [ ] I can trace the agent retrieval workflow (tool → API → service).
- [ ] I can explain token guardrails (excerpt + bounded traversal + metrics).
- [ ] I can propose safe fallbacks when embeddings fail.
