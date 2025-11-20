# Sprint 8.7 Onboarding Test & Deployment Plan

**Session**: 2025-11-20 00:30 UTC
**Sprint**: Sprint 8.7 (Onboarding Refactor)
**Branch**: sprint-8.7
**Tag**: v8.7.0-onboarding-refactor
**Token Budget**: 200K tokens

---

## Objective

Complete end-to-end testing of the 3-session onboarding system and deploy Sprint 8.7 to production.

---

## Phase 1: Pre-Test Verification (5 min)

### Goals
- Verify infrastructure health before testing
- Confirm git branch state
- Validate database connectivity

### Tasks
1. Check Docker services health (nextjs-cloud, mcp-cloud, postgres-cloud)
2. Test database connectivity at 192.168.1.15:5432
3. Verify git branch is sprint-8.7 with 7 commits ahead

### Success Criteria
- All Docker containers running
- Database connection successful
- Git status clean (except untracked test files)

---

## Phase 2: Complete Onboarding E2E Test (30-45 min)

### Goals
- Test Session 1: Strategic Planning (10 phases + executive summary)
- Test Session 2: Document Generation (15 documents via 4 batches)
- Test Session 3: Bootstrap (personas, skills, workflows, SOPs, roadmap)

### Session 1: Strategic Planning
1. Create test project (projectId)
2. Execute 10 phases using `projectpulse_onboarding_getPhasedQuestions` and `projectpulse_onboarding_savePhase`
3. Generate executive summary using `projectpulse_onboarding_finalizeSummary`
4. Store summary using `projectpulse_onboarding_storeExecutiveSummary`
5. Verify projectContextJson has all 96 Q&A pairs + summary

### Session 2: Document Generation
1. Generate 4 batches using `projectpulse_onboarding_getDocBatchPrompt`
2. Store each batch using `projectpulse_onboarding_storeBatch`:
   - Batch 1: Planning (PRD, SRS, Backlog, Project Plan)
   - Batch 2: Architecture (Architecture, Data Model, API Spec)
   - Batch 3: Implementation (UI/UX, Security, Testing)
   - Batch 4: Operations (Deployment, Observability, Performance, Team Onboarding, Maintenance)
3. Verify 15 documents in database linked to OnboardingSession

### Session 3: Bootstrap
1. Call `projectpulse_onboarding_bootstrap` with projectId and temp repo path
2. Verify database records created:
   - 3-10 agent personas
   - 5-15 skills
   - 3 workflow templates
   - 5 SOPs
   - Roadmap with 5-level hierarchy (Phase → Sprint → Week → Day → Task)
3. Verify files written to temp repo:
   - CLAUDE.md
   - AGENTS.md

### Success Criteria
- Session 1: 100% progress, executive summary stored
- Session 2: 100% progress, 15 documents created
- Session 3: 100% progress, all artifacts created, files written
- No errors during execution

---

## Phase 3: Error Scenario Testing (15 min)

### Goals
- Test prerequisite validation
- Test idempotency
- Test error handling

### Test Cases
1. **Session 2 without Session 1**
   - Attempt to call `getDocBatchPrompt` without completing Session 1
   - Expected: 400 error with message about missing Session 1

2. **Session 3 without Session 2**
   - Attempt to call `bootstrap` without completing Session 2
   - Expected: 400 error with message about missing 15 documents

3. **Duplicate Session 1**
   - Call Session 1 phases again on completed project
   - Expected: Idempotent update, no duplicate records

4. **Invalid Repo Path**
   - Call `bootstrap` with non-existent repo path
   - Expected: 500 error with clear message about invalid path

### Success Criteria
- All error cases return appropriate HTTP status codes
- Error messages are clear and actionable
- No database corruption from failed operations

---

## Phase 4: Cleanup Test Data (5 min)

### Goals
- Verify cascade delete behavior
- Clean up test project

### Tasks
1. Delete test project using `DELETE /api/projects/:id`
2. Verify cascade deletes:
   - OnboardingSession deleted
   - All 15 Documents deleted
   - All AgentPersonas deleted
   - All Skills deleted
   - All WorkflowTemplates deleted
   - All SOPs deleted
   - All Roadmap hierarchy deleted

### Success Criteria
- Test project fully removed from database
- No orphaned records
- Foreign key constraints respected

---

## Phase 5: Production Deployment (10 min)

### Goals
- Push sprint-8.7 branch to remote
- Tag release as v8.7.0-onboarding-refactor
- Verify production health
- Smoke test on production

### Tasks
1. Push branch: `git push origin sprint-8.7`
2. Create tag: `git tag v8.7.0-onboarding-refactor`
3. Push tag: `git push origin v8.7.0-onboarding-refactor`
4. Verify Docker stack on Mac mini (192.168.1.15)
5. Smoke test: Health check endpoint
6. Smoke test: Create real project and test Session 1 Phase 1

### Success Criteria
- Branch and tag pushed successfully
- Production Docker containers healthy
- Health check returns 200
- Real onboarding workflow starts successfully

---

## Quality Gates

### Before Deployment
- [ ] All E2E tests pass
- [ ] Error scenarios handled correctly
- [ ] Test data cleaned up
- [ ] No uncommitted changes (except test files to discard)

### After Deployment
- [ ] Production health check passes
- [ ] Smoke test completes
- [ ] No errors in Docker logs
- [ ] MCP tools accessible

---

## Rollback Plan

If deployment fails:
1. Revert tag: `git tag -d v8.7.0-onboarding-refactor && git push origin :refs/tags/v8.7.0-onboarding-refactor`
2. Reset branch: `git reset --hard HEAD~7`
3. Restart Docker: `docker-compose restart nextjs-cloud mcp-cloud`
4. Investigate and fix issues
5. Re-test before redeploying

---

## Checkpoints

Token checkpoints every 15K tokens:
- 15K: Phase 1 complete
- 30K: Session 1 complete
- 45K: Session 2 complete
- 60K: Session 3 complete
- 75K: Error scenarios complete
- 90K: Deployment complete

---

**Plan Status**: APPROVED ✅
**Ready to Execute**: YES ✅
**Protocol Step 2**: COMPLETE ✅
