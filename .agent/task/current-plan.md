# Documentation Realignment Plan – Post-MVP (Sprint 11+)

**Session**: 2025-12-10 00:04 IST  
**Phase**: Production Hardening – Documentation Realignment  
**Objective**: Realign all docs in `docs/` with the as-built system (UI, API, DB, MCP, infra) up to Sprint 11 and deployed production.

## Scope

- Included: Product specs (PRD, SRS), architecture, data & API, infra/deployment, backlog/plan, feature guides.
- Excluded: Future/post-MVP speculative features not started in code.

## Constraints

- Documentation must match:
  - Next.js app in `apps/web`
  - MCP server in `apps/mcp-server`
  - Prisma schema + migrations in `apps/web/prisma`
  - Infra described by `docker-compose.*.yml`, `k8s/*.yaml`, Cloudflare URLs
  - MCP tools and behaviour implemented in `apps/mcp-server` and documented in `.agent/system/mcp-tools-guide.md`
- Environment model (authoritative as of 2025-12-08):
  - Dev: `http://localhost:3000` (web), `http://localhost:3001` (MCP)
  - Prod (Mac Mini via Cloudflare): `https://projectpulse.dracodev.dev` (web), `https://projectpulsemcp.dracodev.dev` (MCP)

---

## Stage 0 – Scope & Baselines

**Goals**

- Identify all active documentation artifacts and assign them to layers.
- Establish sources of truth for implementation.

**Tasks**

1. Inventory `docs/` using `docs/README.md` and filesystem listing.
2. Assign each doc to a layer:

   - L0: Index/overview (`docs/README.md`, any index files)
   - L1: Product specs (`01-PRD.md`, `02-SRS.md`)
   - L2: Architecture (`03-Architecture.md`, `03-MCP-SPECIFICATION.md`, `WORKFLOW_ARCHITECTURE.md`, other architecture docs)
   - L3: Data & API (`02-DATABASE-SCHEMA.md`, `04-Data-and-Model-Spec.md`, `06-API/openapi.yaml`)
   - L4: Ops/Infra (`11-Infrastructure-and-Deployment.md`, `INFRASTRUCTURE.md`, `.agent/system/infrastructure-state.md`, `.agent/tech-context.md`)
   - L5: Planning (`12-Backlog.md`, `13-Project-Plan.md`)
   - L6: Feature & guide docs (`features/`, testing docs, onboarding/knowledge/wiki guides, MCP multi-agent guide, etc.).

3. Record primary implementation sources of truth (SoT):

   - Code: `apps/web`, `apps/mcp-server`, `packages/roadmap-tools`
   - DB: `apps/web/prisma/schema.prisma` + key migrations
   - Infra: Docker compose files, k8s manifests, deployment scripts
   - MCP: tool index + `.agent/system/mcp-tools-guide.md`
   - Progress: `.agent/tech-context.md`, `.agent/progress.md`, `.agent/active-context.md`

**Output**

- "Doc Map" section in this plan describing layers and key files.

---

## Stage 1 – As-Built Discovery (Bottom-Up from Code)

**Goals**

- Build an accurate picture of what is actually implemented and deployed.

**Tasks**

1. **UI & Routes**

   - List all pages in `apps/web/app/**/page.tsx`.
   - For each route: record URL, feature name, key UI flows, linked APIs.

2. **API Surface**

   - Enumerate `apps/web/app/api/**/route.ts`.
   - For each endpoint: method, path, validation schema, models touched, major behaviours.

3. **MCP Tools**

   - List tools from `apps/mcp-server/src/tools/**` and the server index.
   - For each tool: name, category, input/output, backing API/Prisma operations.

4. **Database Schema**

   - Extract model list and fields from `schema.prisma` (and important migrations).
   - Note relationships, indexes, enum values relevant to docs.

5. **Infra & Runtime**

   - Summarize dev/prod setup from:
     - `docker-compose.cloud.yml` (dev)
     - `docker-compose.production.yml`
     - `k8s/*.yaml`
     - `.agent/system/infrastructure-state.md`, `.agent/tech-context.md`
   - Normalize healthcheck + URL expectations (localhost vs Cloudflare).

6. **Tests & Quality Gates**

   - Sample E2E/integration tests validating onboarding, wiki, knowledge, issues/tickets, health, MCP connectivity.
   - Note which requirements they cover.

**Output**

- "As-Built Map" section in this plan for UI, API, DB, MCP, infra, tests.

---

## Stage 2 – Spec vs Implementation Gap Analysis (Per Layer)

**Goals**

- For each documentation layer, reconcile spec with as-built behaviour.

**Tasks**

1. **L1 – PRD (`01-PRD.md`)**

   - Compare feature list and MVP definition to As-Built Map.
   - Flag:
     - Implemented but undocumented features.
     - Documented MVP features not fully built or changed.
   - Update terminology (Issues vs Tickets, memory banks vs actual schema, etc.).

2. **L1 – SRS (`02-SRS.md`)**

   - For each relevant FR:
     - Mark status: fully satisfied / partially satisfied / not implemented.
     - Capture a one-line evidence link (e.g. route, model, test).

3. **L2 – Architecture (`03-Architecture.md`, `03-MCP-SPECIFICATION.md`, `WORKFLOW_ARCHITECTURE.md`, etc.)**

   - Align component diagrams and flows with actual Next.js + MCP + DB + Redis + Cloudflare design.
   - Ensure MCP transport, session storage, and agent usage match current implementation.

4. **L3 – Data & API (`02-DATABASE-SCHEMA.md`, `04-Data-and-Model-Spec.md`, `06-API/openapi.yaml`)**

   - Update data-model docs to match `schema.prisma` exactly (names, types, relations, indexes, enums).
   - Sync API spec with real endpoints and types.

5. **L4 – Ops/Infra (`11-Infrastructure-and-Deployment.md`, `INFRASTRUCTURE.md`, `.agent/system/infrastructure-state.md`)**

   - Replace legacy IP-based assumptions with:
     - Dev: `http://localhost:3000` / `http://localhost:3001`
     - Prod: Cloudflare URLs and internal ports `8080/8081`.
   - Align deployment steps with `docker-compose.production.yml` and `scripts/deploy-prod.sh` + migration SOPs.

6. **L5–L6 – Planning & Feature Docs (`12-Backlog.md`, `13-Project-Plan.md`, feature guides)**

   - Update planning docs using `.agent/progress.md` and `.agent/tech-context.md` as evidence.
   - Align feature guides (wiki, knowledge, onboarding, issues/tickets, MCP multi-agent, health) with As-Built Map.

**Output**

- For each doc: a checklist of required edits with pointers to evidence.

---

## Stage 3 – Evidence-Based Updates & Verification (Protocol Step 4.5)

**Goals**

- Perform doc edits only when backed by concrete evidence, and record that evidence.

**Tasks**

1. For each targeted doc:
   - Gather evidence from:
     - Code (routes, components, tools, models)
     - DB (Prisma schema, queries)
     - HTTP checks (`curl` for health/APIs, Cloudflare URLs)
     - Tests (relevant E2E/unit tests)
   - Capture summary + command outputs in session file under "Verification Results".

2. Apply edits in **waterfall order**:
   1. PRD + SRS
   2. Architecture
   3. Data & API
   4. Ops/Infra
   5. Backlog/Plan + feature guides

3. After significant sets of edits:
   - Run `pnpm type-check`, `pnpm lint`, and targeted tests.
   - Store results in session file.

**Output**

- Updated docs plus verification notes satisfying Step 4.5.

---

## Stage 4 – Final Consistency & Sign-Off

**Goals**

- Ensure documentation set is self-consistent and matches implementation.

**Tasks**

1. Re-scan:
   - `docs/README.md` / any index vs actual files.
   - Counts: core models, endpoints, MCP tools, major features.

2. Confirm:
   - No references to legacy Windows/Mac-split workflows as current.
   - No stale IP-based URLs where Cloudflare/localhost is correct.

3. Create an audit record:
   - `docs/audits/DOCUMENTATION_REALIGNMENT_2025-12-10.md` (or similar) summarizing:
     - Docs touched
     - Evidence sources
     - Outstanding TODOs (if any).

**Output**

- Final audit doc + confirmation that all planned updates are either complete or tracked as future work.

---

## Success Criteria

- All top-level docs reflect Sprint 11 as-built product and infra.
- No contradictions between PRD, SRS, Architecture, DB spec, API spec, and infra docs.
- Healthcheck and environment URLs are consistent across docs and match reality.
- Traceability preserved (Epics → US → FR → Tests where applicable).
- Protocol Steps 1–5 satisfied, including Step 4.5 (evidence recorded).

---

## Protocol Status

- **Step 1** – Session initialized: ✅ (current session file created)
- **Step 2** – Plan + todos: ✅ (this document + corresponding `current-todos.md`)
- **Step 3** – Expert consultation: ✅ (aligned with `project-brief.md`, `system-patterns.md`, `tech-context.md`, `03-Architecture.md`, `02-DATABASE-SCHEMA.md`, `03-MCP-SPECIFICATION.md` before implementation)
- **Step 4** – Checkpoints: will log at ~15K-token intervals in session file
- **Step 4.5** – Verification: evidence mandated per Stage 3
- **Step 5** – Post-completion: final audit + STATUS/plan/backlog updates

---

# Archived Plan – Sprint 8.7 Onboarding Test & Deployment Plan

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
