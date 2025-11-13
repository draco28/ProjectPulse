# Sprint 6 Implementation Plan
# Knowledge Graph Completion + Skills Lazy-Loading System

**Created**: 2025-11-13 13:34
**Sprint Duration**: 2 weeks (estimated 10 working days)
**Total Points**: 57 points (15 Knowledge + 42 Skills)
**Target Velocity**: 5-6 points/day

---

## Overview

Sprint 6 completes the knowledge graph foundation from Sprint 5 and implements a token-efficient skills lazy-loading system. This sprint delivers the final pieces of the knowledge/skills infrastructure that enables **end users' AI agents** to access framework documentation and project patterns with 92% token reduction.

**Key Deliverables**:
1. Knowledge graph performance monitoring, export/import, deduplication, archival (PRODUCT FEATURES)
2. Skills database table with YAML frontmatter + markdown content (PRODUCT FEATURES)
3. Lazy-loading system: list (frontmatter only) → load (full content) → auto-unload (5 min)
4. Skills categorization (framework, testing, workflow, troubleshooting)
5. MCP tools: `skill.list()`, `skill.load()`, `skill.search()`, `skill.create()` for end users' agents

**CRITICAL**: All features are for END USERS and their AI agents, NOT for our dogfooding (.agent/ folder).

---

## Phase 1: Knowledge Graph Completion (Days 1-2)
**User Stories**: US-086 to US-090 (5 stories, 15 points)
**Goal**: Complete remaining knowledge graph features for end users

### Day 1: Performance Monitoring + Export (US-086, US-087) - 5 points

**Tasks**:
1. **US-086: Measure Query Performance** (3 points)
   - Add performance timing to knowledge API routes
   - Track: latency, token usage, result count, query type (semantic/fulltext/hybrid)
   - Store metrics in `KnowledgeQueryMetric` model (new Prisma model)
   - Create dashboard endpoint: GET /api/knowledge/metrics
   - Implement MCP tool: `knowledge.getMetrics()` for end users' agents

2. **US-087: Export Knowledge Graph** (2 points)
   - Implement GET /api/knowledge/export (JSON format)
   - Include: items, relationships, embeddings (optional)
   - Support filters: category, tags, date range
   - Implement MCP tool: `knowledge.export()` for end users' agents

**Acceptance Criteria**:
- Query latency tracked with <5ms overhead
- Export includes full graph structure
- End users' agents can call both MCP tools

**Dependencies**: Sprint 5 knowledge APIs ✅

---

### Day 2: Import + Deduplication + Archival (US-088, US-089, US-090) - 10 points

**Tasks**:
1. **US-088: Import Knowledge from Markdown** (5 points)
   - Implement POST /api/knowledge/import
   - Parse markdown frontmatter (YAML) + content
   - Extract: title, category, tags, content
   - Auto-generate embeddings for imported items
   - Support batch import (up to 50 items)
   - Implement MCP tool: `knowledge.import()` for end users' agents

2. **US-089: Detect Duplicate Knowledge Items** (3 points)
   - Add deduplication logic to create/import
   - Strategy: Semantic similarity >0.95 OR title exact match
   - Return duplicates with similarity scores
   - Allow force-create with `allowDuplicates: true`

3. **US-090: Archive Obsolete Knowledge Items** (2 points)
   - Add `archivedAt` field to KnowledgeItem model (migration)
   - Implement PATCH /api/knowledge/[id]/archive
   - Archived items excluded from search by default
   - Support `includeArchived: true` filter
   - Implement MCP tool: `knowledge.archive()` for end users' agents

**Acceptance Criteria**:
- Import handles 50 markdown files <10 seconds
- Deduplication accuracy >90%
- Archived items hidden but not deleted
- End users' agents can import their existing docs

**Dependencies**: Sprint 5 embedding service, hybrid search ✅

---

## Phase 2: Skills Database & Schema (Day 3)
**User Stories**: US-095, US-096, US-097 (3 stories, 7 points)
**Goal**: Create Skills table for end users' framework documentation

### Day 3: Skills Schema + Validation (US-095, US-096, US-097) - 7 points

**Tasks**:
1. **US-095: Create Skills Database Model** (3 points)
   - Create `Skill` Prisma model (for END USERS' projects):
     ```prisma
     model Skill {
       id          String   @id @default(uuid())
       projectId   String   // Links to end user's project
       slug        String   // URL-friendly identifier
       category    String   // framework, testing, workflow, troubleshooting

       // Frontmatter (YAML) - parsed and stored separately
       title       String
       description String?
       tags        String[]
       frameworks  String[]  // e.g., ["react", "nextjs"]
       version     String?   // Framework version applicability

       // Markdown content
       content     String    @db.Text

       // Metadata
       usageCount  Int      @default(0)
       lastLoadedAt DateTime?
       createdAt   DateTime @default(now())
       updatedAt   DateTime @updatedAt

       // Relations
       project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
       linkedKnowledge KnowledgeItem[] @relation("SkillKnowledge")

       @@unique([projectId, slug])
       @@index([category])
       @@index([projectId])
       @@index([usageCount])
       @@index([lastLoadedAt])
     }
     ```
   - Run migration: `DATABASE_URL="..." npx prisma migrate dev --name add_skills_table`
   - Deploy to Mac mini database

2. **US-096: Categorize Skills** (2 points)
   - Define skill categories enum:
     - `framework`: React, Next.js, Prisma, TypeScript patterns
     - `testing`: Jest, React Testing Library, Playwright patterns
     - `workflow`: Git, CI/CD, deployment procedures
     - `troubleshooting`: Common errors, debugging SOPs
   - Add category validation in Zod schema

3. **US-097: Validate Skill Frontmatter** (2 points)
   - Install `gray-matter` library for YAML frontmatter parsing
   - Create Zod schemas in `lib/validations/skill.ts`:
     - `SkillFrontmatterSchema` (title, description, tags, frameworks, category)
     - `SkillCreateSchema` (frontmatter + content)
     - `SkillUpdateSchema` (partial updates)
   - Implement YAML parser helper function
   - Add validation to API routes

**Acceptance Criteria**:
- Prisma migration applied successfully
- Frontmatter parsing handles valid/invalid YAML
- TypeScript 0 errors
- Skills scoped to end user's project (multi-tenancy ready)

**Dependencies**: Prisma ORM, PostgreSQL ✅

---

## Phase 3: Skills API & MCP Tools (Days 4-5)
**User Stories**: US-091, US-092, US-093 (3 stories, 8 points)
**Goal**: Implement lazy-loading API for end users' agents

### Day 4: List + Load Skills API (US-091, US-092) - 5 points

**Tasks**:
1. **US-091: List Skills with Frontmatter Only** (2 points)
   - Implement GET /api/skills (query: projectId, category, tags, search)
   - Return: id, slug, title, description, category, tags, frameworks
   - Exclude: content field (lazy-loading for token efficiency)
   - Add pagination (default: 20 per page)
   - Measure token usage: target <80 tokens for 10 skills
   - Implement MCP tool: `skill.list(projectId)` for end users' agents

2. **US-092: Load Full Skill Content On-Demand** (3 points)
   - Implement GET /api/skills/[slug] (query: projectId)
   - Return: full record including content field
   - Increment usageCount, update lastLoadedAt
   - Measure token usage: target <250 tokens per skill
   - Implement MCP tool: `skill.load(projectId, slug)` for end users' agents

**Acceptance Criteria**:
- List endpoint returns 10 skills in <50ms
- Frontmatter-only response <80 tokens
- Full skill load <250 tokens (92% reduction from 2,500 baseline)
- End users' agents get their project-specific skills only

**Dependencies**: Skills schema ✅

---

### Day 5: Search Skills (US-093) - 3 points

**Tasks**:
1. **US-093: Search Skills by Keywords/Tags** (3 points)
   - Add full-text search on title, description, content
   - Add tag filtering (multiple tags, OR logic)
   - Add framework filtering
   - Return frontmatter only (consistent with list)
   - Scope to projectId
   - Implement MCP tool: `skill.search(projectId, query, tags, frameworks)` for end users' agents

**Acceptance Criteria**:
- Search returns relevant results in <100ms
- Tag filtering works correctly (OR logic)
- Results exclude content (lazy-loading preserved)
- End users' agents search only their project's skills

**Dependencies**: Skills list API ✅

---

## Phase 4: Skills Advanced Features (Days 6-7)
**User Stories**: US-094, US-098, US-099, US-100 (4 stories, 9 points)
**Goal**: Auto-unload, token measurement, CRUD operations

### Day 6: Auto-Unload + Token Measurement (US-094, US-098) - 5 points

**Tasks**:
1. **US-094: Auto-Unload Skills After 5 Minutes** (3 points)
   - Implement LRU cache for loaded skills (in-memory per Next.js instance)
   - Cache key: `${projectId}:${slug}`
   - Cache TTL: 5 minutes (300 seconds)
   - Cache eviction: Least Recently Used
   - Track cache hits/misses in metrics
   - Note: In-memory cache (migrate to Redis for production multi-instance)

2. **US-098: Measure Token Usage Per Skill Load** (2 points)
   - Add token counting utility (rough estimate: chars / 4)
   - Track: frontmatter tokens, full skill tokens, reduction percentage
   - Store metrics in `SkillLoadMetric` model (new Prisma model)
   - Create dashboard endpoint: GET /api/skills/metrics (query: projectId)
   - Implement MCP tool: `skill.getMetrics(projectId)` for end users' agents

**Acceptance Criteria**:
- Auto-unload evicts skills after 5 minutes
- Token measurements confirm <80 tokens (frontmatter), <250 tokens (full)
- Metrics dashboard functional per project
- Cache respects project isolation

**Dependencies**: Skills load API ✅

---

### Day 7: Update + Delete Skills (US-099, US-100) - 4 points

**Tasks**:
1. **US-099: Update Skill Content** (2 points)
   - Implement PATCH /api/skills/[slug] (query: projectId)
   - Support partial updates (frontmatter OR content)
   - Revalidate frontmatter YAML on update
   - Invalidate cache on update
   - Implement MCP tool: `skill.update(projectId, slug, data)` for end users' agents

2. **US-100: Delete Skills** (2 points)
   - Implement DELETE /api/skills/[slug] (query: projectId)
   - Remove from cache
   - Cascade delete: Unlink from knowledge items
   - Implement MCP tool: `skill.delete(projectId, slug)` for end users' agents

**Acceptance Criteria**:
- Update preserves relationships
- Delete cascades correctly
- Cache invalidation works
- End users can only update/delete their own project's skills

**Dependencies**: Skills load API ✅

---

## Phase 5: Skills Import/Export (Day 8)
**User Stories**: US-101, US-102 (2 stories, 6 points)
**Goal**: Bidirectional sync with markdown files for end users

### Day 8: Export + Import Skills (US-101, US-102) - 6 points

**Tasks**:
1. **US-101: Export Skills to Markdown** (3 points)
   - Implement GET /api/skills/export/[slug] (single skill, query: projectId)
   - Implement GET /api/skills/export (all skills as ZIP, query: projectId)
   - Format: YAML frontmatter + markdown content
   - Use `gray-matter` to serialize frontmatter
   - Implement MCP tool: `skill.export(projectId, slug?)` for end users' agents

2. **US-102: Import Skills from Markdown** (3 points)
   - Implement POST /api/skills/import (query: projectId)
   - Parse markdown files with frontmatter
   - Extract: title, description, tags, frameworks, category, content
   - Support batch import (up to 50 skills)
   - Auto-detect duplicates (slug collision within project)
   - Implement MCP tool: `skill.import(projectId, files)` for end users' agents

**Acceptance Criteria**:
- Export generates valid markdown with frontmatter
- Import handles end users' existing skill files
- Batch import completes <10 seconds for 50 skills
- Import/export scoped to project

**Dependencies**: Skills CRUD APIs ✅

---

## Phase 6: Skills Integration (Days 9-10)
**User Stories**: US-103, US-104, US-105 (3 stories, 6 points)
**Goal**: Usage tracking, knowledge links, deduplication

### Day 9: Usage Tracking + Knowledge Links (US-103, US-104) - 4 points

**Tasks**:
1. **US-103: Track Skill Usage Frequency** (2 points)
   - Increment usageCount on each load
   - Update lastLoadedAt timestamp
   - Add endpoint: GET /api/skills/popular (top 10 by usageCount, query: projectId)
   - Add filter: GET /api/skills?sortBy=popular&projectId=X

2. **US-104: Link Skills to Knowledge Items** (2 points)
   - Add many-to-many relation: Skill ↔ KnowledgeItem (within same project)
   - Implement POST /api/skills/[slug]/link (link to knowledge, query: projectId)
   - Implement DELETE /api/skills/[slug]/link (unlink)
   - Show linked knowledge in skill detail
   - Implement MCP tool: `skill.linkKnowledge(projectId, skillSlug, knowledgeId)` for end users' agents

**Acceptance Criteria**:
- Usage tracking updates on every load
- Popular skills endpoint returns top 10 per project
- Knowledge links bidirectional within project scope

**Dependencies**: Skills CRUD, Knowledge APIs ✅

---

### Day 10: Deduplication (US-105) - 2 points

**Tasks**:
1. **US-105: Detect Duplicate Skills** (2 points)
   - Add deduplication check to create/import (within project scope)
   - Strategy: Slug collision OR title exact match (within same projectId)
   - Return duplicates with suggestions
   - Allow force-create with `allowDuplicates: true`

**Acceptance Criteria**:
- Duplicate detection prevents slug collisions within project
- Title match suggestions helpful
- Cross-project duplicates allowed (different projects can have same skill names)

**Dependencies**: Skills CRUD APIs ✅

---

## Phase 7: Testing & Documentation (Days 11-12)
**Goal**: Comprehensive testing, documentation updates, quality gates

### Day 11: Integration Testing

**Tasks**:
1. Knowledge API tests (export, import, archive, deduplication)
2. Skills API tests (list, load, search, CRUD) with projectId scoping
3. Skills lazy-loading tests (cache behavior, token measurements)
4. Skills import/export tests (markdown parsing, batch operations)
5. MCP tool tests (all 12 new tools: 4 knowledge + 8 skills)
6. Multi-tenancy tests (verify project isolation)

**Coverage Targets**:
- API routes: 100% (all endpoints tested)
- MCP tools: 100% (all 12 tools tested)
- Cache logic: 90% (LRU eviction scenarios)
- Project isolation: 100% (no data leakage)

---

### Day 12: Documentation + Quality Gates

**Tasks**:
1. **Update System Documentation**:
   - `.agent/system/api-catalog.md` (10 new endpoints: 4 knowledge + 6 skills)
   - `.agent/system/mcp-tools-guide.md` (12 new tools: 4 knowledge + 8 skills)
   - `.agent/system/skills-catalog.md` (NEW - Skills system reference for END USERS)

2. **Create Sprint 6 Completion Doc** (optional):
   - Implementation summary
   - Token efficiency measurements
   - Performance benchmarks
   - Lessons learned

3. **Quality Gates**:
   - TypeScript: 0 errors (strict mode)
   - ESLint: 0 critical errors
   - Tests: All passing (integration + unit)
   - Build: Production build succeeds
   - Performance: All latency targets met (<200ms knowledge, <100ms skills)

4. **Update Memory Banks** (STEP 5):
   - `.agent/active-context.md` (Sprint 6 complete)
   - `.agent/progress.md` (321/484 points = 66%)
   - `docs/13-Project-Plan.md` (Sprint 6 status update, fix title error)

---

## Success Criteria

### Functional Requirements
- ✅ All 20 user stories implemented (US-086 to US-105)
- ✅ Knowledge graph: export, import, metrics, deduplication, archival
- ✅ Skills: lazy-loading, search, categorization, import/export, usage tracking
- ✅ MCP tools: 12 new tools (4 knowledge + 8 skills) for end users' agents
- ✅ Multi-tenancy: Project isolation working correctly

### Performance Requirements
- ✅ Knowledge query <200ms (P95)
- ✅ Skills list <50ms (P95)
- ✅ Skills load <100ms (P95)
- ✅ Skills import 50 files <10 seconds

### Token Efficiency
- ✅ Skills frontmatter <80 tokens (per 10 skills)
- ✅ Skills full load <250 tokens (per skill)
- ✅ 92% token reduction confirmed (2,500 → 220 tokens)

### Quality Gates
- ✅ TypeScript: 0 errors
- ✅ Tests: 100% passing (all integration tests)
- ✅ Documentation: All system docs updated
- ✅ Build: Production build succeeds

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| YAML parsing complexity | High | Use battle-tested `gray-matter` library, add comprehensive validation |
| LRU cache implementation | Medium | Start with simple in-memory Map, document Redis migration path |
| Token measurement accuracy | Medium | Use conservative estimates (chars / 4), validate with actual agent tests |
| Project isolation bugs | High | Comprehensive multi-tenancy tests, enforce projectId filters everywhere |
| Frontmatter schema evolution | Low | Version frontmatter schema, support backward compatibility |

---

## Dependencies Summary

**External Libraries**:
- `gray-matter` - YAML frontmatter parsing
- `zod` - Schema validation
- `@prisma/client` - Database ORM

**Internal Services**:
- Sprint 5 knowledge APIs ✅
- Sprint 5 embedding service ✅
- Sprint 5.5 MCP server ✅
- Sprint 1 Project model ✅ (for multi-tenancy)

**Infrastructure**:
- PostgreSQL with pgvector ✅
- Mac mini deployment (192.168.1.15:3000) ✅

---

## Token Budget

**Estimated Token Usage**:
- Session start: ~84K tokens
- Plan creation: ~5K tokens
- Expert consultations: ~15K tokens (3 experts × 5K each)
- Implementation: ~60K tokens (Days 1-10)
- Testing & docs: ~10K tokens (Days 11-12)
- Checkpoints: ~5K tokens (4 checkpoints × 1.25K each)
- **Total Estimated**: ~179K tokens / 200K budget (90% utilization)

**Checkpoint Schedule**:
- Checkpoint 1: Session start (0K) ✅
- Checkpoint 2: Day 3 complete (Phase 2 done) - ~110K tokens
- Checkpoint 3: Day 6 complete (Phase 4 done) - ~140K tokens
- Checkpoint 4: Day 10 complete (Phase 6 done) - ~170K tokens
- Checkpoint 5: Sprint complete (Phase 7 done) - ~179K tokens

---

## Notes

**Plan Creation Date**: 2025-11-13 13:34
**Estimated Completion**: 2025-11-27 (2 weeks)
**Velocity Target**: 5-6 points/day (57 points / 10 days = 5.7 points/day)

**CRITICAL REMINDER**: All features are for END USERS and their AI agents:
- End users install ProjectPulse
- Their agents call MCP tools: `skill.load()`, `knowledge.search()`, etc.
- Data stored in ProjectPulse database (multi-tenant, scoped by projectId)
- NOT for our dogfooding (.agent/ folder)

**Next Steps (STEP 3)**:
1. Invoke `prisma-expert` for Skills table schema design and multi-tenancy
2. Invoke `next-js-expert` for Skills API route architecture
3. Begin implementation (Phase 1: Knowledge Graph Completion)

---

**Plan Status**: READY FOR REVIEW ✅
**Awaiting**: User approval to proceed with implementation
