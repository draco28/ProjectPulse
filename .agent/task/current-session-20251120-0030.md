# Session: Sprint 8.7 Onboarding Test & Deployment
**Date**: 2025-11-20 00:30 UTC
**Sprint**: Sprint 8.7 (Onboarding Refactor)
**Branch**: sprint-8.7
**Token Budget**: 200K tokens (65.6K remaining after protocol reading)

---

## Session Goals

### Primary Objective
Complete end-to-end onboarding testing and deploy Sprint 8.7 to production

### Key Deliverables
1. **Phase 2**: Complete onboarding E2E test (Session 1, 2, 3)
2. **Phase 3**: Error scenario testing
3. **Phase 4**: Cleanup test data
4. **Phase 5**: Production deployment (push + tag v8.7.0)

---

## Current Context

### Branch Status
- Branch: `sprint-8.7`
- Commits ahead: 7 commits (Commits 4-7 just completed)
- Latest commits:
  - cef99e7: docs(onboarding): Week 3 specs, checklists, summaries
  - a1b3675: test(onboarding): E2E tests, fixtures, seeds
  - ff2b447: feat(onboarding): observability tools
  - c89122d: feat(onboarding): Week 3 batch tools

### Infrastructure Status
- Mac mini Docker: 192.168.1.15:3000 (production)
- MCP Server: 192.168.1.15:3001/mcp
- Database: postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev

### Requirements
Per `.agent/progress.md` and `.agent/active-context.md`:
- Sprint 8.5 Phase 2 complete (Blueprint MCP tool)
- Sprint 8.7 (Onboarding Refactor) ready for testing
- All commits structured and pushed
- Tag as v8.7.0 (NOT v9.0.0) to avoid conflict with main project plan

---

## Memory Banks Loaded

✓ project-brief.md - ProjectPulse AI workflow platform
✓ system-patterns.md - 3-session onboarding architecture
✓ tech-context.md - Next.js 14 + PostgreSQL 16 + Prisma + MCP
✓ active-context.md - Sprint 8.5 Phase 2 complete, Sprint 8.7 ready
✓ progress.md - 386.5/484 story points (80% implementation)

---

## Implementation Plan

### Phase 1: Pre-Test Verification (5 min)
- Docker services health check
- Database connectivity test
- Git branch verification

### Phase 2: Complete Onboarding E2E Test (30-45 min)
- Session 1: Strategic Planning (10 phases + executive summary)
- Session 2: Document Generation (15 documents via 4 batches)
- Session 3: Bootstrap (personas, skills, workflows, SOPs, roadmap)

### Phase 3: Error Scenario Testing (15 min)
- Session 2 without Session 1 → Should reject
- Session 3 without Session 2 → Should reject
- Duplicate Session 1 → Should be idempotent
- Invalid repo path → Should error gracefully

### Phase 4: Cleanup Test Data (5 min)
- Cascade delete test project
- Verify all related records deleted

### Phase 5: Production Deployment (10 min)
- Push sprint-8.7 branch
- Tag release as v8.7.0-onboarding-refactor
- Verify production Docker stack
- Smoke test production

---

## Success Criteria

### Testing Success
- [ ] All 3 sessions complete successfully
- [ ] Database has 15 documents, 3-10 personas, 5-15 skills, 3 workflows, 5 SOPs
- [ ] Roadmap materialized with 5-level hierarchy
- [ ] CLAUDE.md and AGENTS.md written to temp repo
- [ ] No errors in error scenario tests

### Deployment Success
- [ ] Branch pushed to remote
- [ ] Release tagged (v8.7.0)
- [ ] Docker stack confirmed healthy
- [ ] Smoke test successful on real project

---

## Progress Tracking

**Checkpoints**: Every 15K tokens (15K, 30K, 45K, 60K, 75K, 90K)

**Next Checkpoint**: 80K tokens (15K away)

---

## Session Log

### 00:30 UTC - Session Start
- Read mandatory protocol and violations log
- Loaded 5 memory bank files (~10K tokens)
- Created session file
- Ready to save plan and proceed

### [Updates will be added at each checkpoint]

---

**Session Status**: INITIALIZED ✅
**Protocol Compliance**: Step 1 COMPLETE ✅