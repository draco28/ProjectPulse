# Sprint 5: Knowledge Graph Foundation - Implementation Plan

**Sprint**: Sprint 5 (Weeks 9-10)
**Goal**: Implement hybrid knowledge search (semantic + full-text + graph traversal)
**Story Points**: 28 points (US-067 to US-074)
**Duration**: 8 days
**Created**: 2025-11-12 14:20
**Status**: APPROVED

---

## Overview

Implement a **Hybrid Knowledge Graph Search** system achieving **88% token reduction** (1,500 tokens vs 10,000+ baseline) while maintaining 90%+ relevance.

**Components**:
1. **Semantic Search**: pgvector with 384-dimensional embeddings (Ollama all-minilm)
2. **Full-Text Search**: PostgreSQL tsvector with GIN indexes
3. **Graph Traversal**: 2-hop max via application-side recursion
4. **Hybrid Ranking**: 0.7 × semantic + 0.3 × fulltext (configurable)

---

## Implementation Phases

### Phase 1: Database Foundation (Days 1-2, 8 points)

**User Stories**: US-067 (2 pts), US-069 (5 pts), Setup (1 pt)

**Tasks**:
1. Enable pgvector and pg_trgm extensions via migration
2. Create KnowledgeItem model with embedding (vector(384)) and contentTsvector fields
3. Create KnowledgeRelation model for graph relationships
4. Add indexes: HNSW for embeddings, GIN for tags/tsvector, B-tree for FKs
5. Seed 10-15 initial knowledge items

**Expert Consultations**:
- `prisma-expert`: Schema design, index strategy, migration approach

**Deliverables**:
- Migration applied to Mac mini database
- Prisma Client regenerated with vector types
- Seed data: 10-15 knowledge items with realistic content

---

### Phase 2: Embedding Generation (Days 3-4, 8 points)

**User Stories**: US-069 (5 pts), US-070 (3 pts)

**Tasks**:
1. Integrate Ollama embeddings API (default, free)
2. Add OpenAI embeddings fallback (optional, paid)
3. Create unified embedding service with provider selection
4. Implement full-text tsvector generation (trigger or computed column)
5. Create POST /api/knowledge endpoint with auto-embedding

**Expert Consultations**:
- `next-js-expert`: API route design for embedding generation endpoint

**Deliverables**:
- Ollama integration working (default)
- OpenAI integration (optional fallback)
- POST /api/knowledge endpoint generates embeddings on create
- Full-text tsvector auto-generated

---

### Phase 3: Hybrid Search Implementation (Days 5-6, 8 points)

**User Stories**: US-068 (8 pts - core search), US-071 (included)

**Tasks**:
1. Implement semantic search query (pgvector cosine similarity)
2. Implement full-text search query (tsvector with ts_rank_cd)
3. Implement hybrid merge algorithm (weighted ranking)
4. Create GET /api/knowledge/search endpoint
5. Add query optimization (parallel queries via Promise.all)

**Expert Consultations**:
- `prisma-expert`: Raw SQL query optimization, index usage
- `next-js-expert`: API route performance patterns

**Deliverables**:
- Semantic search working (<200ms P95)
- Full-text search working (<100ms P95)
- Hybrid merge algorithm tested and validated
- GET /api/knowledge/search endpoint functional

---

### Phase 4: Graph Traversal (Day 7, 4 points)

**User Stories**: US-072 (5 pts)

**Tasks**:
1. Implement graph traversal function (application-side, 2-hop max)
2. Add relation type filtering
3. Integrate with hybrid search (optional includeRelated param)
4. Test performance (<400ms for 2-hop queries)

**Deliverables**:
- Graph traversal function working
- Integration with hybrid search
- Performance validated (<400ms P95)

---

### Phase 5: MCP Tools (Day 8, 5 points)

**User Stories**: US-073 (3 pts), US-074 (2 pts)

**Tasks**:
1. Create MCP tool: projectpulse.knowledge.search
2. Create MCP tool: projectpulse.knowledge.create
3. Register tools in MCP server
4. Test via MCP Inspector
5. Update documentation (mcp-tools-guide.md, api-catalog.md)

**Deliverables**:
- 2 MCP tools registered (20 total ProjectPulse tools)
- Tools tested and functional
- Documentation updated

---

## Success Criteria

### Functional Requirements
- ✅ Can create knowledge items with auto-embeddings
- ✅ Semantic search returns relevant results
- ✅ Full-text search works correctly
- ✅ Hybrid search merges results with 0.7/0.3 weights
- ✅ Graph traversal retrieves 1-3 related items (2-hop max)
- ✅ MCP tools functional and documented

### Performance Targets
- ✅ Semantic search: <200ms P95
- ✅ Full-text search: <100ms P95
- ✅ Hybrid search: <300ms P95
- ✅ Graph traversal: <400ms P95
- ✅ Token usage: <1,500 per query (88% reduction)

### Quality Gates
- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 critical errors
- ✅ Tests: All passing (unit + integration)
- ✅ Build: Production build succeeds
- ✅ Precision@5: 90%+ on test queries

---

## Technical Decisions

1. **Embedding Provider**: Ollama (default), OpenAI optional
   - Rationale: $0 cost, acceptable quality, fast local generation

2. **Embedding Dimensions**: 384 (all-minilm model)
   - Rationale: 4× smaller than OpenAI, faster queries, sufficient for technical docs

3. **Hybrid Weights**: 0.7 semantic / 0.3 fulltext (configurable)
   - Rationale: Research best practice, semantic more important for paraphrased queries

4. **Graph Traversal**: Application-side recursion (max 2 hops)
   - Rationale: Simpler than recursive CTEs, precise hop control

5. **Top-K Results**: 5 by default (configurable 3-10)
   - Rationale: 5 × 200 tokens + 3 related = ~1,600 tokens (within target)

---

## Key Risks & Mitigations

**Risk 1**: pgvector performance with 10K+ items
- **Mitigation**: Use HNSW index, limit MVP to 1K items, benchmark early

**Risk 2**: Hybrid search exceeds 200ms target
- **Mitigation**: Parallel queries, reduce top-K if needed, cache frequent queries

**Risk 3**: Ollama not installed on Mac mini
- **Mitigation**: Install via curl, pull all-minilm model, fallback to OpenAI

**Risk 4**: OpenAI API costs if used
- **Mitigation**: Use Ollama by default, OpenAI as optional upgrade, $5 max budget

---

## Dependencies

**Before Starting**:
- ✅ Mac mini services running (PostgreSQL, Next.js)
- ⚠️ Ollama installed on Mac mini
- ⚠️ all-minilm model pulled

**From Previous Sprints**:
- Sprint 1: MCP server scaffold ✅
- Sprint 2: API patterns established ✅
- Sprint 3: Workflow patterns ✅
- Sprint 4: Performance testing patterns ✅

---

## Testing Strategy

**Unit Tests**:
- Embedding generation (Ollama + OpenAI)
- Semantic search query
- Full-text search query
- Hybrid merge algorithm
- Graph traversal (1-hop, 2-hop)

**Integration Tests**:
- End-to-end search flow
- MCP tools calling API endpoints
- Performance benchmarks

**Performance Tests**:
- Query latency under load (10 concurrent queries)
- Token usage measurement (verify <1,500 tokens)
- Precision@5 accuracy on test dataset

---

**Next Steps**: Consult experts (Step 3), then begin Phase 1 implementation
