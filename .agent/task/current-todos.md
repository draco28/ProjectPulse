# Sprint 6 Task List - Knowledge Graph + Skills System

**Created**: 2025-11-13 13:34
**Sprint**: Sprint 6 (Weeks 11-12)
**Total Points**: 57 points (20 user stories)
**Status**: 22/57 points complete (39%)

---

## Phase 1: Knowledge Graph Completion (15 points) ✅ COMPLETE

### Day 1: Performance + Export (5 points) ✅ COMPLETE
- [x] US-086: Measure query performance (3 pts) - Create KnowledgeQueryMetric model, add timing, MCP tool
- [x] US-087: Export knowledge graph (2 pts) - GET /api/knowledge/export, MCP tool

### Day 2: Import + Deduplication + Archival (10 points) ✅ COMPLETE
- [x] US-088: Import knowledge from markdown (5 pts) - POST /api/knowledge/import, frontmatter parsing, MCP tool
- [x] US-089: Detect duplicate knowledge items (3 pts) - Semantic similarity >0.95 OR title match
- [x] US-090: Archive obsolete knowledge items (2 pts) - Add archivedAt field, PATCH /api/knowledge/[id]/archive, MCP tool

---

## Phase 2: Skills Database & Schema (7 points) ✅ COMPLETE

### Day 3: Skills Schema + Validation (7 points) ✅ COMPLETE
- [x] US-095: Create Skills database model (3 pts) - Prisma model with projectId, frontmatter fields, migration
- [x] US-096: Categorize skills (2 pts) - Define categories: framework, testing, workflow, troubleshooting
- [x] US-097: Validate skill frontmatter (2 pts) - Install gray-matter, create Zod schemas, YAML parser

---

## Phase 3: Skills API & MCP Tools (8 points) ✅ COMPLETE

### Day 4: List + Load Skills API (5 points) ✅ COMPLETE
- [x] US-091: List skills with frontmatter only (2 pts) - GET /api/skills, exclude content, <80 tokens, MCP tool
- [x] US-092: Load full skill content on-demand (3 pts) - GET /api/skills/[slug], <250 tokens, MCP tool

### Day 5: Search Skills (3 points) ✅ COMPLETE
- [x] US-093: Search skills by keywords/tags (3 pts) - Full-text search, tag/framework filtering, MCP tool

---

## Phase 4: Skills Advanced Features (9 points)

### Day 6: Auto-Unload + Token Measurement (5 points) - NOT STARTED
- [ ] US-094: Auto-unload skills after 5 minutes (3 pts) - LRU cache, TTL 300s, cache eviction
- [ ] US-098: Measure token usage per skill load (2 pts) - Token counting, SkillLoadMetric model, MCP tool

### Day 7: Update + Delete Skills (4 points) - NOT STARTED
- [ ] US-099: Update skill content (2 pts) - PATCH /api/skills/[slug], partial updates, cache invalidation, MCP tool
- [ ] US-100: Delete skills (2 pts) - DELETE /api/skills/[slug], cascade delete, cache removal, MCP tool

---

## Phase 5: Skills Import/Export (6 points)

### Day 8: Export + Import Skills (6 points) - NOT STARTED
- [ ] US-101: Export skills to markdown (3 pts) - GET /api/skills/export, YAML frontmatter serialization, ZIP, MCP tool
- [ ] US-102: Import skills from markdown (3 pts) - POST /api/skills/import, batch up to 50, duplicate detection, MCP tool

---

## Phase 6: Skills Integration (6 points)

### Day 9: Usage Tracking + Knowledge Links (4 points) - NOT STARTED
- [ ] US-103: Track skill usage frequency (2 pts) - Increment usageCount, update lastLoadedAt, popular endpoint
- [ ] US-104: Link skills to knowledge items (2 pts) - Many-to-many relation, link/unlink endpoints, MCP tool

### Day 10: Deduplication (2 points) - NOT STARTED
- [ ] US-105: Detect duplicate skills (2 pts) - Slug collision OR title match within project, force-create option

---

## Phase 7: Testing & Documentation (6 points)

### Day 11: Integration Testing (3 points) - NOT STARTED
- [ ] Knowledge API tests (export, import, archive, deduplication)
- [ ] Skills API tests (list, load, search, CRUD) with projectId scoping
- [ ] Skills lazy-loading tests (cache behavior, token measurements)
- [ ] Skills import/export tests (markdown parsing, batch operations)
- [ ] MCP tool tests (all 12 new tools: 4 knowledge + 8 skills)
- [ ] Multi-tenancy tests (verify project isolation)

### Day 12: Documentation + Quality Gates (3 points) - NOT STARTED
- [ ] Update .agent/system/api-catalog.md (10 new endpoints)
- [ ] Update .agent/system/mcp-tools-guide.md (12 new tools)
- [ ] Create .agent/system/skills-catalog.md (NEW)
- [ ] Run quality gates (TypeScript 0 errors, tests passing, build succeeds)
- [ ] Update memory banks (active-context.md, progress.md)
- [ ] Update docs/13-Project-Plan.md (Sprint 6 status, fix title error)

---

## Progress Summary

**Completed**: 11/20 user stories (55%)
**Points Completed**: 30/57 points (53%)
**Current Phase**: Phase 4 - Skills Advanced Features
**Current Day**: Day 6 (starting)

**Velocity Target**: 5-6 points/day
**Days Remaining**: 10 days (estimated)

---

## MCP Tools to Implement (12 total)

**Knowledge Tools (4)**:
1. `knowledge.getMetrics()`
2. `knowledge.export()`
3. `knowledge.import()`
4. `knowledge.archive()`

**Skills Tools (8)**:
5. `skill.list(projectId)`
6. `skill.load(projectId, slug)`
7. `skill.search(projectId, query, tags, frameworks)`
8. `skill.getMetrics(projectId)`
9. `skill.update(projectId, slug, data)`
10. `skill.delete(projectId, slug)`
11. `skill.export(projectId, slug?)`
12. `skill.import(projectId, files)`
13. `skill.linkKnowledge(projectId, skillSlug, knowledgeId)`

---

## Checkpoints

- [ ] Checkpoint 2: Day 3 complete (Phase 2 done) - ~110K tokens
- [ ] Checkpoint 3: Day 6 complete (Phase 4 done) - ~140K tokens
- [ ] Checkpoint 4: Day 10 complete (Phase 6 done) - ~170K tokens
- [ ] Checkpoint 5: Sprint complete (Phase 7 done) - ~179K tokens

---

## Notes

**Last Updated**: 2025-11-13 13:34
**Next Update**: After Day 1 completion (US-086, US-087)

**CRITICAL REMINDER**: All features are for END USERS and their AI agents:
- End users install ProjectPulse
- Their agents call MCP tools: `skill.load()`, `knowledge.search()`, etc.
- Data stored in ProjectPulse database (multi-tenant, scoped by projectId)
- NOT for our dogfooding (.agent/ folder)
