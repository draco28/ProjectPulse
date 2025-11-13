# Sprint 5 Starter Prompt - Knowledge Graph Foundation

**Copy and paste this prompt at the start of your new chat session:**

---

## 🚀 MANDATORY PROTOCOL - Sprint 5: Knowledge Graph Foundation

Read `.agent/MANDATORY_SESSION_PROTOCOL.md` and follow ALL steps.

### Current Phase: Sprint 5 - Knowledge Graph Foundation (Week 9-10)

**Epic**: EPIC-005 - Knowledge & Skills Management (Partial - Knowledge Graph only)
**Goal**: Implement hybrid search (semantic + full-text + graph traversal) for knowledge base
**Story Points**: 28 points (out of 68-point sprint - knowledge portion only)
**Priority**: Must Have (P0) - Core feature for agent autonomy

### Requirements from Documentation

**Read these files FIRST (in order)**:
1. `.agent/progress.md` - Current progress (Sprint 4 complete, 222/484 points = 46%)
2. `.agent/active-context.md` - Current work context
3. `docs/13-Project-Plan.md` - Sprint 5 details (Section 3.5, lines ~1100-1200)
4. `docs/12-Backlog.md` - User stories US-067 to US-089
5. `docs/03-Architecture.md` - Knowledge graph architecture (Section 6.3)
6. `docs/04-Data-and-Model-Spec.md` - KnowledgeItem, KnowledgeRelation models

### Sprint 5 Focus Areas

**Phase 1: Hybrid Search Foundation (Days 1-3, 13 points)**
- US-067: Semantic search with pgvector embeddings (5 points)
- US-068: Full-text search with tsvector (3 points)
- US-069: Hybrid search merging (semantic + full-text) (5 points)

**Phase 2: Graph Traversal (Days 4-6, 10 points)**
- US-070: Knowledge graph model (KnowledgeRelation) (3 points)
- US-071: 2-hop graph traversal queries (5 points)
- US-072: Related items retrieval via graph (2 points)

**Phase 3: MCP Tools (Days 7-8, 5 points)**
- US-073: `knowledge.search` MCP tool (3 points)
- US-074: `knowledge.create` MCP tool (2 points)

### Technical Stack for Sprint 5

**Database Extensions**:
- `pgvector` - Semantic embeddings (already installed)
- `pg_trgm` - Full-text search optimizations
- `ltree` or recursive CTEs - Graph traversal

**Key Models** (Prisma):
```typescript
model KnowledgeItem {
  id          Int      @id @default(autoincrement())
  title       String   @db.VarChar(200)
  content     String   @db.Text
  category    String   @db.VarChar(50)
  embedding   Unsupported("vector(1536)")?  // OpenAI ada-002
  tsvector    Unsupported("tsvector")?       // Full-text index

  // Relations
  outgoingLinks  KnowledgeRelation[] @relation("FromItem")
  incomingLinks  KnowledgeRelation[] @relation("ToItem")
}

model KnowledgeRelation {
  id              Int      @id @default(autoincrement())
  fromItemId      Int
  toItemId        Int
  relationType    String   @db.VarChar(50)  // "references", "implements", "relates_to"

  fromItem  KnowledgeItem @relation("FromItem", fields: [fromItemId])
  toItem    KnowledgeItem @relation("ToItem", fields: [toItemId])
}
```

**Performance Targets**:
- Semantic search: P95 <200ms (top 10 results)
- Full-text search: P95 <100ms
- Hybrid search: P95 <300ms
- Graph traversal (2-hop): P95 <400ms

### ENFORCE Mandatory Protocol Steps

**✅ STEP 1: INITIALIZATION (5-10 minutes)**
- Create `.agent/task/current-session-[YYYYMMDD-HHMM].md`
- Document: Sprint 5 goals, current progress (46% MVP), technical context
- **Confirm:** "✅ STEP 1 COMPLETE: Session initialized at [timestamp]"

**✅ STEP 2: PLAN CREATION (15-20 minutes)**
- Read architecture docs (hybrid search design from `docs/03-Architecture.md`)
- Create implementation plan:
  1. Database migrations (pgvector vector column, tsvector column, indexes)
  2. Embedding generation (OpenAI API integration)
  3. Search API endpoints (GET /api/knowledge/search with hybrid mode)
  4. Graph traversal helpers (recursive CTE or ltree queries)
  5. MCP tools (knowledge.search, knowledge.create)
- Get user approval via ExitPlanMode
- **IMMEDIATELY save** to `.agent/task/current-plan.md`
- Create `.agent/task/current-todos.md`
- **Confirm:** "✅ STEP 2 COMPLETE: Plan saved, todos created"

**✅ STEP 3: EXPERT CONSULTATION (10-15 minutes)**
- **Invoke `prisma-expert`**: Schema design for vector + tsvector columns, indexes
- **Invoke `next-js-expert`**: API route design for search endpoint
- **Invoke `react-expert`**: (Optional - if building search UI components)
- **Confirm:** "✅ STEP 3 COMPLETE: Consulted prisma-expert and next-js-expert"

**✅ STEP 4: PROGRESS CHECKPOINTS**
- At 15K, 30K, 45K tokens: Update `.agent/task/current-session-[timestamp].md`
- Update `.agent/task/current-todos.md` with progress percentages
- **Confirm:** "✅ CHECKPOINT at [X]K tokens: Progress saved"

**✅ STEP 5: POST-COMPLETION (30-45 minutes)**
- Update `.agent/progress.md` (mark Sprint 5 knowledge portion complete)
- Update `.agent/active-context.md` (note: Sprint 5 Day 8 complete)
- Update `docs/13-Project-Plan.md` (Sprint 5 progress)
- Invoke `synthesize-docs` (create SOP for hybrid search implementation)
- Invoke `map-system` (update system docs with new knowledge APIs)
- Commit documentation, then code
- **Confirm:** "✅ STEP 5 COMPLETE: All documentation updated and committed"

### Success Criteria (Sprint 5 Knowledge Portion)

**Functional**:
- ✅ Can create knowledge items with auto-generated embeddings
- ✅ Semantic search returns top 10 relevant items (<200ms)
- ✅ Full-text search works with PostgreSQL tsvector
- ✅ Hybrid search merges semantic + full-text results
- ✅ Graph traversal retrieves related items (2-hop max)
- ✅ MCP tools `knowledge.search` and `knowledge.create` working

**Performance**:
- ✅ Semantic search: P95 <200ms
- ✅ Full-text search: P95 <100ms
- ✅ Hybrid search: P95 <300ms
- ✅ Token usage: <1,500 tokens per query (88% reduction target)

**Quality**:
- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 critical errors
- ✅ Tests: All passing (unit + integration)
- ✅ Build: Production build succeeds

### Context from Sprint 4 (Just Completed)

**What we built**:
- 6 issue API endpoints (POST, GET, PATCH, DELETE, bulk)
- 6 MCP tools (18 total tools now)
- Auto-tagging system with config-driven rules
- Context injection with file:line references
- Performance: 89ms for 15 issues (22× faster than target)

**Lessons learned**:
- Prisma `createMany` is fast for bulk operations
- Zod validation at API layer prevents bad data
- MCP tools should mirror API structure 1:1
- Auto-tagging rules stored in Setting table (flexible config)
- Performance testing early catches issues

### Important Notes

1. **OpenAI API Key Required**: Embedding generation needs OpenAI API
   - Model: `text-embedding-ada-002` (1536 dimensions)
   - Cost: ~$0.0001 per 1K tokens (very cheap)
   - Fallback: Local Ollama embeddings if OpenAI too expensive

2. **pgvector Already Installed**: Check `docker-compose.cloud.yml`
   - PostgreSQL image includes pgvector extension
   - Just need to enable in migration: `CREATE EXTENSION IF NOT EXISTS vector;`

3. **Graph Traversal Options**:
   - **Option A**: Recursive CTEs (standard SQL, works everywhere)
   - **Option B**: ltree extension (PostgreSQL-specific, faster for deep hierarchies)
   - **Recommendation**: Start with recursive CTEs (simpler, no new extension)

4. **Token Efficiency Target**: 88% reduction
   - Baseline: 10,000 tokens to load full knowledge graph
   - Target: 1,200 tokens for targeted hybrid search
   - Strategy: Return only relevant items + 1-sentence summaries

### Git Branch Strategy

**Create new branch**:
```bash
git checkout -b feature/sprint-5-knowledge-graph
```

**Commit pattern**:
- Small, atomic commits per user story
- Format: `feat(sprint-5): [US-XXX] Description`
- Push regularly to backup work

### If You Get Stuck

**Issue**: pgvector queries are slow
**Solution**: Add HNSW index (better than IVFFlat for <100K items)
```sql
CREATE INDEX ON knowledge_items USING hnsw (embedding vector_cosine_ops);
```

**Issue**: Full-text search not ranking well
**Solution**: Use ts_rank_cd with custom weights
```sql
SELECT *, ts_rank_cd(tsvector, query, 32) AS rank
FROM knowledge_items
WHERE tsvector @@ query
ORDER BY rank DESC;
```

**Issue**: Hybrid search results overlap
**Solution**: Use DISTINCT ON or UNION with deduplication

### Ready to Start?

**Confirm you've read**:
- [x] `.agent/MANDATORY_SESSION_PROTOCOL.md`
- [x] `.agent/progress.md` (Sprint 4 complete ✅)
- [x] `docs/13-Project-Plan.md` (Sprint 5 section)
- [x] `docs/03-Architecture.md` (Hybrid search design)

**Then say**: "I confirm I've read all required documents. Proceeding with Sprint 5: Knowledge Graph Foundation. Creating session file and implementation plan."

---

## 📊 Current Project Status

**MVP Progress**: 222/422 points (53% complete)
**Overall Progress**: 222/484 points (46% complete)
**Completed Sprints**: 4/9 (all at 100%)
**Current Sprint**: Sprint 5 (Week 9-10)
**Next Sprint**: Sprint 6 - Skills Management (Week 11-12)

**Velocity**: Averaging 42-50 points per sprint
**On Track**: Yes - 4 sprints complete, 5 remaining for MVP

---

**Good luck with Sprint 5! 🚀**
