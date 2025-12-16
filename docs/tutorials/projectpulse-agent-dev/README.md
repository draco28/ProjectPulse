# ProjectPulse Agent Developer Tutorial (Deep Dive)

This folder is a step-by-step tutorial for learning and explaining ProjectPulse as a **full-stack agent developer**.

## How to use this tutorial

- Read **Day 00** first to understand the curriculum.
- Each day contains:
  - Goals (what you should understand by the end)
  - System design terminology (what to say in interviews)
  - Concrete repo artifacts (exact file paths)
  - Exercises (write your own explanation + small verification steps)

## Curriculum

- Start here: `00-curriculum.md`
- Day-by-day lessons: `day-XX-*.md`

## Ground rules (important)

- **Be evidence-based**: whenever you claim something, attach it to a file path.
- **Prefer data-flow explanations**: “who calls whom, what goes over the wire, what gets stored”.
- **Separate product vs internal tooling**:
  - Product: `apps/web/` + `apps/mcp-server/`
  - Internal dogfooding workflow: `.agent/`

## What you should be able to explain after this

- End-to-end architecture: UI ↔ API ↔ DB and Agent ↔ MCP ↔ API ↔ DB
- MCP tool design: naming, schema validation, auth, permissions, observability
- RAG/Knowledge Graph implementation: ingestion, embeddings, hybrid retrieval, graph traversal
- Tradeoffs: token efficiency, latency, multi-tenancy safety, scaling
