# E2E Project Initiation Test Plan (Local Docker • Demo Mode)

> **Status:** READY (local Docker, demo mode)
> **Created:** 2025-12-15
> **Last Updated:** 2025-12-16
> **Environment:** Web `http://localhost:3000` • MCP `http://localhost:3001/mcp`

---

## Overview

End-to-end **demo-mode** test for ProjectPulse’s complete project initiation flow:

- **Actor A (Web User / UI):** `dracogamer2897@gmail.com` creates the project and watches progress in the browser.
- **Actor B (Client Agent / MCP):** uses a project-scoped **agent token** to complete onboarding via MCP tools (JSON-RPC).

**Goal:** You can keep the UI open and watch the test project being populated live.

**Test User:** `dracogamer2897@gmail.com` (must own the project)
**Test Approach:** Dual-window (browser observation + terminal MCP runner)
**Content Level:** Demo-valid content (meets API validation); optional “full realistic content” pass later
**Post-Test:** Keep data for demo exploration (no cleanup)

---

## Test Flow Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│  Project Creation → Session 1 → Session 2 → Session 3 → Roadmap    │
│        ↓               ↓           ↓            ↓           ↓      │
│    [1 min]         [20 min]    [35 min]     [5 min]     [5 min]   │
└─────────────────────────────────────────────────────────────────────┘
                          Total: ~65-75 minutes
```

---

## Phase 1: Setup & Authentication (5 min)

### 1.1 Pre-flight Checks

```bash
# Verify local health (Docker)
curl http://localhost:3000/api/health
# Expected: {"status":"healthy","database":"connected"}
```

### 1.2 User Authentication

- Ensure `dracogamer2897@gmail.com` exists in the local DB.
  - If not, sign up via UI (`/login` → sign up) or use `POST /api/auth/signup`.
- Login via browser at `/login`.
- Keep this browser window open to observe onboarding progress:
  - `/onboarding?project={id}`
  - `/onboarding/session-1?project={id}`
  - `/onboarding/session-2?project={id}` and `/onboarding/session-2/documents?project={id}`
  - `/onboarding/session-3?project={id}`
  - `/wiki?project={id}`
  - `/roadmap?project={id}`

### UI Checkpoint 1

```
User verifies:
✅ Logged in as dracogamer2897@gmail.com
✅ Dashboard accessible
✅ Can see project list
```

---

## Phase 2: Project Creation (2 min)

### 2.1 Create Demo Project

Create the project **in the UI** while logged in as `dracogamer2897@gmail.com` (this guarantees correct ownership).

If you want to verify the exact API payload, the backend expects `repository` (not `repositoryUrl`):

```typescript
POST /api/projects
{
  "name": "TaskFlow Pro (E2E) - <timestamp>",
  "description": "AI-powered task management for development teams",
  "repository": "https://github.com/demo/taskflow-pro"
}
```

Capture `projectId` from the UI (URL query param `?project=...` or the network response).

### 2.2 Create Project-Scoped Agent Token (Required for MCP)

While still logged in as the same web user, create a project token:

```http
POST /api/projects/{projectId}/tokens
{ "name": "e2e-init-<timestamp>", "expiresInDays": 1 }
```

Practical option: run this in the browser DevTools console (while logged in):

```js
const projectId = /* paste projectId */;
await fetch(`/api/projects/${projectId}/tokens`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: `e2e-init-${Date.now()}`, expiresInDays: 1 }),
}).then((r) => r.json());
```

Save the returned plaintext `token` **immediately** (it is shown once).

### UI Checkpoint 2

```
User verifies:
✅ "TaskFlow Pro" appears in sidebar
✅ Project can be selected
✅ Dashboard shows 0 tickets, 0% onboarding
✅ "Start Setup" button visible in QuickActions
```

---

## Phase 3: Session 1 - Strategic Planning (20 min)

### 3.1 Complete 10 Phases (98 Questions)

| Phase | Focus                        | Questions | Duration |
| ----- | ---------------------------- | --------- | -------- |
| 1     | Product Manager - Foundation | 11        | ~2 min   |
| 2     | Strategic Planning           | 10        | ~2 min   |
| 3     | UX/UI Design                 | 9         | ~2 min   |
| 4     | System Architecture          | 12        | ~2 min   |
| 5     | DevOps & Local Dev           | 9         | ~2 min   |
| 6     | Backend Development          | 9         | ~2 min   |
| 7     | Frontend Development         | 9         | ~2 min   |
| 8     | QA & Testing                 | 9         | ~2 min   |
| 9     | Production Deployment        | 9         | ~2 min   |
| 10    | Security & Compliance        | 9         | ~2 min   |

### MCP-Driven Flow (Demo Mode)

In demo mode, the _agent_ runs Session 1 via MCP tools:

- `projectpulse_onboarding_getPhasedQuestions`
- `projectpulse_onboarding_savePhase`

Underlying APIs (for reference):

```typescript
GET  /api/onboarding/questions?projectId={id}&phase={1-10}
POST /api/onboarding/phase
```

**Answer key format:** question ids are `phase{phase}_q{questionNumber}` (e.g., `phase1_q1`).

### UI Checkpoint 3 (After Phase 5)

```
User navigates to: /onboarding/session-1?project={id}
User verifies:
✅ Phase Navigator shows phases 1-5 complete (checkmarks)
✅ Current position on Phase 6
✅ Progress bar shows ~50%
✅ Can click back to review previous phases
```

### 3.2 Executive Summary

In demo mode, use MCP to fetch the prompt and then store the generated summary:

```typescript
// Get prompt (preferred modern flow)
GET /api/onboarding/summary-prompt?projectId={id}

// Store summary (~500 words)
POST /api/onboarding/executive-summary
{
  "projectId": {id},
  "executiveSummary": "TaskFlow Pro is an AI-powered task management...",
  "wordCount": 523
}
```

MCP tool names:

- `projectpulse_onboarding_finalizeSummary` → returns `{ systemPrompt, userPrompt, metadata }`
- Generate summary using your LLM (manual step)
- `projectpulse_onboarding_storeExecutiveSummary`

### UI Checkpoint 4 (Session 1 Complete)

```
User navigates to: /onboarding?project={id}
User verifies:
✅ Session 1 card shows green "Complete" badge
✅ Session 2 card is now unlocked (no lock icon)
✅ Overall progress shows "1 of 3 sessions complete"
```

---

## Phase 4: Session 2 - Documentation (35 min)

### 4.1 Generate and Store the Canonical 15 Documents

**Do NOT hardcode the doc list.** Fetch the authoritative list from the API so filenames/categories always match validation rules.

```typescript
// Get prompts for all 15 docs (authoritative list)
GET /api/onboarding/document-prompts?projectId={id}
```

Then generate content for each returned `documentPrompts[]` and store via:

```typescript
POST /api/onboarding/documents
{
  "projectId": {id},
  "filename": "01-PRD.md",
  "content": "# ... (500-50000 chars)",
  "category": "planning",
  "wordCount": 3247,
  "overwrite": true
}
```

**Important validation constraints (current implementation):**

- `filename` must match `^\d{2}-[A-Za-z-]+\.md$` (so **no** `06-API/openapi.yaml`)
- `content` must be 500–50,000 characters

MCP tool names (recommended):

- `projectpulse_onboarding_getDocumentPrompts`
- `projectpulse_onboarding_storeDocument` (15 calls, use `overwrite:true` for re-runs)

### API Calls Per Document

```typescript
POST /api/onboarding/documents
{
  "projectId": {id},
  "filename": "01-PRD.md",
  "content": "# Product Requirements Document\n\n## 1. Product Vision...",
  "category": "planning",
  "wordCount": 3247
}
```

### UI Checkpoint 5 (After 5 Documents)

```
User navigates to: /onboarding/session-2?project={id}
User verifies:
✅ Progress bar shows 5/15 (33%)
✅ 5 document cards show green checkmarks
✅ Remaining 10 show "Generate" button state
✅ Category tabs update counts correctly
```

### UI Checkpoint 6 (After 10 Documents)

```
User verifies:
✅ Progress bar shows 10/15 (67%)
✅ Can click "View" on completed documents
✅ Document content displays correctly in viewer
```

### UI Checkpoint 7 (Session 2 Complete)

```
User navigates to: /onboarding?project={id}
User verifies:
✅ Sessions 1 & 2 show green "Complete" badges
✅ Session 3 is now unlocked
✅ Overall progress shows "2 of 3 sessions complete"
✅ Wiki shows synced documents
```

---

## Phase 5: Session 3 - Bootstrap (5 min)

### 5.1 Bootstrap (Single API Call)

Session 3 is performed by calling the bootstrap endpoint (or MCP wrapper).

```typescript
POST /api/onboarding/bootstrap
{
  "projectId": {id},
  "repoPath": "/tmp/taskflow-pro-demo-{id}"
}
```

**Note (current codebase reality):** the API returns `created.roadmap: null` (roadmap creation is decoupled). The MCP tool `projectpulse_onboarding_bootstrap` is currently **out of sync** with that response shape, so for this demo-mode plan, run Session 3 via the web API directly.

**Important (current behavior):**

- ✅ Creates personas/skills/workflows/SOPs
- ✅ Writes `CLAUDE.md` and `AGENTS.md` to `repoPath` **inside the server/container filesystem**
- ❌ Does **NOT** create roadmap records or CurrentPlan/CurrentTodos (expected `created.roadmap === null`)

### UI Checkpoint 8 (Session 3 Complete)

```
User navigates to: /onboarding/session-3?project={id}
User verifies:
✅ Success message displayed
✅ Stats grid shows:
   - Agent Personas: 5
   - Skills: 8
   - Workflows: 3
   - SOPs: 5
✅ Files written: CLAUDE.md, AGENTS.md
```

### UI Checkpoint 9 (All Sessions Complete)

```
User navigates to: /onboarding?project={id}
User verifies:
✅ All 3 sessions show green "Complete" badges
✅ Celebration card displayed
✅ "Setup Complete" status in dashboard
```

---

## Phase 6: Roadmap Creation (5 min)

### 6.1 Create & Materialize Roadmap

Preferred: create the roadmap via MCP (agent token auth):

- `projectpulse_roadmap_create` (with `startDate` as ISO datetime)

API (for reference):

```typescript
POST /api/roadmap
{
  "projectId": {id},
  "title": "TaskFlow Pro Development Roadmap",
  "startDate": "2025-01-06T00:00:00.000Z",
  "materialize": true,
  "phases": [
    {
      "title": "Phase 1: Foundation",
      "description": "Core infrastructure and auth",
      "sprints": [
        {
          "name": "Sprint 1: Setup",
          "duration": "2 weeks",
          "weeks": "Weeks 1-2",
          "goals": ["Setup project", "Auth"],
          "deliverables": ["Working auth", "Base UI"]
        }
      ]
    }
  ]
}
```

**Conflict handling (if roadmap already exists):**

1. `GET /api/roadmap?projectId={id}` to fetch roadmap id
2. `POST /api/roadmap/{roadmapId}/materialize` with `{ "force": true }`

### Expected Materialization Results

Counts depend on your phase/sprint structure and week ranges. For each sprint with `Weeks X-Y`, materialization creates:

- 1 `Week` record per week number in the range
- 5 `Day` records per week (Mon–Fri)

### UI Checkpoint 10 (Roadmap Visible)

```
User navigates to: /roadmap?project={id}
User verifies:
✅ Roadmap tree shows the phases you created
✅ Can expand phases to see sprints
✅ Can expand sprints to see weeks
✅ Week cards show days (Mon-Fri)
✅ Timeline view works (toggle available)
```

---

## Phase 7: Final Verification (5 min)

### 7.1 Database Verification

Verify via UI (preferred) and optionally via API/DB:

- Project exists and loads
- Onboarding shows Sessions 1–3 complete
- Wiki shows 15 synced docs
- Agents/Skills/SOPs/Workflows are visible for the project
- Roadmap loads and is navigable (if Phase 6 executed)

### 7.2 User Exploration

```
User explores freely:
✅ Dashboard shows updated stats
✅ Wiki pages accessible (15 documents synced)
✅ Agent personas visible at /agents
✅ Skills visible at /skills
✅ Roadmap fully navigable
✅ Can create first ticket
```

---

## Demo Mode Runner (Terminal + Browser)

This plan is intentionally **manual demo-mode** (no new test harness required).

### Terminal: MCP JSON-RPC Basics

Set these env vars in your terminal:

```bash
export MCP_URL="http://localhost:3001/mcp"
export AGENT_TOKEN="<paste token from POST /api/projects/{id}/tokens>"
export PROJECT_ID=123  # replace with your numeric projectId
```

List MCP tools (sanity check):

```bash
curl -sS "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

Call a tool:

```bash
curl -sS "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"projectpulse_onboarding_getPhasedQuestions\",\"arguments\":{\"projectId\":$PROJECT_ID,\"phase\":1}},\"id\":2}"
```

### Terminal: Ready-to-Paste Calls (Minimal Examples)

Save a phase (example shows 2 answers; in a real run, answer all question ids returned by `getPhasedQuestions`):

```bash
curl -sS "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"projectpulse_onboarding_savePhase\",\"arguments\":{\"projectId\":$PROJECT_ID,\"phase\":1,\"answers\":{\"phase1_q1\":\"TaskFlow Pro\",\"phase1_q2\":\"Small dev teams (2-5)\"}}},\"id\":3}"
```

Fetch the executive-summary prompt:

```bash
curl -sS "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"projectpulse_onboarding_finalizeSummary\",\"arguments\":{\"projectId\":$PROJECT_ID}},\"id\":4}"
```

Store the generated executive summary:

```bash
curl -sS "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"projectpulse_onboarding_storeExecutiveSummary\",\"arguments\":{\"projectId\":$PROJECT_ID,\"executiveSummary\":\"TaskFlow Pro is an AI-powered task management product for small dev teams. It helps plan, track, and ship work with clear roadmaps and lightweight automation...\"}},\"id\":5}"
```

Fetch document prompts:

```bash
curl -sS "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"projectpulse_onboarding_getDocumentPrompts\",\"arguments\":{\"projectId\":$PROJECT_ID}},\"id\":6}"
```

Store one document (repeat 15×; ensure `content.length >= 500`):

```bash
curl -sS "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"projectpulse_onboarding_storeDocument\",\"arguments\":{\"projectId\":$PROJECT_ID,\"filename\":\"01-PRD.md\",\"category\":\"planning\",\"overwrite\":true,\"content\":\"# PRD\\n\\n## Vision\\n\\nTaskFlow Pro helps small dev teams plan and ship work.\\n\\n## Goals\\n\\n- Reduce planning overhead\\n- Improve clarity\\n- Keep the loop tight\\n\\n(Repeat sections until >500 chars.)\\n\"}},\"id\":7}"
```

Run Session 3 bootstrap (direct API call; see note in Phase 5):

```bash
curl -sS "http://localhost:3000/api/onboarding/bootstrap" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -d "{\"projectId\":$PROJECT_ID,\"repoPath\":\"/tmp/taskflow-pro-demo-$PROJECT_ID\"}"
```

Create roadmap (MCP):

```bash
curl -sS "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"projectpulse_roadmap_create\",\"arguments\":{\"projectId\":$PROJECT_ID,\"title\":\"TaskFlow Pro Roadmap\",\"startDate\":\"2025-01-06T00:00:00.000Z\",\"materialize\":true,\"phases\":[{\"title\":\"Phase 1: Foundation\",\"sprints\":[{\"name\":\"Sprint 1: Setup\",\"weeks\":\"Weeks 1-2\"}]}]}},\"id\":8}"
```

### Browser: Monitoring

Keep `/onboarding?project={id}` open and refresh occasionally during the MCP run.

---

## Critical Files to Reference

| File                                             | Purpose                            |
| ------------------------------------------------ | ---------------------------------- |
| `apps/web/app/api/onboarding/phase/route.ts`     | Phase answers API schema           |
| `apps/web/app/api/onboarding/documents/route.ts` | Document storage validation        |
| `apps/web/prisma/seeds/onboarding-questions.ts`  | All 98 questions structure         |
| `apps/web/lib/onboarding/document-prompts.ts`    | 15 document templates              |
| `apps/web/app/api/onboarding/bootstrap/route.ts` | Session 3 bootstrap behavior       |
| `apps/web/app/api/roadmap/route.ts`              | Roadmap creation + materialization |

---

## Run Commands

There is currently **no** `pnpm run demo:onboarding` script or `apps/web/tests/e2e-onboarding-demo/` harness in this repo.
This plan runs via **browser + MCP JSON-RPC** (demo mode).

---

## Success Criteria

| Criterion                | Verification                                                                    |
| ------------------------ | ------------------------------------------------------------------------------- |
| All 3 sessions complete  | OnboardingSession status = 'complete'                                           |
| 10 phases answered       | `OnboardingSession(sessionNumber=1).planningAnswers` contains `phase1..phase10` |
| 15 documents generated   | Document count = 15                                                             |
| 5 personas created       | AgentPersona count = 5                                                          |
| Roadmap materialized     | Phase/Sprint/Week/Day records exist                                             |
| User can navigate all UI | Manual verification at checkpoints                                              |
| No errors in console     | No red errors in browser console during flow                                    |

---

## Risk Mitigation

| Risk                     | Mitigation                                       |
| ------------------------ | ------------------------------------------------ |
| Auth/token issues        | Generate a fresh project token (expiresInDays=1) |
| API timeout              | 30s timeout + 3 retries with backoff             |
| Content validation fails | Pre-validate all content before API calls        |
| Network issues           | Save progress after each successful step         |

---

## Post-Test

After successful completion:

1. User can login and explore "TaskFlow Pro" project
2. All onboarding data preserved for demo purposes
3. User can create tickets, use roadmap, reference wiki

---

## Notes for Future Review

- Session 1 questions seed references **98** questions; some summary templates mention **96** (treat as known inconsistency; functionality still works).
- Session 3 bootstrap currently skips roadmap creation (roadmap is created in Phase 6).
- Repo file writes happen on server/container filesystem unless you mount a host directory.
