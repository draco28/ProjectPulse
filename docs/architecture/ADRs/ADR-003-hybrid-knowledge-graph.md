# ADR-003: Hybrid Knowledge Graph Search Strategy

**Status:** Accepted
**Date:** 2025-11-02
**Decision Makers:** ProjectPulse Development Team
**Consulted:** Planning session analysis, user feedback ("best feature")

---

## Context

Agents need efficient knowledge retrieval without high token costs.

**Challenge:**

- Full knowledge graph traversal = 10,000+ tokens per query (expensive, slow)
- Semantic search alone misses exact keyword matches
- Full-text search alone misses semantically similar content
- Agents have 200K token context limit (need to preserve for implementation)

**Requirements:**

- Retrieve relevant knowledge items efficiently (<200ms)
- Token cost <1,500 tokens per query
- Combine semantic similarity + keyword matching
- Find related knowledge via graph relationships (not full traversal)

**The Question:** What search strategy balances relevance, token efficiency, and performance?

## Decision

**Implement hybrid knowledge graph search: Semantic + Full-Text + Limited Traversal (max 2 hops)**

**Strategy:**

1. **Semantic Search (pgvector):**
   - Generate embedding for query (OpenAI text-embedding-3-small, 384 dimensions)
   - Vector similarity search: `embedding <=> query_embedding`
   - Return top-K results (K=5)

2. **Full-Text Search (tsvector):**
   - PostgreSQL full-text search: `searchVector @@ to_tsquery(query)`
   - Return top-K results (K=5)

3. **Hybrid Ranking:**
   - Merge results: `0.7 * semantic_score + 0.3 * fulltext_score`
   - Return top-K combined (K=5)

4. **Graph Traversal (limited):**
   - From top result, traverse relationships (REFERENCES, CONTRADICTS, EXTENDS)
   - Max depth: 2 hops
   - Return related items (typically 1-3 additional items)

5. **Total Return:**
   - Top 5 hybrid results + 1-3 related items = 6-8 total items
   - Token cost: ~1,200 tokens (vs 10,000+ for full graph)

## Consequences

### Positive

- **Token efficiency:** 88% reduction (1,200 tokens vs 10,000+)
- **Performance:** <200ms queries (pgvector + tsvector indexes)
- **Relevance:** Semantic captures "auth implementation" = "authentication setup"
- **Precision:** Full-text captures exact keyword matches
- **Context:** Graph traversal finds related/contradictory knowledge

### Negative

- **Index maintenance:** pgvector + tsvector indexes require periodic updates
- **Embedding cost:** OpenAI API ~$0.10/1M tokens (mitigated by local embedding option)
- **Tuning required:** Semantic/fulltext weights (0.7/0.3) may need adjustment

### Neutral

- **Max depth 2 hops:** Prevents token explosion while capturing most relationships
- **Top-K = 5:** Balances coverage vs token cost
- **Lazy loading:** Load only what's needed, expand on-demand

## Alternatives Considered

1. **Semantic Search Only:**
   - Rejected: Misses exact keyword matches ("pgvector" query wouldn't match "pgvector" keyword if embedding mismatch)

2. **Full-Text Search Only:**
   - Rejected: Misses semantic similarity ("authentication" vs "auth" vs "login")

3. **Full Graph Traversal:**
   - Rejected: 10,000+ tokens per query, slow, exceeds context limits

4. **No Graph Traversal:**
   - Rejected: Misses related/contradictory knowledge, context incomplete

## References

- Database schema: [docs/04-Data-and-Model-Spec.md](../../04-Data-and-Model-Spec.md) (KnowledgeItem, KnowledgeRelationship)
- Performance requirements: [docs/02-SRS.md](../../02-SRS.md) Section 2.1
- Architecture: [docs/03-Architecture.md](../../03-Architecture.md) Section 3.5
- User feedback: "perfect, exactly what I wanted, best feature" (planning session)

---

**Last Updated:** 2025-11-02
**Revision History:**

- 2025-11-02: Initial version (hybrid search approved)
