# Onboarding Session Refactor - Documentation

**Sprint**: Sprint 9 (Phase E, Week 17)  
**Created**: 2025-11-20  
**Status**: ✅ APPROVED - Ready for Implementation  
**Validated By**: Grok (95%+ accuracy confirmed)

---

## Quick Navigation

### 📋 [1. Overview](./01-overview.md)
**Start Here** - Executive summary, current state vs refactored goals, Grok's validation, architecture overview.

**Read this if you want to**:
- Understand the refactor at a high level
- See what's changing and why
- Review Grok's validation points
- Understand the 3-session architecture

---

### 🗄️ [2. Schema Changes](./02-schema-changes.md)
Database schema updates, Prisma models, seed scripts.

**Read this if you want to**:
- Understand new `OnboardingSession` fields
- Learn about `WorkflowTemplate` table
- See migration scripts
- Update seed data (96 questions, 16 templates)

**Key Sections**:
- OnboardingSession field descriptions (`planningAnswers`, `projectContextJson`, etc.)
- WorkflowTemplate schema for database-driven prompts
- Migration SQL script
- Seed data structure

---

### 🔧 [3. MCP Tools](./03-mcp-tools.md)
All 17 MCP tool specifications with input/output schemas.

**Read this if you want to**:
- Implement or update MCP tools
- Understand tool signatures
- See input validation schemas
- Learn tool usage patterns

**Key Sections**:
- Tool catalog summary (8 new, 5 refactored, 4 kept)
- Session 1 tools (getPhasedQuestions, savePhase, finalizeSummary, checkTokenBudget)
- Session 2 tools (getDocBatchPrompt, storeBatch)
- Session 3 tools (getBootstrapPrompt, createBatch tools, repo.writeMinimal)
- Cross-session tools (logStep, completeSession)

---

### 📅 [4. Implementation Plan](./04-implementation-plan.md)
Week-by-week tasks, file changes, timelines.

**Read this if you want to**:
- Execute the refactor
- Understand day-by-day tasks
- See file changes matrix
- Follow dependency order

**Key Sections**:
- **Week 1**: Schema + Session 1 tools (8 points, ~3-4 hours)
  - Day 1: Database schema
  - Day 2: Session 1 MCP tools refactor
- **Week 2**: Session 2 & 3 tools (10 points, ~4-5 hours)
  - Day 3: Session 2 batch tools
  - Day 4: Session 3 bootstrap tools
- **Week 3**: Observability & testing (6 points, ~2-3 hours)
  - Day 5: Progress tracking & validation
  - Day 6: E2E test fixes

---

### 🧪 [5. Migration & Testing](./05-migration-testing.md)
Data migration, backward compatibility, E2E test fixes, performance benchmarks, rollback procedures.

**Read this if you want to**:
- Migrate existing data safely
- Ensure backward compatibility
- Fix E2E test isolation (6/10 → 10/10 passing)
- Measure performance (token efficiency, latency)
- Have a rollback plan

**Key Sections**:
- Data migration script
- Legacy tool redirects
- E2E test isolation fix (unique project IDs + cleanup)
- Token efficiency benchmarks (88-92% reduction)
- Rollback procedures

---

## Document Relationships

```
01-overview.md (START HERE)
    ↓
    ├─→ 02-schema-changes.md (Database updates)
    │       ↓
    │       └─→ Prisma migration + seeds
    │
    ├─→ 03-mcp-tools.md (Tool specifications)
    │       ↓
    │       └─→ API route implementations
    │
    ├─→ 04-implementation-plan.md (Execution guide)
    │       ↓
    │       └─→ Week-by-week tasks
    │
    └─→ 05-migration-testing.md (Safety & validation)
            ↓
            └─→ E2E tests + rollback
```

---

## Quick Reference

### Key Changes Summary

| Aspect | Current | Refactored |
|--------|---------|------------|
| **Tools** | Monolithic (all-at-once) | Granular (per-phase/batch) |
| **Prompts** | Hardcoded in tools | Database-driven (WorkflowTemplate) |
| **Schema** | Nested `response` JSONB | Explicit fields (`planningAnswers`, etc.) |
| **Session 1** | All 96 Q&A in one prompt | 10 phases × ~10K tokens |
| **Session 2** | All 15 doc prompts | 4 batches × 30-40K tokens |
| **Session 3** | Single `bootstrap()` tool | Separate batch create tools |
| **Token Budget** | No tracking | `checkTokenBudget()` before ops |
| **Repo Writes** | Automatic | Opt-in via `repo.writeMinimal()` |
| **E2E Tests** | 6/10 pass (shared ID) | 10/10 pass (unique IDs + cleanup) |

### Success Metrics

- ✅ 96 questions seeded
- ✅ 16 workflow templates seeded
- ✅ 88-92% token reduction
- ✅ <500ms P95 MCP latency
- ✅ 10/10 E2E tests passing
- ✅ >95% agent autonomy

### Estimated Effort

- **Total**: 24 story points (~7-11 hours)
- **Week 1**: 8 points (~3-4 hours) - Schema + Session 1
- **Week 2**: 10 points (~4-5 hours) - Session 2 & 3
- **Week 3**: 6 points (~2-3 hours) - Observability + tests

---

## Getting Started

### For Implementers

1. **Read**: [01-overview.md](./01-overview.md) - Understand the big picture
2. **Study**: [02-schema-changes.md](./02-schema-changes.md) - Database updates
3. **Reference**: [03-mcp-tools.md](./03-mcp-tools.md) - Tool signatures
4. **Execute**: [04-implementation-plan.md](./04-implementation-plan.md) - Follow day-by-day
5. **Validate**: [05-migration-testing.md](./05-migration-testing.md) - Test & measure

### For Reviewers

1. **Overview**: [01-overview.md](./01-overview.md) - High-level changes
2. **Schema**: [02-schema-changes.md](./02-schema-changes.md) - Data model impact
3. **Tools**: [03-mcp-tools.md](./03-mcp-tools.md) - API surface changes
4. **Plan**: [04-implementation-plan.md](./04-implementation-plan.md) - Timeline & risks

### For Testers

1. **Overview**: [01-overview.md](./01-overview.md) - What to test
2. **Testing Guide**: [05-migration-testing.md](./05-migration-testing.md) - E2E patterns, benchmarks

---

## Key Principles (Don't Compromise)

1. **Agent-Side AI**: Server NEVER generates content (only provides prompts)
2. **Database as Truth**: All state in PostgreSQL, UI reads from DB
3. **Clean Repos**: Only 2 optional files (`claude.md`, `agents.md`)
4. **Token Efficiency**: Phased/batched to stay <200K per session
5. **Backward Compat**: Legacy tools redirect during Sprint 9
6. **Observability**: Log every step, track metrics, validate reports

---

## Questions or Issues?

If anything is unclear:
1. Check the relevant document above
2. Review original spec: `/Users/draco/projects/AI_HUB/Onboarding_Session_Feature_Specificati.md`
3. Consult current implementation: `apps/mcp-server/src/tools/onboarding/`
4. Refer to Grok's validation in [01-overview.md](./01-overview.md)

---

## Status Updates

**Sprint 9 Week 1**: Schema + Session 1 tools  
**Sprint 9 Week 2**: Session 2 & 3 tools  
**Sprint 9 Week 3**: Observability + testing  
**Sprint 10**: Cleanup (remove deprecated fields/tools)  
**Sprint 11**: Enhancements (UI dashboard, analytics)

---

**Last Updated**: 2025-11-20  
**Next Review**: Sprint 9 completion  
**Maintained By**: Development Team
