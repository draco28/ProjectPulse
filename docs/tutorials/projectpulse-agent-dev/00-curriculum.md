# Day 00 — Curriculum (ProjectPulse Deep Dive)

This tutorial is designed so you can explain ProjectPulse confidently in interviews as a **full-stack agent developer**.

## How we will learn

Each day follows the same structure:

- Goals (what you must understand)
- System design terms (what to say in interviews)
- Code artifacts (exact file paths)
- Exercises (you write your own explanation)

## Ground rules (for confidence)

- When you say a term (e.g., “RAG”, “knowledge graph”, “MCP tool”), you must be able to answer:
  - Where is it implemented?
  - What data does it store?
  - What is the request/response?
  - What are the failure modes?

## Curriculum overview (suggested 14 days)

### Week 1 — Foundations (Architecture + Boundaries)

- Day 01: System map & repo map (what lives where, who calls whom)
- Day 02: Web app architecture (Next.js App Router, Server vs Client components, API routes)
- Day 03: MCP server architecture (HTTP streaming transport, tool registry, request lifecycle)
- Day 04: Security & multi-tenancy (agent tokens, defense-in-depth auth, tool permissions)

### Week 2 — MCP tools mastery (design + integration)

- Day 05: MCP tool anatomy (schema validation, handler structure, error handling, logging)
- Day 06: Tool categories and how they map to product modules (wiki, tickets, workflows, memory, knowledge)
- Day 07: Observability for tools (logging, metrics, audit trail, “what happened” reconstruction)

### Week 3 — RAG + Knowledge Graph (the scary part)

- Day 08: Knowledge data model (items, embeddings, tsvector, relationships, scoping)
- Day 09: Embedding pipeline (Ollama/OpenAI, dimension consistency, failure handling)
- Day 10: Retrieval pipeline (semantic search, full-text search, hybrid ranking)
- Day 11: Knowledge graph traversal (1–2 hop traversal, weights, relationship types)
- Day 12: “RAG integration” story (how retrieval output is consumed by agents; what is grounded vs generated)

### Week 4 — Production readiness (what interviewers love)

- Day 13: Testing strategy (unit/integration/E2E for agent workflows)
- Day 14: Deployment + runtime (Docker, dev vs prod ports, health checks)

## Your deliverables after each day

- A 5–10 sentence written explanation in your own words (saved under that day’s doc).
- A 1-minute “interview answer” version.

## Quick glossary (we will expand later)

- **MCP tool**: A function exposed to an agent over MCP; inputs validated; outputs structured.
- **RAG**: Retrieval-Augmented Generation. In ProjectPulse, retrieval is implemented server-side; generation happens in the agent/LLM.
- **Knowledge graph**: Nodes = knowledge items; edges = relationships; traversal finds connected context beyond keyword similarity.
- **Hybrid search**: Combine semantic vector similarity + full-text relevance ranking.

Next: `day-01-system-map.md`
